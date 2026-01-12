# Plan: Video Editing & Analysis with OpenCV + FFmpeg

## Goal
Add video editing and analysis capabilities: metadata extraction, scene detection, motion analysis, export, and trimming.

## Done-When
- [ ] **Foundation**: File upload/download mechanism works (upload endpoint + URL download helper)
- [ ] **Foundation**: Async processing with job IDs for long operations (export, analysis)
- [ ] **Foundation**: Temp file cleanup (automatic deletion after processing)
- [ ] **Foundation**: File size limits enforced (DoS protection)
- [ ] `/api/video/analyze` returns metadata (duration, fps, resolution, codec, size)
- [ ] `/api/video/detect-scenes` returns scene change timestamps (async job)
- [ ] `/api/video/analyze-motion` returns motion regions/stats (async job)
- [ ] `/api/video/export` processes video with filters + segmentation, returns download URL (async job)
- [ ] `/api/video/trim` cuts video segments without quality loss
- [ ] `/api/video/jobs/<job_id>` returns job status and progress
- [ ] All endpoints handle errors gracefully with cleanup
- [ ] Works with mp4, webm, mov formats

## Solution

**Chosen:** Use existing libraries (ffmpeg-python, opencv-python) with minimal custom code
**Why:** Simplest - no new dependencies, already installed, well-documented APIs
**Code:** ~250 lines total (5 endpoints + 5 helpers)
**Deps:** None new (ffmpeg-python, opencv-python already in requirements.txt)

See `.claude/research/video-editing-analysis-research.md` for alternatives considered.

## Solution Exploration

### Feature 1: Video Analysis (Metadata)
**Solution 1: FFmpeg probe** (chosen)
- How: `ffmpeg.probe()` extracts all metadata in one call
- Code: ~15 lines
- Pros: Fast, no frame reading, comprehensive data
- Cons: None
- Complexity: Simple

**Solution 2: OpenCV VideoCapture properties**
- How: Read video properties via `cap.get()`
- Code: ~20 lines
- Pros: No FFmpeg dependency
- Cons: Less metadata, slower, may not work for all formats
- Complexity: Simple but limited

**Solution 3: MediaInfo library**
- How: Use `pymediainfo` package
- Code: ~10 lines
- Pros: Very detailed metadata
- Cons: New dependency, overkill
- Complexity: Simple but unnecessary

### Feature 2: Scene Detection
**Solution 1: Histogram comparison** (chosen)
- How: Compare frame histograms, detect large differences
- Code: ~40 lines
- Pros: Simple, fast with frame skipping
- Cons: May miss gradual transitions
- Complexity: Simple

**Solution 2: SSIM comparison**
- How: Structural similarity index between frames
- Code: ~50 lines
- Pros: More accurate
- Cons: Slower, requires scikit-image
- Complexity: Medium

**Solution 3: pySceneDetect library**
- How: Use `scenedetect` package
- Code: ~20 lines
- Pros: Battle-tested, handles edge cases
- Cons: New dependency
- Complexity: Simple but adds dependency

### Feature 3: Motion Analysis
**Solution 1: Farneback optical flow** (chosen)
- How: Dense optical flow, calculate magnitude
- Code: ~50 lines
- Pros: Built into OpenCV, good accuracy
- Cons: Slower than sparse methods
- Complexity: Medium

**Solution 2: Lucas-Kanade sparse flow**
- How: Track keypoints, calculate motion
- Code: ~60 lines
- Pros: Faster
- Cons: Less complete coverage, more code
- Complexity: Medium

**Solution 3: Background subtraction**
- How: Use MOG2/KNN background subtractor
- Code: ~40 lines
- Pros: Simple, fast
- Cons: Less accurate for complex scenes
- Complexity: Simple but less accurate

### Feature 4: Video Export
**Solution 1: OpenCV + FFmpeg pipeline** (chosen)
- How: OpenCV reads frames, applies filter, FFmpeg encodes
- Code: ~80 lines
- Pros: Full control, works with existing filters
- Cons: More complex
- Complexity: Medium

