# Tear-Down Review: Video Upload Feature

**Reviewer:** World-Class Stranger Developer
**Date:** 2026-01-12
**Plan Reviewed:** `.claude/plans/video-upload.md`
**Research Reviewed:** None (research phase was skipped)

---

## 🚨 Critical Issues (Must Address)

### Issue 1: crossOrigin Handling is Incomplete
**What's wrong:**
The plan says "Remove crossOrigin for object URLs (not needed)" but doesn't specify HOW to conditionally set it. Looking at ProcessedVideo.tsx line 406, `crossOrigin="anonymous"` is hardcoded. The plan needs to specify the implementation: how to detect object URLs vs external URLs.

**Why it matters:**
- If crossOrigin is set on object URLs, it can cause CORS errors in some browsers
- If crossOrigin is missing on external URLs, MediaPipe segmentation will fail (canvas taint)
- This is a critical implementation detail that's completely missing

**What could happen:**
- Object URLs fail to load with CORS errors
- External URLs work but object URLs don't (or vice versa)
- Developer has to figure out the conditional logic during implementation (wastes time)

**Recommendation:**
Add explicit implementation step:
```typescript
// Detect if URL is object URL (starts with blob:) vs external URL
const isObjectUrl = src.startsWith('blob:');
<video
  src={src}
  crossOrigin={isObjectUrl ? undefined : "anonymous"}
  ...
/>
```

**Severity:** 🔴 Critical

---

### Issue 2: ProcessedVideo Will Restart Segmentation on src Change
**What's wrong:**
When `src` prop changes, ProcessedVideo's `useEffect` (line ~288-310) will restart the entire segmentation pipeline. The video element reloads, triggers `handleLoadedMetadata`, which restarts `startSegmentation`. This happens every time a new file is selected.

**Why it matters:**
- Causes visible flicker/glitch when switching videos
- Performance hit: MediaPipe model reinitializes (~100-300ms per useSegmentation docs)
- Potential memory leaks if cleanup doesn't run perfectly
- User experience: video "jumps" or resets unexpectedly
- If user rapidly selects multiple files, could cause race conditions

**What could happen:**
- User selects new video → old video still processing → segmentation state conflicts
- Memory leaks from incomplete cleanup during rapid file changes
- Poor UX: video resets position, playback state lost
- Performance degradation with frequent file changes

**Recommendation:**
Plan should address:
1. Stop segmentation before src changes (explicit cleanup)
2. Show loading state during video switch
3. Consider debouncing rapid file selections
4. Document that video state (play/pause/position) will reset (expected behavior)

**Severity:** 🟡 High

---

### Issue 3: No Error Handling Strategy
**What's wrong:**
Plan says "Show error if invalid" but doesn't specify:
- Where errors are stored (state variable?)
- How they're displayed (toast notification? inline message? alert?)
- When they're cleared (on new file selection? manually?)
- What happens to previous video when error occurs (keep it? reset to default?)

**Why it matters:**
- Without clear error handling, implementation will be inconsistent
- User won't know why their file was rejected
- Errors might persist and confuse users
- No way to recover from errors gracefully

**What could happen:**
- User selects invalid file → no feedback → user confused
- Error message never clears → UI shows stale error
- Previous video disappears on error → user loses their work
- Different developers implement error handling differently → inconsistent UX

**Recommendation:**
Add explicit error handling:
```typescript
const [uploadError, setUploadError] = useState<string | null>(null);

// In handler:
if (!isValid) {
  setUploadError("Please select a valid video file (mp4, webm, mov)");
  return;
}
setUploadError(null); // Clear on success

// In UI:
{uploadError && <div className="error-message">{uploadError}</div>}
```

**Severity:** 🟡 High

---

