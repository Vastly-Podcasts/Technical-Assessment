import logging
import ffmpeg
import os
import uuid
import cv2
import requests
import threading
import time
from urllib.parse import urlparse

# A lightweight face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_temp_path():
    temp_dir = os.path.join(os.path.dirname(__file__), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    random_filename = f"temp_{str(uuid.uuid4())[:8]}"
    return os.path.join(temp_dir, random_filename)


def get_temp_dir():
    """Get the temp directory path. Used for path validation."""
    return os.path.join(os.path.dirname(__file__), "temp")


def validate_temp_path(file_path):
    """
    Validate that a file path is within the temp directory.
    Prevents directory traversal attacks.
    
    Args:
        file_path: Path to validate (can be relative or absolute)
        
    Returns:
        str: Absolute path if valid
        
    Raises:
        ValueError: If path is outside temp directory
    """
    # Resolve to absolute path
    abs_path = os.path.abspath(file_path)
    
    # Get temp directory (also absolute)
    temp_dir = os.path.abspath(get_temp_dir())
    
    # Check that path starts with temp directory
    # Use os.path.commonpath to handle path normalization correctly
    try:
        common_path = os.path.commonpath([abs_path, temp_dir])
        if common_path != temp_dir:
            raise ValueError(f"Path {file_path} is outside temp directory")
    except ValueError:
        # commonpath raises ValueError if paths are on different drives (Windows)
        # In that case, check if they start with the same path
        if not abs_path.startswith(temp_dir):
            raise ValueError(f"Path {file_path} is outside temp directory")
    
    return abs_path


def validate_file_size(file_path, max_size_bytes):
    """
    Validate that a file size is within the limit.
    
    Args:
        file_path: Path to file
        max_size_bytes: Maximum allowed size in bytes
        
    Returns:
        int: File size in bytes
        
    Raises:
        ValueError: If file doesn't exist or exceeds size limit
    """
    if not os.path.exists(file_path):
        raise ValueError(f"File does not exist: {file_path}")
    
    file_size = os.path.getsize(file_path)
    if file_size > max_size_bytes:
        max_size_mb = max_size_bytes / (1024 * 1024)
        file_size_mb = file_size / (1024 * 1024)
        raise ValueError(
            f"File too large: {file_size_mb:.2f}MB (max {max_size_mb:.2f}MB)"
        )
    
    return file_size


# File size limits per operation (in bytes)
MAX_FILE_SIZE_ANALYSIS = 1 * 1024 * 1024 * 1024  # 1GB
MAX_FILE_SIZE_EXPORT = 500 * 1024 * 1024  # 500MB
MAX_FILE_SIZE_TRIM = 2 * 1024 * 1024 * 1024  # 2GB
MAX_FILE_SIZE_UPLOAD = 1 * 1024 * 1024 * 1024  # 1GB (for upload endpoint)
MAX_FILE_SIZE_URL_DOWNLOAD = 500 * 1024 * 1024  # 500MB (for URL downloads)


def download_video_from_url(url, max_size_bytes=MAX_FILE_SIZE_URL_DOWNLOAD, timeout=30):
    """
    Download video from URL with security checks.
    
    Args:
        url: URL to download from (must be http or https)
        max_size_bytes: Maximum file size in bytes (default 500MB)
        timeout: Download timeout in seconds (default 30s)
        
    Returns:
        str: Local file path where video was saved
        
    Raises:
        ValueError: If URL is invalid, not http/https, or file too large
        requests.RequestException: If download fails
    """
    # Validate URL scheme (prevent SSRF attacks)
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError(f"Invalid URL scheme: {parsed.scheme}. Only http/https allowed.")
    
    # Prevent localhost/internal network access (SSRF protection)
    hostname = parsed.hostname
    if hostname:
        # Block localhost and private IP ranges
        blocked_hosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
        if hostname.lower() in blocked_hosts:
            raise ValueError("Localhost URLs are not allowed")
        
        # Block private IP ranges (basic check)
        if hostname.startswith('192.168.') or hostname.startswith('10.') or hostname.startswith('172.'):
            raise ValueError("Private network URLs are not allowed")
    
    # Generate temp file path
    output_path = get_temp_path()
    # Add extension if URL has one
    url_path = parsed.path
    if url_path and '.' in os.path.basename(url_path):
        ext = os.path.splitext(url_path)[1]
        if ext:
            output_path += ext
    
    try:
        # Download with streaming to check size
        response = requests.get(url, stream=True, timeout=timeout)
        response.raise_for_status()
        
        # Check content length if available
        content_length = response.headers.get('Content-Length')
        if content_length:
            size = int(content_length)
            if size > max_size_bytes:
                max_size_mb = max_size_bytes / (1024 * 1024)
                size_mb = size / (1024 * 1024)
                raise ValueError(
                    f"File too large: {size_mb:.2f}MB (max {max_size_mb:.2f}MB)"
                )
        
        # Download with size limit
        downloaded_size = 0
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    
                    # Check size during download
                    if downloaded_size > max_size_bytes:
                        os.remove(output_path)  # Clean up partial file
                        max_size_mb = max_size_bytes / (1024 * 1024)
                        size_mb = downloaded_size / (1024 * 1024)
                        raise ValueError(
                            f"File too large: {size_mb:.2f}MB (max {max_size_mb:.2f}MB)"
                        )
        
        # Validate downloaded file
        validate_temp_path(output_path)
        
        return output_path
        
    except requests.RequestException as e:
        # Clean up partial file if it exists
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass
        raise ValueError(f"Failed to download video: {str(e)}")


# Store uploaded videos: {video_id: file_path}
_uploaded_videos = {}

# Job management system
_jobs = {}
_jobs_lock = threading.Lock()


def create_job():
    """
    Create a new job and return its ID.
    
    Returns:
        str: Job ID
    """
    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            'status': 'pending',
            'progress': 0,
            'result': None,
            'error': None,
            'created_at': time.time()
        }
    logger.info(f"Job created: {job_id}")
    return job_id