**Solution 2: Pure FFmpeg filters**
- How: Use FFmpeg filter_complex for effects
- Code: ~30 lines
- Pros: Very fast, no Python processing
- Cons: Can't use MediaPipe segmentation easily
- Complexity: Simple but limited

**Solution 3: MoviePy library**
- How: Use `moviepy` for processing
- Code: ~40 lines
- Pros: High-level API
- Cons: New dependency, slower, overkill
- Complexity: Simple but unnecessary

### Feature 5: Video Trimming
**Solution 1: FFmpeg codec copy** (chosen)
- How: `-ss` and `-t` with `-c copy`
- Code: ~20 lines
- Pros: Instant, no quality loss, no re-encoding
- Cons: None
- Complexity: Simple

**Solution 2: OpenCV frame extraction + re-encode**
- How: Read frames, write new video
- Code: ~40 lines
- Pros: More control
- Cons: Slow, quality loss, unnecessary
- Complexity: Medium but worse

**Solution 3: FFmpeg re-encode**
- How: Same as Solution 1 but with encoding
- Code: ~25 lines
- Pros: Works when codec copy doesn't
- Cons: Slow, quality loss
- Complexity: Simple but suboptimal

## Prerequisites (Foundation - Must Complete First)

### Phase 0: File Input Infrastructure

1. [ ] **File Upload Endpoint** (`POST /api/upload`)
   - Accept `multipart/form-data` with `video` field
   - Validate file type (MIME: `video/*`, extensions: `.mp4`, `.webm`, `.mov`)
   - Validate file size (max 500MB for analysis, 1GB for export)
   - Save to temp directory using `get_temp_path()`
   - Return `{"video_id": "...", "path": "..."}` for processing
   - Code: ~40 lines in `main.py` + validation helper

2. [ ] **URL Download Helper** (`download_video_from_url()` in `helpers.py`)
   - Accept URL, validate (must be http/https)
   - Download with timeout (30s), size limit (500MB)
   - Save to temp directory
   - Return local path
   - Code: ~30 lines

3. [ ] **Unified Video Input Helper** (`get_video_path()` in `helpers.py`)
   - Accept either `video_id` (from upload) or `video_url` (external URL)
   - Handle both cases, return local file path
   - Validate path exists and is readable
   - Code: ~20 lines

4. [ ] **Path Security Validation** (`validate_temp_path()` in `helpers.py`)
   - Resolve to absolute path
   - Check path starts with temp directory
   - Reject paths outside temp directory (prevent directory traversal)
   - Code: ~10 lines

5. [ ] **File Size Limits** (per operation)
   - Analysis: 1GB max
   - Export: 500MB max (processing time limit)
   - Trim: 2GB max (codec copy is fast)
   - Check before processing, return clear error
   - Code: ~15 lines (validation helper)

### Phase 1: Async Processing Infrastructure

6. [ ] **Job Management System** (`job_manager.py` or in `helpers.py`)
   - Store jobs in memory dict: `{job_id: {status, progress, result, error}}`
   - Job statuses: `pending`, `processing`, `completed`, `failed`
   - Thread-safe (use `threading.Lock`)
   - Code: ~50 lines

7. [ ] **Background Processing Helper** (`process_in_background()` in `helpers.py`)
   - Accept function and args
   - Run in `threading.Thread`
   - Update job status/progress
   - Handle errors, update job on failure
   - Code: ~30 lines

8. [ ] **Job Status Endpoint** (`GET /api/video/jobs/<job_id>`)
   - Return job status, progress (0-100), result (if complete), error (if failed)
   - Code: ~15 lines

9. [ ] **Temp File Cleanup**
   - Delete temp files immediately after processing (try/finally)
   - Delete on error (try/finally)
   - Periodic cleanup job (delete files older than 1 hour) - optional but recommended
   - Code: ~20 lines (cleanup helper + periodic task)

### Phase 2: Segmentation for Export

