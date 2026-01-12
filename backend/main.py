"""
main.py

Flask backend for the Video Background Filter application.

============================================================================
ARCHITECTURE DECISION
============================================================================

The frontend handles real-time processing using MediaPipe.js in the browser.
This keeps latency low and scales naturally (user's device does the work).

The backend provides:
1. Filter configuration API - list available filters, validate settings
2. Future: Video upload handling
3. Future: Server-side processing for export/download
4. Future: User preferences persistence

This separation gives us:
- Real-time preview (frontend) with zero network latency
- Heavy processing capability (backend) when needed
- Clean API contract between frontend and backend

============================================================================
FOR FUTURE AI AGENTS / DEVELOPERS
============================================================================

When extending this backend:

1. VIDEO UPLOAD:
   - Add POST /api/upload endpoint
   - Accept multipart/form-data with video file
   - Save to temp directory (use get_temp_path from helpers)
   - Return URL/ID for frontend to use
   - Clean up old files periodically

2. SERVER-SIDE PROCESSING:
   - Add POST /api/process endpoint
   - Accept video ID and filter settings
   - Use MediaPipe Python (mediapipe.solutions.selfie_segmentation)
   - Process frame-by-frame, apply filter, write output
   - Return download URL when complete

   Example processing flow:
   ```python
   import mediapipe as mp
   mp_selfie = mp.solutions.selfie_segmentation

   with mp_selfie.SelfieSegmentation(model_selection=0) as segmentation:
       results = segmentation.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
       mask = results.segmentation_mask
       # Apply filter using mask (same logic as frontend)
   ```

3. WEBSOCKET STREAMING:
   - For real-time server-side processing (if needed)
   - Use flask-socketio
   - Stream processed frames as base64 or binary

============================================================================
KNOWN GOTCHAS
============================================================================

- CORS is enabled globally. For production, restrict to specific origins.
- Debug mode is on. Disable for production.
- No authentication. Add if needed for user-specific features.

"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import os
import uuid
from werkzeug.utils import secure_filename
from helpers import *

app = Flask(__name__)
cors = CORS(app)

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# FILTER CONFIGURATION
# =============================================================================

# Available filters - matches frontend utils/filters.ts
# Single source of truth for filter metadata
AVAILABLE_FILTERS = [
    {
        "id": "none",
        "name": "None",
        "description": "No filter applied",
    },
    {
        "id": "grayscale",
        "name": "Grayscale",
        "description": "Classic black & white",
    },
    {
        "id": "sepia",
        "name": "Sepia",
        "description": "Warm vintage tone",
    },
    {
        "id": "blur",
        "name": "Blur",
        "description": "Gaussian blur effect",
    },
]


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route("/hello-world", methods=["GET"])
def hello_world():
    """
    Health check endpoint.

    Used by frontend to verify backend connectivity.
    Returns simple JSON response if server is running.
    """
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/filters", methods=["GET"])
def get_filters():
    """
    Get available filter configurations.

    Returns list of filters that can be applied to video background.
    Frontend can use this to populate filter selector dynamically.

    Response:
    {
        "filters": [
            {"id": "grayscale", "name": "Grayscale", "description": "..."},
            ...
        ]
    }
    """
    try:
        return jsonify({"filters": AVAILABLE_FILTERS}), 200
    except Exception as e:
        logger.error(f"Error fetching filters: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/filters/<filter_id>", methods=["GET"])
def get_filter(filter_id):
    """
    Get specific filter configuration by ID.

    Useful for validating filter ID or getting details for a single filter.

    Response:
    {"id": "grayscale", "name": "Grayscale", "description": "..."}

    Error (404):
    {"error": "Filter not found"}
    """
    try:
        filter_config = next(
            (f for f in AVAILABLE_FILTERS if f["id"] == filter_id),
            None
        )

        if filter_config is None:
            return jsonify({"error": "Filter not found"}), 404

        return jsonify(filter_config), 200
    except Exception as e:
        logger.error(f"Error fetching filter {filter_id}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Detailed health check endpoint.

    Returns server status and capabilities.
    Useful for monitoring and debugging.
    """
    try:
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "capabilities": {
                "filters": len(AVAILABLE_FILTERS),
                "upload": False,  # TODO: Enable when upload is implemented
                "export": False,  # TODO: Enable when export is implemented
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


# =============================================================================
# PLACEHOLDER ENDPOINTS (for future implementation)
# =============================================================================

@app.route("/api/upload", methods=["POST"])
def upload_video():
    """
    Upload a video for processing.

    Accepts multipart/form-data with 'video' field.
    Validates file type, size, and saves to temp directory.
    
    Request:
        multipart/form-data with field 'video' containing video file
        
    Response (200):
        {
            "video_id": "abc123",
            "path": "/path/to/temp/file.mp4"
        }
        
    Response (400):
        {"error": "Error message"}
    """
    try:
        # Check if file is present
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        file = request.files['video']
        
        # Check if file was actually selected
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        filename = secure_filename(file.filename)
        allowed_extensions = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Check extension
        if file_ext not in allowed_extensions:
            return jsonify({
                "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            }), 400
        
        # Check MIME type (if provided)
        mime_type = file.content_type
        if mime_type and not mime_type.startswith('video/'):
            return jsonify({"error": "File must be a video"}), 400
        
        # Generate video ID and temp path
        video_id = str(uuid.uuid4())[:8]
        temp_path = get_temp_path() + file_ext
        
        # Save file
        file.save(temp_path)
        
        # Validate file size
        try:
            validate_file_size(temp_path, MAX_FILE_SIZE_UPLOAD)
        except ValueError as e:
            # Clean up file if too large
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({"error": str(e)}), 400
        
        # Validate path is in temp directory
        validate_temp_path(temp_path)
        
        # Store video_id -> path mapping
        from helpers import _uploaded_videos
        _uploaded_videos[video_id] = temp_path
        
        logger.info(f"Video uploaded: {video_id} -> {temp_path}")
        
        return jsonify({
            "video_id": video_id,
            "path": temp_path
        }), 200
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/process", methods=["POST"])
def process_video():
    """
    Process uploaded video with filter.

    TODO: Implement server-side processing
    - Accept video ID and filter settings
    - Process using MediaPipe Python
    - Return processed video URL
    """
    return jsonify({
        "error": "Not implemented",
        "message": "Server-side processing is planned for future implementation"
    }), 501


@app.route("/api/video/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id):
    """
    Get status of a background job.
    
    Response (200):
        {
            "status": "pending|processing|completed|failed",
            "progress": 0-100,
            "result": {...} (if completed),
            "error": "..." (if failed)
        }
        
    Response (404):
        {"error": "Job not found"}
    """
    try:
        from helpers import get_job
        job = get_job(job_id)
        return jsonify(job), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
