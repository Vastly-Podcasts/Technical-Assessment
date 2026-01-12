# Tear-Down Review: Timeframe-Based Filter Control

**Reviewer:** World-Class Stranger Developer  
**Date:** 2026-01-12  
**Plan Reviewed:** `.claude/plans/timeframe-filters.md`  
**Research Reviewed:** None (research phase skipped per user request)

---

## 🚨 Critical Issues (Must Address)

### Issue 1: Stale Closure in Composite Callback
**What's wrong:**
The plan adds `activeTimeframes` to the `composite` callback's dependency array, but the segmentation hook stores the callback in a ref (`callbackRef.current`). When `activeTimeframes` changes, React recreates the `composite` callback, but the segmentation hook's ref still points to the old callback until `startSegmentation` is called again.

**Why it matters:**
- Timeframe changes won't take effect until the video is restarted or the component remounts
- Users will see stale filter behavior after editing timeframes
- This creates a confusing UX where changes don't apply immediately

**What could happen:**
- User adds a timeframe → filter doesn't apply until they refresh
- User removes a timeframe → filter still applies until they refresh
- This will be reported as a bug and require debugging

**Recommendation:**
Either:
1. **Pass timeframes through the callback chain** - Modify `useSegmentation` to accept timeframes and pass them to the callback, OR
2. **Use a ref for timeframes** - Store `activeTimeframes` in a ref and read from it in composite (avoids dependency), OR
3. **Restart segmentation when timeframes change** - Add `activeTimeframes` to the `useEffect` dependencies that call `startSegmentation`

**Severity:** 🔴 Critical

---

### Issue 2: Missing Video Duration Exposure
**What's wrong:**
The plan says "Add state: `videoDuration: number` (from ProcessedVideo callback)" but there's no mechanism to expose video duration. The existing `onLoadedMetadata` callback doesn't pass any data, and `video.duration` is only available after metadata loads.

**Why it matters:**
- TimeframeEditor can't validate "within duration" without knowing duration
- Users could create timeframes that extend beyond video end
- No way to show timeline scale correctly

**What could happen:**
- User creates timeframe with end=999999 → validation can't catch it
- Timeline UI can't show proper scale
- Editor shows invalid timeframes that appear valid

**Recommendation:**
Add `onDurationChange?: (duration: number) => void` callback to ProcessedVideo props, call it in `handleLoadedMetadata`:
```typescript
const handleLoadedMetadata = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;
  // ... existing code ...
  onDurationChange?.(video.duration);
}, [onLoadedMetadata, onDurationChange]);
```

**Severity:** 🔴 Critical

---

### Issue 3: Race Condition with Async Frame Processing
**What's wrong:**
The plan checks `video.currentTime` inside the `composite` callback, but this callback is invoked asynchronously from MediaPipe's `onResults`. The video may have advanced several frames between when the frame was captured and when we check `currentTime`.

**Why it matters:**
- Filter state could be wrong for the frame being displayed
- At 60fps, a frame could be 16ms old by the time we process it
- If video is playing at 30fps but processing at 60fps, we're checking the wrong time

**What could happen:**
- Frame at 5.0s gets processed, but by the time composite runs, video is at 5.1s
- Filter applies/removes at wrong visual moment
- Creates jittery transitions at timeframe boundaries

**Recommendation:**
Capture `currentTime` when the frame is sent to MediaPipe, pass it through the callback chain:
```typescript
// In useSegmentation processFrame:
const frameTime = video.currentTime;
segmentation.send({ image: video }).then(() => {
  // Pass frameTime to callback
});

// In SegmentationResult interface, add:
export interface SegmentationResult {
  // ... existing ...
  timestamp: number; // When this frame was captured
}
```

**Severity:** 🟡 High

---

### Issue 4: Video Looping Not Handled
**What's wrong:**
The video has `loop` attribute. When it loops, `currentTime` resets to 0, but the plan's timeframe check doesn't account for this. Timeframes like `{start: 10, end: 15}` won't work correctly on loop.

**Why it matters:**
- Timeframes won't apply correctly after first loop
- Users expect timeframes to work throughout the entire playback session
- This breaks the "smooth transitions" requirement

**What could happen:**
- Video loops → filter stops working
- User creates timeframe for end of video → doesn't work on subsequent loops
- Confusing behavior that's hard to debug

**Recommendation:**
Either:
1. **Use modulo arithmetic** - `const loopTime = currentTime % video.duration` (if looping)
2. **Track loop count** - Add loop counter, adjust timeframes accordingly
3. **Disable looping when timeframes active** - Or document that timeframes don't work with looping

**Severity:** 🟡 High

---

### Issue 5: Performance with Many Timeframes
**What's wrong:**
The plan uses `timeframes.some()` which is O(n) where n is number of timeframes. This runs every frame (60fps). With 10+ timeframes, this adds up. More importantly, the plan doesn't optimize for the common case.

**Why it matters:**
- 60fps × 10 timeframes = 600 comparisons/second
- If timeframes are sorted, we could binary search (O(log n))
- Most videos will have 1-3 timeframes, but edge case could have 20+

**What could happen:**
- User adds 20 timeframes → noticeable performance degradation
- Mobile devices struggle with extra computation
- Battery drain on laptops

**Recommendation:**
1. **Sort timeframes once** when they change (in App.tsx)
2. **Use binary search** for O(log n) lookup
3. **Or early exit optimization** - if currentTime < first timeframe start, return false immediately

**Severity:** 🟠 Medium

---

## ⚠️ Concerns (Should Consider)

### Concern 1: Timeframe Boundary Precision
**What's concerning:**
The plan says "smooth transitions when entering/leaving timeframes" but doesn't explain how. The current implementation applies filter binary (on/off) based on timeframe check. There's no fade-in/fade-out logic.

