# Plan: Video Editing & Analysis with OpenCV + FFmpeg

## Goal
Add comprehensive video editing and analysis capabilities using OpenCV and FFmpeg, including video metadata extraction, scene detection, motion analysis, video export, and trimming functionality.

## Done-When
- [ ] Video analysis endpoint returns metadata (duration, fps, resolution, codec, file size)
- [ ] Scene detection endpoint identifies scene changes/cuts in video
- [ ] Motion analysis endpoint detects and visualizes motion regions using optical flow
- [ ] Video export endpoint processes video with filters and returns downloadable file
- [ ] Video trimming endpoint allows cutting/trimming video segments
- [ ] All endpoints handle errors gracefully with clear error messages
- [ ] Frontend can call these endpoints and display results
- [ ] Processing works with common video formats (mp4, webm, mov)

## Assumptions (Confirmed)
- **Tech Stack**: Python 3.9+, Flask, OpenCV 4.x, FFmpeg-python
- **Dependencies**: opencv-python, ffmpeg-python already installed (check requirements.txt)
- **File Location**: Backend endpoints in `backend/main.py`, helper functions in `backend/helpers.py`
- **Naming**: Follow existing patterns (snake_case for Python, RESTful API endpoints)
- **Error Handling**: Return JSON error responses with appropriate HTTP status codes
- **Video Storage**: Use temp directory from `helpers.get_temp_path()` for processing
- **Performance**: Processing may be slow for long videos - consider async processing or progress updates
- **FFmpeg**: System FFmpeg binary must be available (ffmpeg-python is a wrapper)

## Implementation Steps

### Phase 1: Video Analysis (Metadata Extraction)

1. [ ] Create `analyze_video()` helper function in `helpers.py`
   - Use FFmpeg to probe video file and extract metadata
   - Extract: duration, fps, resolution (width/height), codec, bitrate, file size
   - Use `ffmpeg.probe()` for metadata extraction
   - Return structured dictionary with all metadata

2. [ ] Create `GET /api/video/analyze` endpoint in `main.py`
   - Accept video URL or video file upload
   - Call `analyze_video()` helper
   - Return JSON response with metadata
   - Handle errors (invalid file, FFmpeg errors, etc.)

3. [ ] Test with sample videos
   - Test with different formats (mp4, webm, mov)
   - Verify all metadata fields are correct
   - Test error handling

### Phase 2: Scene Detection

4. [ ] Create `detect_scenes()` helper function in `helpers.py`
   - Use OpenCV to read video frame-by-frame
   - Calculate frame differences using histogram comparison or SSIM
   - Detect significant changes (scene cuts)
   - Return list of timestamps where scenes change
   - Use threshold to filter out minor changes

5. [ ] Create `POST /api/video/detect-scenes` endpoint
   - Accept video URL or file upload
   - Optional parameters: threshold (sensitivity), min_scene_length
   - Call `detect_scenes()` helper
   - Return JSON with scene change timestamps
   - Handle errors gracefully

6. [ ] Test scene detection
   - Test with videos that have clear scene changes
   - Test with videos that have gradual transitions
   - Verify timestamps are accurate

### Phase 3: Motion Analysis

7. [ ] Create `analyze_motion()` helper function in `helpers.py`
   - Use OpenCV optical flow (Farneback or Lucas-Kanade)
   - Calculate motion vectors between consecutive frames
   - Identify regions with significant motion
   - Return motion heatmap or motion regions
   - Optionally return motion magnitude statistics

8. [ ] Create `POST /api/video/analyze-motion` endpoint
   - Accept video URL or file upload
   - Optional parameters: method (farneback/lucas-kanade), threshold
   - Call `analyze_motion()` helper
   - Return JSON with motion data or motion visualization
   - Consider returning frame-by-frame motion data or summary

9. [ ] Test motion analysis
   - Test with static scenes (should detect minimal motion)
   - Test with moving objects (should detect motion regions)
   - Verify motion detection accuracy

### Phase 4: Video Export (Server-Side Processing)

10. [ ] Create `export_video()` helper function in `helpers.py`
    - Accept input video path, filter settings, output path
    - Use OpenCV to read video frame-by-frame
    - Apply filter to each frame (grayscale, sepia, blur on background)
    - Use MediaPipe Python for segmentation (if available) or OpenCV-based approach
    - Write processed frames to output video using FFmpeg
    - Use FFmpeg-python to encode output video efficiently