### Issue 4: File Validation is Too Naive
**What's wrong:**
Plan says "Validate file.type starts with 'video/'" and mentions "check file extension as fallback" but doesn't specify:
- Which extensions to allow
- How to check extensions (regex? array includes?)
- What to do when both MIME type and extension are missing/invalid
- Whether to validate file can actually be played (not just has correct type)

**Why it matters:**
- Some browsers don't set MIME types correctly (especially mobile)
- Some valid video files have non-standard MIME types
- File could pass validation but fail to play (wrong codec, corrupted)
- User gets confusing error: "File validated but won't play"

**What could happen:**
- Valid video file rejected because browser didn't set MIME type
- Invalid file passes validation but fails to play → user confused
- Different validation behavior across browsers → inconsistent UX
- Corrupted files pass validation → runtime errors

**Recommendation:**
Specify validation logic:
```typescript
const isValidVideoFile = (file: File): boolean => {
  // Check MIME type
  if (file.type.startsWith('video/')) return true;
  
  // Fallback: check extension
  const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validExtensions.includes(extension);
};
```

Also consider: validate file can actually be played by creating video element and checking `video.canPlayType()`.

**Severity:** 🟠 Medium

---

### Issue 5: Memory Leak Risk in Cleanup
**What's wrong:**
Plan says "Revoke previous object URL when file changes" and "Revoke on unmount" but doesn't address race conditions:
- User selects file A → creates objectUrl A
- User quickly selects file B → creates objectUrl B  
- Cleanup effect for A might run AFTER B is created
- ProcessedVideo might still be using objectUrl A when cleanup runs

**Why it matters:**
- Object URLs hold references to File objects in memory
- If cleanup runs at wrong time, could revoke URL that's still in use
- Memory leaks accumulate over time (especially if user uploads many videos)
- Browser crashes on low-memory devices

**What could happen:**
- Video stops playing mid-playback if URL revoked too early
- Memory leaks from unreleased object URLs
- Browser performance degrades with multiple file selections
- OOM errors on mobile devices

**Recommendation:**
Specify cleanup order:
```typescript
useEffect(() => {
  // Store previous URL before creating new one
  const previousUrl = objectUrl;
  
  if (videoFile) {
    const newUrl = URL.createObjectURL(videoFile);
    setObjectUrl(newUrl);
    
    // Revoke previous URL AFTER new one is set
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
  }
  
  return () => {
    // Cleanup on unmount or when videoFile becomes null
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [videoFile]);
```

**Severity:** 🟠 Medium

---

## ⚠️ Concerns (Should Consider)

### Concern 1: No File Size Limits
**What's concerning:**
Plan acknowledges "Limited to browser memory for file size" but doesn't set practical limits or warnings.

**Why it might matter:**
- User selects 5GB video file → browser crashes
- No feedback about file size before selection
- Different browsers have different memory limits → inconsistent behavior
- Mobile devices have much lower limits → worse UX

**Recommendation:**
Add file size validation:
```typescript
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
if (file.size > MAX_FILE_SIZE) {
  setUploadError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  return;
}
```

**Severity:** 🟠 Medium

---

### Concern 2: State Management Redundancy
**What's concerning:**
Plan stores both `videoFile` and `objectUrl` in state. The objectUrl is derived from videoFile, so storing both is redundant and creates potential for inconsistency.

**Why it might matter:**
- More state to manage = more complexity
- Potential for videoFile and objectUrl to get out of sync
- Unnecessary re-renders if both states update separately

**Recommendation:**
Consider storing only `videoFile` and deriving `objectUrl` in a useMemo or useEffect. Or store only `objectUrl` and derive filename from it. Simpler state = fewer bugs.

**Severity:** 🟢 Low

---

### Concern 3: Missing Edge Cases
**What's concerning:**
Plan doesn't address:
- User cancels file selection (onChange might not fire)
- File is corrupted but passes MIME check
- Video codec isn't supported by browser (H.265, VP9 in some browsers)
- Video fails to load after object URL is created