**Why it might matter:**
- Abrupt filter on/off at boundaries will look jarring
- Users expect smooth transitions (mentioned in done-when)
- Current plan doesn't implement this

**Recommendation:**
Either:
1. **Add fade window** - Apply filter with opacity based on distance from boundary (e.g., 0.1s fade)
2. **Document limitation** - State that transitions are instant, not smooth
3. **Use easing function** - Similar to mask threshold smoothstep, add timeframe boundary easing

---

### Concern 2: Timeframe Validation Timing
**What's concerning:**
The plan says "validate (start < end, within duration)" but validation happens in TimeframeEditor. If video duration changes (different video loaded), existing timeframes could become invalid.

**Why it might matter:**
- User creates timeframes for 60s video
- User loads 30s video → timeframes are invalid but not caught
- Could cause runtime errors or weird behavior

**Recommendation:**
- Validate timeframes when video duration changes
- Reset or clamp timeframes to new duration
- Show warning if timeframes are invalid

---

### Concern 3: No Persistence Strategy
**What's concerning:**
The plan doesn't mention how timeframes are persisted. They're just in component state, so they're lost on refresh.

**Why it might matter:**
- User spends time creating timeframes → lost on refresh
- No way to save/load timeframe presets
- Can't share timeframes between sessions

**Recommendation:**
- Document that timeframes are session-only (if that's the intent)
- Or add localStorage persistence (simple, ~10 lines)
- Or add export/import functionality

---

### Concern 4: Timeframe Editor Complexity Underestimated
**What's concerning:**
The plan estimates "~80 lines" for TimeframeEditor, but that seems low for:
- Input fields with validation
- Add/remove buttons
- List display
- Error handling
- Time formatting (seconds ↔ MM:SS)

**Why it might matter:**
- Actual implementation will be 150+ lines
- Plan underestimates complexity
- Could lead to rushed implementation

**Recommendation:**
- Re-estimate to ~150 lines
- Or simplify UI (just seconds input, no MM:SS conversion)
- Break into smaller sub-components

---

## 💡 Questions (Need Answers)

1. **What happens when video source changes?**
   - Should timeframes reset?
   - Should they persist across video changes?
   - Need to know: User workflow expectations

2. **How should overlapping timeframes work?**
   - Plan says "union" (filter applies if any active)
   - But what if user wants different filters for different timeframes?
   - Need to know: Future requirements for per-timeframe filters

3. **What's the expected maximum number of timeframes?**
   - Plan doesn't specify
   - Affects performance optimization decisions
   - Need to know: Use case constraints

4. **Should timeframes work during seeking?**
   - User seeks to 5s → filter should update immediately
   - Current plan should handle this (composite runs on seek)
   - Need to confirm: Expected behavior

---

## ✅ What Looks Good

- **Simple solution choice** - Checking time in composite callback is indeed the simplest approach
- **Backward compatibility** - Empty timeframes = filter always on is smart
- **No new dependencies** - Sticking with existing patterns
- **Clear data structure** - Timeframe interface is simple and clear

---

## 🎯 Overall Assessment

**Verdict:** 🟡 Proceed with Changes

**Summary:**
The core approach is sound, but there are critical issues around stale closures, missing duration exposure, and async timing that will cause bugs in production. The performance concern is minor but should be addressed. The plan needs to address how video duration is exposed and how timeframe changes propagate to the active callback.

**Must-Fix Before Implementation:**
- [ ] Fix stale closure issue (Issue 1) - timeframe changes not taking effect
- [ ] Add video duration exposure mechanism (Issue 2) - needed for validation
- [ ] Handle video looping (Issue 4) - timeframes break on loop
- [ ] Address race condition with async processing (Issue 3) - wrong time checked

**Should-Fix Before Implementation:**
- [ ] Optimize timeframe lookup for many timeframes (Issue 5)
- [ ] Clarify smooth transition requirement (Concern 1)
- [ ] Add timeframe validation on video change (Concern 2)

**Can Defer:**
- [ ] Persistence strategy (Concern 3) - can add later
- [ ] Timeframe editor complexity (Concern 4) - will discover during implementation

---

## 🔗 Coordination with Other Features

### Potential Conflict: Video Upload Feature
**What's happening:**
- `video-upload.md` plan modifies ProcessedVideo's `src` prop and `crossOrigin` attribute
- `timeframe-filters.md` plan modifies ProcessedVideo's `composite` callback and adds `activeTimeframes` prop
- Both features modify the same component

**Coordination needed:**
- ✅ **No direct conflict** - Different props, different concerns
- ⚠️ **Indirect dependency** - When video `src` changes (upload), timeframes should be validated/reset
- ⚠️ **Duration callback** - Both features may need `onDurationChange` callback (upload needs it for validation, timeframes need it for timeframe bounds)

**Recommendation:**
- Coordinate `onDurationChange` callback addition (both features need it)
- When `src` changes, reset or validate timeframes (add to video-upload implementation)
- Ensure both features can coexist in ProcessedVideo props interface

**Files affected by both:**
- `frontend/src/components/ProcessedVideo.tsx` - Both add props
- `frontend/src/App.tsx` - Both add state/UI

**No conflict with:**
- `video-editing-analysis.md` - Backend only, no frontend overlap

---

## Additional Notes

The plan's solution exploration is good - Solution 1 is indeed the simplest. However, the implementation details need more thought around React's closure behavior and async timing. The issues found are fixable but need to be addressed before implementation to avoid production bugs.

**Coordination status:** ✅ Reviewed for conflicts with `video-upload.md` and `video-editing-analysis.md`. No blocking conflicts identified. Minor coordination needed on `onDurationChange` callback.