10. [ ] **MediaPipe Python Integration** (for video export)
    - Add `mediapipe` to `requirements.txt` (if not already)
    - Create `segment_frame()` helper using `mediapipe.solutions.selfie_segmentation`
    - Apply mask: `background = filtered_frame * (1 - mask) + original_frame * mask`
    - Code: ~40 lines

## Implementation Steps

### Phase 3: Video Analysis (Synchronous - Fast)

11. [ ] **Video Analysis**: Add `analyze_video()` helper using `ffmpeg.probe()`
    - Extract: duration, fps, resolution, codec, bitrate, file size
    - Use `get_video_path()` to handle input
    - Validate file size (1GB max)
    - Code: ~25 lines

12. [ ] **Analysis Endpoint**: Create `POST /api/video/analyze`
    - Accept `video_id` or `video_url` in JSON body
    - Call `analyze_video()`
    - Return metadata JSON
    - Cleanup temp files on error
    - Code: ~20 lines

### Phase 4: Scene Detection (Async - Can Be Slow)

13. [ ] **Scene Detection**: Add `detect_scenes()` helper
    - Use histogram comparison (skip every 30th frame for speed)
    - Detect large histogram differences (>threshold)
    - Return timestamps of scene changes
    - Make frame skip configurable (default 30, allow 1-60)
    - Code: ~50 lines

14. [ ] **Scene Detection Endpoint**: Create `POST /api/video/detect-scenes`
    - Accept `video_id` or `video_url`, optional `frame_skip` (default 30)
    - Create job, process in background
    - Return job ID immediately
    - Cleanup temp files in finally block
    - Code: ~25 lines

### Phase 5: Motion Analysis (Async - Can Be Slow)

15. [ ] **Motion Analysis**: Add `analyze_motion()` helper
    - Use Farneback optical flow (dense)
    - Calculate motion magnitude per frame
    - Return motion regions/stats (heatmap data or summary stats)
    - Skip frames for speed (every 10th frame)
    - Code: ~60 lines

16. [ ] **Motion Analysis Endpoint**: Create `POST /api/video/analyze-motion`
    - Accept `video_id` or `video_url`
    - Create job, process in background
    - Return job ID immediately
    - Cleanup temp files in finally block
    - Code: ~25 lines

### Phase 6: Video Trimming (Synchronous - Fast with Codec Copy)

17. [ ] **Video Trimming**: Add `trim_video()` helper
    - Use FFmpeg codec copy (`-ss start -t duration -c copy`)
    - Try codec copy first, catch errors
    - Fallback to re-encode if codec copy fails (log when fallback used)
    - Return output path
    - Code: ~40 lines

18. [ ] **Trimming Endpoint**: Create `POST /api/video/trim`
    - Accept `video_id` or `video_url`, `start_time`, `duration`
    - Validate times (start >= 0, duration > 0, start + duration <= video length)
    - Call `trim_video()`
    - Return download URL or file path
    - Cleanup temp files on error
    - Code: ~30 lines

### Phase 7: Video Export (Async - Very Slow)

19. [ ] **Video Export**: Add `export_video()` helper
    - Use MediaPipe Python for segmentation (per frame)
    - OpenCV read frames, apply segmentation mask
    - Apply filter to background only: `background = filtered_frame * (1 - mask) + original_frame * mask`
    - FFmpeg encode output video
    - Process in chunks (5-minute segments) for long videos to prevent OOM
    - Release frames immediately after processing
    - Code: ~120 lines

20. [ ] **Export Endpoint**: Create `POST /api/video/export`
    - Accept `video_id` or `video_url`, `filter_id` (from AVAILABLE_FILTERS)
    - Validate file size (500MB max for export)
    - Validate video length (30 minutes max for export)
    - Create job, process in background
    - Return job ID immediately
    - Cleanup temp files in finally block
    - Code: ~30 lines