**Why it might matter:**
- Edge cases become bugs in production
- User frustration when edge cases aren't handled
- Inconsistent behavior across browsers

**Recommendation:**
Add edge case handling:
- Handle file input cancel (check if files.length === 0)
- Validate video can actually play (listen to video.onerror)
- Show codec compatibility warning if needed
- Graceful fallback to default video on load failure

**Severity:** 🟢 Low

---

### Concern 4: No Consideration for Video Codec Compatibility
**What's concerning:**
Plan assumes all video files with correct extension/MIME type will play. Different codecs (H.264, H.265, VP9, AV1) have different browser support.

**Why it might matter:**
- User uploads H.265 video → doesn't play in Safari
- User uploads VP9 video → doesn't play in Safari
- File passes validation but fails to play → confusing UX

**Recommendation:**
Either:
1. Accept that some videos won't play (document limitation)
2. Add codec detection and warning
3. Transcode on backend (but that's Solution 2, which was rejected)

For now, document the limitation and handle play errors gracefully.

**Severity:** 🟢 Low

---

## 💡 Questions (Need Answers)

1. **What happens to video playback state when new file is selected?**
   - Should video pause/stop?
   - Should position reset to 0?
   - Should filters reset to default?
   - Why it matters: User experience consistency
   - Need to know: Expected behavior specification

2. **Should uploaded video persist across page refreshes?**
   - Current plan: No (object URLs don't persist)
   - Is this acceptable? Or should we use localStorage/sessionStorage?
   - Why it matters: User might expect their upload to persist
   - Need to know: Product requirement

3. **What's the expected file size limit?**
   - Plan says "browser memory" but that's vague
   - Should we set a hard limit (e.g., 500MB)?
   - Should we warn users about large files?
   - Why it matters: Prevents browser crashes
   - Need to know: Practical limit based on target devices

4. **How should errors be displayed?**
   - Toast notification?
   - Inline message in controls?
   - Alert dialog?
   - Why it matters: UX consistency
   - Need to know: Design system/patterns used in app

---

## ✅ What Looks Good

- **Solution choice is sound** - Native File API is indeed the simplest approach
- **Zero dependencies** - Good alignment with codebase philosophy
- **Cleanup is considered** - Plan addresses memory leak prevention
- **Fallback to default video** - Good UX consideration
- **Matches existing patterns** - Follows codebase style (no external libs)

---

## 🎯 Overall Assessment

**Verdict:** 🟡 Proceed with Changes

**Summary:**
The core approach is solid (native File API is simplest), but critical implementation details are missing. The plan needs explicit error handling strategy, crossOrigin conditional logic, and consideration for ProcessedVideo's src change behavior. These aren't blockers, but addressing them before implementation will prevent bugs and rework.

**Must-Fix Before Implementation:**
- [ ] Issue 1: Specify crossOrigin conditional logic implementation
- [ ] Issue 2: Address ProcessedVideo segmentation restart on src change
- [ ] Issue 3: Define error handling strategy (state, display, clearing)
- [ ] Issue 4: Specify complete file validation logic (MIME + extension)

**Should-Fix Before Implementation:**
- [ ] Issue 5: Clarify cleanup order to prevent race conditions
- [ ] Concern 1: Add file size limits/warnings
- [ ] Answer Questions 1-4 to clarify requirements

**Can Fix During Implementation:**
- [ ] Concern 2: Simplify state management (store only one: videoFile OR objectUrl)
- [ ] Concern 3: Handle edge cases (cancel, corrupted files, codec issues)
- [ ] Concern 4: Document codec compatibility limitations

---

## Additional Notes

The plan is **80% there** but missing the "how" for critical pieces. This is common when planning - the "what" is clear but the "how" needs specification. Adding the missing implementation details will make this a solid plan.

The chosen solution (native File API) is correct - it's the simplest and aligns with the codebase philosophy. The issues are all fixable and don't require changing the approach.