def update_job(job_id, status=None, progress=None, result=None, error=None):
    """
    Update job status.
    
    Args:
        job_id: Job ID
        status: New status ('pending', 'processing', 'completed', 'failed')
        progress: Progress percentage (0-100)
        result: Result data (when completed)
        error: Error message (when failed)
    """
    with _jobs_lock:
        if job_id not in _jobs:
            raise ValueError(f"Job not found: {job_id}")
        
        if status:
            _jobs[job_id]['status'] = status
        if progress is not None:
            _jobs[job_id]['progress'] = progress
        if result is not None:
            _jobs[job_id]['result'] = result
        if error is not None:
            _jobs[job_id]['error'] = error


def get_job(job_id):
    """
    Get job status.
    
    Args:
        job_id: Job ID
        
    Returns:
        dict: Job status, progress, result, error
        
    Raises:
        ValueError: If job not found
    """
    with _jobs_lock:
        if job_id not in _jobs:
            raise ValueError(f"Job not found: {job_id}")
        return _jobs[job_id].copy()


def process_in_background(func, *args, job_id=None, **kwargs):
    """
    Process a function in background thread and update job status.
    
    Args:
        func: Function to execute
        *args: Positional arguments for func
        job_id: Job ID (if None, creates new job)
        **kwargs: Keyword arguments for func (except 'update_progress')
        
    Returns:
        str: Job ID
    """
    if job_id is None:
        job_id = create_job()
    
    def worker():
        try:
            update_job(job_id, status='processing', progress=0)
            
            # Create progress callback
            def update_progress(progress_value):
                update_job(job_id, progress=progress_value)
            
            # Call function with progress callback
            result = func(*args, update_progress=update_progress, **kwargs)
            
            update_job(job_id, status='completed', progress=100, result=result)
            logger.info(f"Job completed: {job_id}")
            
        except Exception as e:
            error_msg = str(e)
            update_job(job_id, status='failed', error=error_msg)
            logger.error(f"Job failed: {job_id} - {error_msg}")
    
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    
    return job_id


def get_video_path(video_id=None, video_url=None):
    """
    Get local file path for video from either upload ID or URL.
    Unified helper for all video processing endpoints.
    
    Args:
        video_id: Video ID from upload endpoint (optional)
        video_url: External URL to download (optional)
        
    Returns:
        str: Local file path
        
    Raises:
        ValueError: If neither or both provided, or if video not found
    """
    if video_id and video_url:
        raise ValueError("Provide either video_id or video_url, not both")
    
    if not video_id and not video_url:
        raise ValueError("Provide either video_id or video_url")
    
    if video_id:
        # Get path from uploaded videos
        if video_id not in _uploaded_videos:
            raise ValueError(f"Video ID not found: {video_id}")
        
        file_path = _uploaded_videos[video_id]
        
        # Validate path exists and is readable
        if not os.path.exists(file_path):
            # Clean up stale reference
            del _uploaded_videos[video_id]
            raise ValueError(f"Video file not found: {video_id}")
        
        # Validate path is in temp directory
        validate_temp_path(file_path)
        
        return file_path
    
    if video_url:
        # Download from URL
        return download_video_from_url(video_url)


def cleanup_temp_file(file_path):
    """
    Safely delete a temp file.
    
    Args:
        file_path: Path to file to delete
    """
    try:
        if os.path.exists(file_path):
            # Validate path before deletion (security)
            validate_temp_path(file_path)
            os.remove(file_path)
            logger.info(f"Cleaned up temp file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temp file {file_path}: {e}")


def cleanup_old_temp_files(max_age_seconds=3600):
    """
    Clean up temp files older than max_age_seconds.
    Should be called periodically.
    
    Args:
        max_age_seconds: Maximum age of files to keep (default 1 hour)
    """
    temp_dir = get_temp_dir()
    if not os.path.exists(temp_dir):
        return
    
    current_time = time.time()
    cleaned_count = 0
    
    try:
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            try:
                # Validate path
                validate_temp_path(file_path)
                
                # Check age
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > max_age_seconds:
                    os.remove(file_path)
                    cleaned_count += 1
            except (ValueError, OSError) as e:
                # Skip files outside temp dir or other errors
                logger.debug(f"Skipping file {file_path}: {e}")
        
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} old temp files")
    except Exception as e:
        logger.error(f"Error during temp file cleanup: {e}")