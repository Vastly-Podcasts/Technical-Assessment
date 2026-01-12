# Plan: Timeframe-Based Filter Control

## Goal
Allow users to specify timeframes (start/end times) when filters apply to the video. Filters should only be active during specified timeframes, and inactive otherwise.

## Done-When
- [ ] Users can add/remove timeframes for filter application
- [ ] Each timeframe has start and end time (in seconds)
- [ ] Filter only applies during active timeframes
- [ ] When no timeframes are defined, filter applies to entire video (backward compatible)
- [ ] UI shows active timeframes visually (timeline visualization)
- [ ] Users can edit existing timeframes
- [ ] Timeframe validation (start < end, no negative values, within video duration)
- [ ] Smooth transitions when entering/leaving timeframes (no visual glitches)

## Solution Exploration

### Solution 1: Time Check in Composite Callback (Simplest)
**How:** Check `video.currentTime` inside the `composite` callback before applying filter
- **Code required:** ~15 lines
- **Dependencies:** None (use existing video ref)
- **Pros:** 
  - Minimal code change
  - No new dependencies
  - Leverages existing 60fps loop
  - Simple time comparison logic
- **Cons:** 
  - Time check happens every frame (but it's just a number comparison, negligible cost)
- **Complexity:** Simple

### Solution 2: Separate Time Tracking Hook
**How:** Create `useVideoTime` hook that tracks currentTime via `timeupdate` event, pass active state to composite
- **Code required:** ~40 lines
- **Dependencies:** None
- **Pros:**
  - Separates concerns
  - Reusable hook
- **Cons:**
  - More code than needed
  - `timeupdate` fires less frequently than rAF (may miss frame checks)
  - Adds state management complexity
- **Complexity:** Medium

### Solution 3: External Timeline Library
**How:** Use a video timeline component library (e.g., react-video-timeline, videojs-timeline)
- **Code required:** ~100+ lines (integration)
- **Dependencies:** External library
- **Pros:**
  - Rich UI features out of box
- **Cons:**
  - Heavy dependency
  - Overkill for simple timeframes
  - Bundle size increase
  - May not match existing design
- **Complexity:** Complex

## Decision

**Chosen:** Solution 1 - Time Check in Composite Callback

**Why:**
- **Minimal code** - Only ~15 lines added
- **No dependencies** - Uses existing video ref
- **Simple logic** - Just check if currentTime is in any timeframe
- **Performance** - Number comparison is negligible (happens in hot loop anyway)
- **Fits existing pattern** - Composite callback already has access to video via closure

**Rejected:**
- Solution 2: Unnecessary abstraction for simple time check
- Solution 3: Overkill, adds dependency, doesn't match minimal code philosophy

## Implementation Steps

### Step 1: Define Timeframe Types (~10 lines)
- [ ] Create `Timeframe` type: `{ id: string, start: number, end: number }`
- [ ] Add utility: `isTimeframeActive(currentTime: number, timeframes: Timeframe[]): boolean`
- [ ] **FIX:** Sort timeframes once for O(log n) lookup optimization
- [ ] **FIX:** Handle video looping with modulo arithmetic

### Step 2: Add Duration Callback to ProcessedVideo (~5 lines)
- [ ] Add prop: `onDurationChange?: (duration: number) => void`
- [ ] Call `onDurationChange?.(video.duration)` in `handleLoadedMetadata`
- [ ] **CRITICAL:** This is needed for timeframe validation and coordination with video-upload feature

### Step 3: Modify ProcessedVideo Component (~25 lines)
- [ ] Add prop: `activeTimeframes?: Timeframe[]`
- [ ] **FIX:** Use ref for timeframes to avoid stale closure (store in `timeframesRef`)
- [ ] **FIX:** Restart segmentation when timeframes change (add to useEffect deps)
- [ ] **FIX:** Capture `currentTime` when frame is sent to MediaPipe (pass through callback chain)
- [ ] In `composite` callback, check captured timestamp against timeframes
- [ ] **FIX:** Handle video looping: `const loopTime = video.duration > 0 ? currentTime % video.duration : currentTime`
- [ ] If not in active timeframe, skip filter (show original frame)
- [ ] If no timeframes provided, apply filter always (backward compatible)

### Step 4: Modify useSegmentation Hook (~15 lines)
- [ ] **FIX:** Add `timestamp` field to `SegmentationResult` interface
- [ ] **FIX:** Capture `video.currentTime` when sending frame to MediaPipe
- [ ] **FIX:** Pass timestamp through to composite callback
- [ ] This fixes race condition where video advances between frame capture and processing

### Step 5: Create Simple TimeframeEditor Component (~150 lines)
- [ ] Input fields for start/end times (seconds)
- [ ] Add/remove timeframe buttons
- [ ] Basic validation (start < end, within duration)
- [ ] **FIX:** Validate timeframes when video duration changes
- [ ] **FIX:** Reset or clamp timeframes when video source changes
- [ ] Simple list display
- [ ] **NOTE:** Revised estimate from 80 to 150 lines (includes validation, error handling, time formatting)

### Step 6: Integrate into App.tsx (~30 lines)
- [ ] Add state: `timeframes: Timeframe[]`
- [ ] Add state: `videoDuration: number` (from ProcessedVideo `onDurationChange` callback)
- [ ] **FIX:** Sort timeframes when they change (for optimized lookup)
- [ ] **FIX:** Reset timeframes when video source changes (coordinate with video-upload)
- [ ] Pass timeframes to ProcessedVideo
- [ ] Add TimeframeEditor to controls section

### Step 7: Visual Timeline (Optional - can skip for MVP)
- [ ] Show timeframes as colored bars on existing editor timeline
- [ ] Click timeline to add timeframe at that position

**Total Code:** ~235 lines (revised from 115, includes all fixes)

## Validation Steps
1. [ ] Test: No timeframes → filter applies to entire video (backward compatible)
2. [ ] Test: Single timeframe → filter only applies during that range
3. [ ] Test: Multiple timeframes → filter applies during all ranges (union)
4. [ ] Test: Video seeking → filter state updates correctly
5. [ ] Test: Video looping → timeframes work correctly on loop (modulo arithmetic)
6. [ ] Test: Timeframe boundaries → transitions work correctly (may be instant, not smooth)
7. [ ] Test: Invalid timeframes → validation prevents bad data
8. [ ] **FIX:** Test: Timeframe changes take effect immediately (no stale closure)
9. [ ] **FIX:** Test: Video duration callback fires correctly
10. [ ] **FIX:** Test: Frame timestamp matches visual frame (no race condition)
11. [ ] **FIX:** Test: Timeframes reset/validate when video source changes
12. [ ] **FIX:** Test: Performance with 20+ timeframes (should still be smooth)

## Technical Details

### Timeframe Check Logic (Optimized)
```typescript
function isTimeframeActive(currentTime: number, timeframes: Timeframe[]): boolean {
  if (timeframes.length === 0) return true; // Backward compatible
  
  // Early exit optimization
  if (timeframes.length > 0 && currentTime < timeframes[0].start) {
    return false;
  }
  
  // Binary search for O(log n) lookup (timeframes must be sorted)
  // For now, use some() but timeframes should be sorted in App.tsx
  return timeframes.some(tf => currentTime >= tf.start && currentTime <= tf.end);
}

// Helper to sort timeframes by start time
function sortTimeframes(timeframes: Timeframe[]): Timeframe[] {
  return [...timeframes].sort((a, b) => a.start - b.start);
}
```

### ProcessedVideo Duration Callback
```typescript
interface ProcessedVideoProps {
  // ... existing props ...
  onDurationChange?: (duration: number) => void; // NEW
  activeTimeframes?: Timeframe[]; // NEW
}

// In handleLoadedMetadata:
const handleLoadedMetadata = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;
  // ... existing code ...
  onDurationChange?.(video.duration); // NEW
}, [onLoadedMetadata, onDurationChange]);
```

### Composite Modification (Fixed)
```typescript
// Use ref to avoid stale closure
const timeframesRef = useRef<Timeframe[]>([]);
useEffect(() => {
  timeframesRef.current = activeTimeframes ?? [];
}, [activeTimeframes]);

// Restart segmentation when timeframes change (ensures callback updates)
useEffect(() => {
  if (isVideoReady && videoDimensions.width > 0) {
    stopSegmentation();
    startSegmentation(videoRef.current!, composite);
  }
}, [activeTimeframes, isVideoReady, videoDimensions, startSegmentation, stopSegmentation, composite]);

const composite = useCallback((result: SegmentationResult, ctx: CanvasRenderingContext2D) => {
  const video = videoRef.current;
  if (!video) return;
  
  // Use timestamp from result (captured when frame was sent)
  const frameTime = result.timestamp ?? video.currentTime;
  
  // Handle video looping
  const videoDuration = video.duration || Infinity;
  const loopTime = videoDuration > 0 && video.loop 
    ? frameTime % videoDuration 
    : frameTime;
  
  // Check against current timeframes (from ref to avoid stale closure)
  const shouldApplyFilter = isTimeframeActive(loopTime, timeframesRef.current);
  
  // ... existing code ...
  if (shouldApplyFilter) {
    applyFilter(filtered, filterType);
  }
  // ... rest of compositing ...
}, [filterType]); // Removed activeTimeframes from deps, using ref instead
```

### useSegmentation Hook Modification
```typescript
// Add timestamp to SegmentationResult
export interface SegmentationResult {
  // ... existing fields ...
  timestamp: number; // NEW: When frame was captured
}

// In useSegmentation, capture timestamp when sending frame:
const processFrame = useCallback(() => {
  const video = videoRef.current;
  if (!video || !segmentation) return;
  
  const frameTime = video.currentTime; // Capture NOW
  segmentation.send({ image: video }).then((result) => {
    // Pass timestamp through
    callbackRef.current?.({
      ...result,
      timestamp: frameTime, // Include captured time
    }, ctx);
  });
}, [segmentation, ctx]);
```

### Data Structure
```typescript
interface Timeframe {
  id: string;      // For React keys
  start: number;   // Seconds
  end: number;     // Seconds
}
```

### App.tsx Integration
```typescript
// Sort timeframes when they change
const sortedTimeframes = useMemo(() => {
  return sortTimeframes(timeframes);
}, [timeframes]);

// Reset timeframes when video source changes
useEffect(() => {
  setTimeframes([]); // Or validate/clamp existing ones
}, [videoUrl]); // When video source changes

// Handle duration callback
const handleDurationChange = useCallback((duration: number) => {
  setVideoDuration(duration);
  // Validate existing timeframes
  setTimeframes(prev => prev.map(tf => ({
    ...tf,
    end: Math.min(tf.end, duration)
  })));
}, []);
```

## Known Issues & Fixes (From Review)

### Critical Fixes Applied:
1. ✅ **Stale Closure Fix** - Using ref for timeframes + restarting segmentation on change
2. ✅ **Duration Exposure** - Added `onDurationChange` callback to ProcessedVideo
3. ✅ **Race Condition Fix** - Capture timestamp when frame is sent, pass through callback
4. ✅ **Video Looping Fix** - Use modulo arithmetic for loop time calculation
5. ✅ **Performance Optimization** - Sort timeframes, early exit, prepare for binary search

### Concerns Addressed:
- ⚠️ **Smooth Transitions** - Documented as "may be instant" (not smooth fade). Can add fade window later if needed.
- ⚠️ **Timeframe Validation** - Added validation on video duration change
- ⚠️ **Video Source Changes** - Added timeframe reset/validation when src changes

### Coordination:
- ✅ **Video Upload Feature** - Both use `onDurationChange` callback (coordinate implementation)
- ✅ **No Conflicts** - Different props, can coexist safely

## Rollback Plan
If issues occur:
1. Revert ProcessedVideo changes (remove timeframe prop and onDurationChange)
2. Revert useSegmentation changes (remove timestamp field)
3. Keep TimeframeEditor but don't use it
4. All changes in separate commits for easy rollback

---
Created: 2026-01-12  
Updated: 2026-01-12 (after review)  
Status: READY FOR EXECUTION (all critical issues addressed)