11. [ ] Create `POST /api/video/export` endpoint
    - Accept video URL or file upload
    - Accept filter settings (filter type, mask threshold)
    - Process video server-side
    - Return download URL or file path
    - Handle long processing times (consider async or progress updates)

12. [ ] Test video export
    - Test with different filter types
    - Verify output video quality
    - Test with different video formats
    - Verify processing completes successfully

### Phase 5: Video Trimming

13. [ ] Create `trim_video()` helper function in `helpers.py`
    - Use FFmpeg to cut video segments
    - Accept start time, end time, input path, output path
    - Use FFmpeg-python to execute trim command
    - Preserve video quality (copy codec when possible, re-encode if needed)

14. [ ] Create `POST /api/video/trim` endpoint
    - Accept video URL or file upload
    - Accept start_time and end_time parameters (in seconds)
    - Call `trim_video()` helper
    - Return trimmed video URL or file path
    - Handle invalid time ranges gracefully

15. [ ] Test video trimming
    - Test with various time ranges
    - Verify trimmed video is correct length
    - Test edge cases (start=0, end=duration, etc.)

### Phase 6: Frontend Integration (Optional)

16. [ ] Create frontend components for video analysis
    - Add UI to trigger analysis endpoints
    - Display video metadata in readable format
    - Visualize scene changes on timeline
    - Show motion analysis results
    - Add export button to download processed videos

17. [ ] Add error handling in frontend
    - Display error messages from backend
    - Show loading states during processing
    - Handle long-running operations (progress indicators)

## Validation Steps

1. [ ] **Video Analysis**: Test with multiple video formats, verify all metadata fields
2. [ ] **Scene Detection**: Test with videos containing clear cuts and gradual transitions
3. [ ] **Motion Analysis**: Test with static and dynamic scenes, verify motion detection
4. [ ] **Video Export**: Export video with filters, verify quality and correctness
5. [ ] **Video Trimming**: Trim videos at various time points, verify accuracy
6. [ ] **Error Handling**: Test with invalid files, missing parameters, corrupted videos
7. [ ] **Performance**: Test with various video lengths, ensure reasonable processing times
8. [ ] **Integration**: Verify all endpoints work together and don't conflict
9. [ ] **Code Quality**: Run linter, check for type errors, verify code follows patterns

## Rollback Plan

If implementation causes issues:
1. Revert changes to `backend/main.py` (remove new endpoints)
2. Revert changes to `backend/helpers.py` (remove new helper functions)
3. Clean up any temp files created during testing
4. Verify existing functionality still works
5. Document what failed and why for future reference

## Technical Notes

### OpenCV Video Processing
- Use `cv2.VideoCapture()` to read videos frame-by-frame
- Always check `ret` value to ensure frame was read successfully
- Release video capture objects to free resources
- For large videos, consider processing in chunks or using threading

### FFmpeg Integration
- Use `ffmpeg.probe()` for metadata extraction (non-destructive, fast)
- Use `ffmpeg.input()` and `ffmpeg.output()` for video processing
- Use `ffmpeg.run()` to execute FFmpeg commands
- Consider using `overwrite_output=True` for temp files
- Use codec copy when possible to preserve quality and speed

### Scene Detection Algorithm
- Compare consecutive frames using histogram comparison or SSIM
- Calculate difference metric (e.g., correlation coefficient)
- Use threshold to identify significant changes
- Filter out minor changes (noise, small movements)
- Consider temporal smoothing to avoid false positives

### Motion Analysis Algorithm
- Use `cv2.calcOpticalFlowFarneback()` for dense optical flow
- Or use `cv2.calcOpticalFlowPyrLK()` for sparse tracking
- Calculate motion magnitude: `magnitude = sqrt(flow_x² + flow_y²)`
- Threshold motion to identify significant movement
- Can create motion heatmap visualization

### Performance Considerations
- Video processing can be slow for long videos
- Consider processing in background threads or async tasks
- Provide progress updates for long-running operations
- Clean up temp files after processing
- Consider caching analysis results for same video

### Error Handling
- Validate input parameters (file exists, valid format, etc.)
- Handle FFmpeg errors (invalid codec, corrupted file, etc.)
- Handle OpenCV errors (cannot read frame, memory issues, etc.)
- Return clear error messages to frontend
- Log errors for debugging

---
Created: 2026-01-12
Status: READY FOR EXECUTION
