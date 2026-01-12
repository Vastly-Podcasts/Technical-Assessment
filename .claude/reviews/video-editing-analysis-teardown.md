# Tear-Down Review: Video Editing & Analysis

**Reviewer:** World-Class Stranger Developer
**Date:** 2026-01-12
**Plan Reviewed:** `.claude/plans/video-editing-analysis.md`
**Research Reviewed:** `.claude/research/video-editing-analysis-research.md`

---

## 🚨 Critical Issues (Must Address)

### Issue 1: No File Input Mechanism Defined
**What's wrong:**
The plan says endpoints "Accept video URL or video file upload" but provides zero details on HOW. The codebase has placeholder upload endpoints that return 501. There's no implementation for:
- How to accept file uploads (multipart/form-data handling)
- How to accept URLs (download from URL? validate URL?)
- How to handle both cases in the same endpoint
- File validation (type, size, format)

**Why it matters:**
Without this, the endpoints literally cannot work. You can't process a video you don't have. This is the foundation that everything else depends on.

**What could happen:**
- Endpoints return 501 "Not implemented" forever
- Security vulnerabilities from unvalidated file uploads
- Server crashes from malicious files
- Disk space exhaustion from unvalidated file sizes

**Recommendation:**
**Before implementing any analysis features, implement file upload/download:**
1. Add file upload handling to `/api/upload` (multipart/form-data)
2. Add URL download helper (with validation, size limits, timeout)
3. Create unified `get_video_path()` helper that handles both upload and URL
4. Add file validation (type, size, format whitelist)
5. Add file size limits (e.g., 500MB max)

**Severity:** 🔴 Critical

---

### Issue 2: Blocking Operations Will Kill the Server
**What's wrong:**
All 5 endpoints are synchronous. Video export, scene detection, and motion analysis can take **minutes** for long videos. Flask's development server is single-threaded. One user processing a 10-minute video will block ALL other requests.

**Why it matters:**
- User A starts video export (5 minutes)
- User B tries to analyze metadata → **blocked for 5 minutes**
- User C tries health check → **blocked for 5 minutes**
- Server appears dead to all users

**What could happen:**
- Server becomes unresponsive under any load
- Timeout errors from clients (30s default)
- Poor user experience (no feedback, appears broken)
- Cannot scale beyond 1 concurrent user

**Recommendation:**
**Implement async processing:**
1. Use Flask's `threading` or `concurrent.futures` for long operations
2. Return job ID immediately, poll for status
3. OR use Celery/Redis for proper async (if you want to scale)
4. Add timeout limits (e.g., 5 minutes max processing time)
5. Add progress endpoints (`GET /api/video/jobs/{job_id}`)

**Minimum viable:** At least make export/analysis endpoints return job IDs and process in background threads.

**Severity:** 🔴 Critical

---

### Issue 3: Temp File Cleanup is Missing
**What's wrong:**
The plan uses `get_temp_path()` to create temp files but has **zero cleanup mechanism**. Every processed video, every analysis, every export creates files that never get deleted.

**Why it matters:**
- Disk space exhaustion (server will crash)
- Security risk (sensitive videos left on disk)
- Cost (if using cloud storage)
- Performance degradation (disk full = system slow)

**What could happen:**
- After 100 video exports: 50GB+ of temp files
- Server runs out of disk space
- New operations fail silently
- Old user videos accessible to new users (security issue)

**Recommendation:**
**Add cleanup mechanism:**
1. Delete temp files immediately after processing completes
2. Add cleanup on error (try/finally)
3. Add periodic cleanup job (delete files older than 1 hour)
4. Add disk space monitoring
5. Consider using `tempfile` module with auto-cleanup

**Severity:** 🔴 Critical

---

### Issue 4: Video Export Missing Segmentation Logic
**What's wrong:**
The plan says "OpenCV read + filter + FFmpeg encode" but the **entire point** of this app is background filtering with person segmentation. The plan doesn't explain:
- How to get segmentation mask (MediaPipe Python? OpenCV? Something else?)
- How to apply filter only to background (needs mask)
- The frontend uses MediaPipe.js - backend needs equivalent

**Why it matters:**
Without segmentation, you're just applying filters to the entire video, which defeats the purpose. The export feature won't match what users see in the preview.

**What could happen:**
- Export produces wrong output (filter on person, not background)
- Users confused why export doesn't match preview
- Feature is useless without segmentation

**Recommendation:**
**Clarify segmentation approach:**
1. If using MediaPipe Python: Add to dependencies, document installation
2. If using OpenCV only: Explain how to segment (background subtraction? edge detection?)
3. Show how mask is applied: `background = filtered_frame * (1 - mask) + original_frame * mask`
4. Test that export matches frontend preview

**Severity:** 🔴 Critical

---

### Issue 5: No File Size Limits = DoS Vector
**What's wrong:**
The plan mentions "limit file sizes" in research but **doesn't include it in implementation steps**. There's no validation, no limits, no protection.

**Why it matters:**
- Attacker uploads 10GB video → server crashes
- Legitimate user uploads 2GB video → server runs out of memory
- Multiple large uploads → disk space exhaustion
- Processing time becomes hours → server blocked

**What could happen:**
- Single malicious user can crash server
- Legitimate users can accidentally DoS themselves
- No way to prevent resource exhaustion

**Recommendation:**
**Add file size validation:**
1. Check file size before processing (e.g., 500MB max)
2. Check available disk space before processing
3. Return clear error: "File too large (max 500MB)"
4. Add different limits per operation (analysis: 1GB, export: 500MB, trim: 2GB)

**Severity:** 🔴 Critical