**Key Implementation Notes:**
- **Path Security**: Always use `validate_temp_path()` before accessing files
- **File Cleanup**: Use try/finally blocks to ensure temp files deleted even on error
- **Memory Management**: Always use try/finally to release VideoCapture (prevent memory leaks)
- **Frame Validation**: Check `ret` from `cap.read()` before processing frames (handle None)
- **Async Operations**: Export, scene detection, motion analysis must be async (return job IDs)
- **Sync Operations**: Analysis and trim can be sync (fast enough)
- **Error Recovery**: For long operations, consider saving partial results (optional enhancement)
- **Codec Copy Fallback**: Trimming should try codec copy first, fallback to re-encode on error
- **Segmentation**: Export MUST use MediaPipe Python to match frontend behavior

## Validate

### Foundation Tests
- [ ] File upload accepts valid videos, rejects invalid types/sizes
- [ ] URL download works with valid URLs, rejects invalid/malicious URLs
- [ ] Path validation prevents directory traversal attacks
- [ ] Temp files are deleted after processing (check disk space)
- [ ] Temp files are deleted on error (test with corrupted video)
- [ ] File size limits enforced (test with files exceeding limits)

### Async Processing Tests
- [ ] Job creation returns job ID immediately
- [ ] Job status endpoint returns correct status/progress
- [ ] Long operations don't block other requests (test concurrent requests)
- [ ] Job errors are captured and returned in status
- [ ] Multiple concurrent jobs work correctly

### Feature Tests
- [ ] Video analysis returns correct metadata for mp4, webm, mov
- [ ] Scene detection finds scene changes (test with video containing cuts)
- [ ] Scene detection handles gradual transitions (may miss some - expected)
- [ ] Motion analysis detects motion regions
- [ ] Video trimming works with codec copy (no quality loss)
- [ ] Video trimming falls back to re-encode when codec copy fails
- [ ] Video export applies filter to background only (not person)
- [ ] Video export matches frontend preview behavior
- [ ] All endpoints handle errors gracefully (invalid files, missing params)
- [ ] Memory leaks prevented (VideoCapture released, check with long videos)

### Edge Cases
- [ ] Empty video file
- [ ] Very long video (1+ hour) - export should process in chunks
- [ ] Corrupted video file
- [ ] Missing video file (404)
- [ ] Invalid time ranges for trimming
- [ ] Concurrent requests to same endpoint
- [ ] Job ID that doesn't exist

### Security Tests
- [ ] Directory traversal attempts blocked (`../../../etc/passwd`)
- [ ] File size limits prevent DoS
- [ ] URL validation prevents SSRF (test with `file://`, `localhost`, etc.)
- [ ] Temp files not accessible to other users (if multi-user)

### Code Quality
- [ ] Run linter, check code follows existing patterns
- [ ] Type hints where appropriate
- [ ] Error messages are clear and helpful
- [ ] Logging for debugging (job creation, errors, cleanup)

**Reference:** See `.claude/research/video-editing-analysis-research.md` for common pitfalls and fixes.
**Review:** See `.claude/reviews/video-editing-analysis-teardown.md` for critical issues addressed.

## Critical Issues Addressed (from Teardown Review)

✅ **File Input Mechanism**: Added Phase 0 with upload endpoint, URL download, unified input helper
✅ **Async Processing**: Added Phase 1 with job management system, background processing, status endpoint
✅ **Temp File Cleanup**: Added cleanup in try/finally blocks, periodic cleanup job
✅ **File Size Limits**: Added validation with different limits per operation (analysis: 1GB, export: 500MB, trim: 2GB)
✅ **Segmentation for Export**: Added Phase 2 with MediaPipe Python integration, mask application logic
✅ **Path Security**: Added `validate_temp_path()` helper to prevent directory traversal
✅ **Error Recovery**: Added cleanup in finally blocks, error handling in job system
✅ **Progress Tracking**: Added job status endpoint with progress updates

**Remaining Concerns (Optional Enhancements):**
- Scene detection accuracy trade-off documented (frame skipping may miss quick changes)
- Codec copy fallback implemented (try copy, fallback to re-encode)
- Memory usage for long videos addressed (process in chunks, release frames immediately)
- Partial results for failed long operations (optional - can add later if needed)

---
Created: 2026-01-12
Updated: 2026-01-12 (addressed all critical issues from teardown review)
Status: READY FOR EXECUTION (foundation must be built first)
