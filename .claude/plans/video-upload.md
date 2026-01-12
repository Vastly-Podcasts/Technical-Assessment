# Plan: Video Upload Feature

## Goal
Allow users to upload any video file to replace the hardcoded video URL, enabling the application to process user-provided videos with background filters.

## Done-When
- [ ] User can select a video file from their device via file input
- [ ] Selected video replaces the hardcoded video URL and plays in ProcessedVideo component
- [ ] Video upload works with any common video format (mp4, webm, mov, etc.)
- [ ] Object URLs are properly cleaned up when video changes or component unmounts
- [ ] UI provides clear feedback during video selection and loading
- [ ] Existing functionality (filters, segmentation) continues to work with uploaded videos
- [ ] Backend upload endpoint is implemented (optional but recommended for larger files)

## Assumptions (Confirmed)
- **Tech Stack**: React 18 + TypeScript, Flask backend
- **Video Processing**: Client-side using MediaPipe.js (no server-side processing required for basic upload)
- **File Location**: Frontend upload UI in `App.tsx`, backend endpoint in `backend/main.py`
- **Naming**: Follow existing patterns (camelCase for React, snake_case for Python)
- **Error Handling**: Show user-friendly error messages for invalid files or upload failures
- **Dependencies**: No new npm packages needed (URL.createObjectURL is native), backend may need werkzeug for file handling (already available via Flask)
- **Browser Support**: Modern browsers that support File API and object URLs
- **File Size**: No explicit limit for client-side object URLs (browser memory dependent), backend should have reasonable limits (e.g., 100MB)

## Implementation Steps

### Frontend Changes

1. [ ] Add video upload state management in `App.tsx`
   - Add state for uploaded video file and object URL
   - Add state for upload error messages
   - Track whether using uploaded video or default URL

2. [ ] Create file input UI component
   - Add file input with `accept="video/*"` attribute
   - Style to match existing UI (use Tailwind classes)
   - Position in controls section or as a button above video
   - Show current video source (uploaded filename or "Default video")

3. [ ] Implement file selection handler
   - Validate file type (check file.type starts with "video/")
   - Validate file size (optional, warn if > 500MB)
   - Create object URL using `URL.createObjectURL(file)`
   - Update state to use object URL instead of hardcoded URL
   - Show error message if validation fails

4. [ ] Implement cleanup logic
   - Revoke previous object URL when new video is selected
   - Revoke object URL on component unmount
   - Use useEffect cleanup function

5. [ ] Update ProcessedVideo src prop
   - Pass uploaded video URL or default URL based on state
   - Ensure crossOrigin attribute works with object URLs (may need to remove it)

6. [ ] Add UI feedback
   - Show loading state while video loads
   - Display filename of uploaded video
   - Add "Reset to default" button to clear upload
   - Show error messages for invalid files

### Backend Changes (Optional but Recommended)

7. [ ] Implement `/api/upload` endpoint
   - Accept multipart/form-data with video file
   - Validate file type (check Content-Type or file extension)
   - Validate file size (e.g., max 100MB)
   - Save to temp directory using `helpers.get_temp_path()`
   - Return video ID and URL for frontend to use
   - Handle errors gracefully (file too large, invalid type, etc.)

8. [ ] Add file cleanup mechanism
   - Implement periodic cleanup of old temp files (optional)
   - Or clean up on server restart

9. [ ] Update health check endpoint
   - Set `upload: True` in capabilities when upload is implemented

10. [ ] Add CORS headers for file upload (if needed)
    - Flask-CORS should handle this, but verify

### Integration

11. [ ] Test with various video formats
    - Test mp4, webm, mov files
    - Test different resolutions and codecs
    - Verify MediaPipe segmentation works with uploaded videos

12. [ ] Test edge cases
    - Empty file selection (user cancels)
    - Very large files (memory limits)
    - Corrupted video files
    - Unsupported formats

13. [ ] Verify existing features still work
    - Filters apply correctly to uploaded videos
    - Segmentation works with uploaded videos
    - Timeline controls work (if applicable)

## Validation Steps

1. [ ] Manual: Select a video file, verify it plays and processes correctly
2. [ ] Manual: Test with multiple video formats (mp4, webm, mov)
3. [ ] Manual: Verify object URL cleanup (check browser memory, no leaks)
4. [ ] Manual: Test error handling (invalid file, too large, etc.)
5. [ ] Manual: Verify default video still works when no upload is selected
6. [ ] Manual: Test backend upload endpoint (if implemented) with curl/Postman
7. [ ] Code: Run TypeScript type check (`npx tsc --noEmit`)
8. [ ] Code: Verify no console errors in browser
9. [ ] Code: Check for memory leaks (object URLs properly revoked)

## Rollback Plan

If implementation causes issues:
1. Revert changes to `App.tsx` (remove upload state and handlers)
2. Revert changes to `backend/main.py` (restore placeholder endpoint)
3. Ensure `consts.ts` videoUrl is still used as default
4. Verify ProcessedVideo component still works with hardcoded URL

## Technical Notes

- **Object URLs**: Use `URL.createObjectURL(file)` for client-side video preview. Must revoke with `URL.revokeObjectURL(url)` to prevent memory leaks.
- **crossOrigin**: Object URLs don't need crossOrigin="anonymous" - this is only for external URLs. May need to conditionally set this attribute.
- **File Validation**: Check `file.type` for "video/" prefix. Some browsers may not set this correctly, so also check file extension as fallback.
- **Backend Upload**: If implementing backend upload, use Flask's `request.files` to access uploaded file. Save to temp directory and return URL that frontend can use.
- **Error Messages**: Provide clear, user-friendly error messages (e.g., "Please select a valid video file" instead of technical errors).

---
Created: 2026-01-12
Status: READY FOR EXECUTION