---

### Issue 6: Path Security - Directory Traversal Risk
**What's wrong:**
The plan says "Use `os.path.abspath()` for all FFmpeg paths" but doesn't validate that paths stay within temp directory. If endpoints accept file paths (not just uploads), this is a security hole.

**Why it matters:**
- Attacker passes `../../../etc/passwd` → reads system files
- Attacker passes `../../.env` → steals secrets
- Attacker passes absolute path to other user's files → unauthorized access

**What could happen:**
- Data breach (read arbitrary files)
- Secret leakage (.env, credentials)
- System compromise

**Recommendation:**
**Add path validation:**
1. Always resolve to absolute path
2. Check path starts with temp directory: `path.startswith(temp_dir)`
3. Reject any path outside temp directory
4. If accepting URLs, download to temp first, then validate path

**Severity:** 🟡 High (if accepting paths) / 🟢 Low (if only uploads)

---

## ⚠️ Concerns (Should Consider)

### Concern 1: Scene Detection Accuracy Trade-off Not Addressed
**What's concerning:**
The plan says "skip frames for speed (every 30th frame)" but doesn't mention that this will **miss quick scene changes**. A 1-second scene change might be completely missed.

**Why it might matter:**
- Users expect accurate scene detection
- Missing scenes = broken feature
- No way to tune accuracy vs speed

**Recommendation:**
- Document the trade-off clearly
- Make frame skip configurable (default 30, allow 1-60)
- Consider adaptive skipping (skip more in static scenes, less in dynamic)
- Add accuracy disclaimer in API response

---

### Concern 2: Codec Copy Failure Cases Not Handled
**What's concerning:**
The plan assumes codec copy always works for trimming, but it fails when:
- Different codecs in same file
- Keyframe alignment issues
- Container format incompatibilities

**Why it might matter:**
- Trimming fails silently or produces corrupted video
- User gets error with no explanation
- Need fallback to re-encoding (slow, but works)

**Recommendation:**
- Try codec copy first
- Catch FFmpeg errors, fallback to re-encode
- Log when fallback is used
- Document in API response which method was used

---

### Concern 3: Memory Usage for Long Videos
**What's concerning:**
Video export processes frame-by-frame, but for very long videos (1+ hours), even frame-by-frame can cause memory issues if not careful. OpenCV VideoCapture buffers frames.

**Why it might matter:**
- OOM errors on long videos
- Server crashes
- Need to process in chunks

**Recommendation:**
- Process in time-based chunks (e.g., 5-minute segments)
- Release frames immediately after processing
- Monitor memory usage
- Add max video length limit (e.g., 30 minutes for export)

---

### Concern 4: No Error Recovery or Partial Results
**What's concerning:**
If scene detection fails halfway through a 2-hour video, user gets nothing. No partial results, no progress saved, must restart.

**Why it might matter:**
- Wasted processing time
- Poor user experience
- No way to resume

**Recommendation:**
- Consider saving partial results
- Add checkpoint/resume capability for long operations
- At minimum, return what was processed before failure

---

### Concern 5: Concurrent Request Handling
**What's concerning:**
No mention of what happens when 5 users simultaneously upload/process videos. Flask dev server handles this poorly.

**Why it might matter:**
- Server becomes unresponsive
- Requests timeout
- Poor scalability

**Recommendation:**
- Use production server (gunicorn with workers)
- Add request queue for processing
- Limit concurrent processing jobs
- Add rate limiting

---

## 💡 Questions (Need Answers)

1. **How do endpoints receive video input?**
   - File upload? URL? Both?
   - What's the request format? (multipart? JSON with URL?)
   - Need concrete examples before implementation

2. **What happens to processed videos?**
   - Stored permanently? Temp files?
   - How long are they accessible?
   - Who can access them? (security)

3. **What's the segmentation approach for export?**
   - MediaPipe Python? (needs dependency)
   - OpenCV only? (how?)
   - Must match frontend behavior

4. **What are the actual file size limits?**
   - Research says "limit file sizes" but no numbers
   - Need specific limits per operation
   - Need to document in API

5. **How do users know processing is complete?**
   - Polling? Webhooks? SSE?
   - Progress updates?
   - Error notifications?

6. **What's the timeout strategy?**
   - How long can processing take?
   - What happens on timeout?
   - Client timeout vs server timeout?

---

## ✅ What Looks Good

- **Solution exploration**: Good job comparing 3 options for each feature
- **Research document**: Comprehensive pitfalls documented
- **Code estimates**: Realistic line counts
- **No unnecessary dependencies**: Sticking with existing libraries
- **Error handling awareness**: Plan mentions it (though needs specifics)

---

## 🎯 Overall Assessment

**Verdict:** 🟡 Proceed with Changes

**Summary:**
The plan has solid technical choices (FFmpeg probe, histogram comparison, etc.) but is **missing critical infrastructure**: file input handling, async processing, cleanup, and security. These aren't "nice to haves" - they're blockers. The plan reads like it assumes these problems are solved, but they're not.

**Must-Fix Before Implementation:**
- [ ] **File input mechanism** (upload + URL handling)
- [ ] **Async processing** (background jobs for long operations)
- [ ] **Temp file cleanup** (automatic deletion)
- [ ] **File size limits** (DoS protection)
- [ ] **Segmentation approach** (for video export)

**Should-Fix Before Implementation:**
- [ ] Path security validation
- [ ] Error recovery/partial results
- [ ] Progress tracking mechanism
- [ ] Codec copy fallback handling

**The core algorithms are sound, but the infrastructure around them is missing. Fix the foundation first, then build on top.**
