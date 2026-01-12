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

## Assumptions (Confirmed)
- Video element has `currentTime` property accessible via ref
- Filter application happens in real-time during video playback (60fps loop)
- Timeframes are defined in seconds (matching video.currentTime)
- Multiple timeframes can exist (non-overlapping or overlapping - need to clarify)
- When timeframes overlap, filter applies (union behavior)
- UI should be intuitive - timeline-based editor similar to video editing software
- TypeScript types needed for timeframe data structure
- State management: timeframes stored in App.tsx, passed to ProcessedVideo

## Implementation Steps

### Step 1: Define Data Structures
- [ ] Create `Timeframe` type: `{ id: string, start: number, end: number }`
- [ ] Create `FilterTimeframe` type: `{ filterType: FilterType, timeframes: Timeframe[] }`
- [ ] Add utility functions: `isTimeframeActive(currentTime, timeframe)`, `isAnyTimeframeActive(currentTime, timeframes)`

### Step 2: Modify ProcessedVideo Component
- [ ] Add prop: `activeTimeframes?: Timeframe[]` (optional for backward compatibility)
- [ ] Access video.currentTime in the compositing callback
- [ ] Check if currentTime is within any active timeframe
- [ ] Conditionally apply filter based on timeframe check
- [ ] When no timeframes provided, apply filter always (backward compatible)

### Step 3: Create TimeframeEditor Component
- [ ] Component to add/edit/remove timeframes
- [ ] Input fields for start/end times (seconds or MM:SS format)
- [ ] Visual timeline showing video duration and timeframe markers
- [ ] Validation: start < end, within video duration
- [ ] Delete button for each timeframe
- [ ] Add new timeframe button

### Step 4: Integrate into App.tsx
- [ ] Add state: `timeframes: Timeframe[]`
- [ ] Add state: `videoDuration: number` (from ProcessedVideo callback)
- [ ] Pass timeframes to ProcessedVideo component
- [ ] Add TimeframeEditor to UI (in editor mode or new section)
- [ ] Handle timeframe add/edit/delete operations

### Step 5: Enhance UI/UX
- [ ] Visual timeline with timeframe ranges highlighted
- [ ] Click on timeline to add timeframe at that position
- [ ] Drag timeframe markers to adjust start/end
- [ ] Show current playback position on timeline
- [ ] Format time display (MM:SS or seconds based on duration)

### Step 6: Edge Case Handling
- [ ] Handle video looping (timeframes should work in loop)
- [ ] Handle video seeking (timeframe check on seek)
- [ ] Handle empty timeframes array (filter always off)
- [ ] Handle overlapping timeframes (union - filter applies if any active)
- [ ] Handle timeframe outside video duration (clamp to duration)

## Validation Steps
1. [ ] Test: No timeframes → filter applies to entire video (backward compatible)
2. [ ] Test: Single timeframe → filter only applies during that range
3. [ ] Test: Multiple non-overlapping timeframes → filter applies during all ranges
4. [ ] Test: Overlapping timeframes → filter applies (union behavior)
5. [ ] Test: Video seeking → filter state updates correctly
6. [ ] Test: Video looping → timeframes work correctly on loop
7. [ ] Test: Timeframe boundaries → smooth transitions at start/end
8. [ ] Test: Invalid timeframes → validation prevents bad data
9. [ ] Visual inspection: Timeline UI is intuitive and responsive

## Rollback Plan
If implementation causes issues:
1. Revert ProcessedVideo changes (remove timeframe prop)
2. Keep TimeframeEditor component but don't use it
3. Restore original filter application logic
4. All changes are in separate commits for easy rollback

## Technical Decisions

### Timeframe Storage
- Store as array of `Timeframe` objects in App state
- Each timeframe has unique ID for React key management
- Use `useState` for timeframes array

### Filter Application Logic
- Check `video.currentTime` in the `composite` callback
- If `activeTimeframes` prop is provided and not empty, check if currentTime is in any timeframe
- If no timeframes or currentTime not in any timeframe, skip filter (show original)
- This maintains 60fps performance (simple time comparison)

### UI Placement
- Add TimeframeEditor in the controls section (below filter selector)
- Or add as a new section in editor mode
- Timeline visualization can be integrated with existing editor timeline

### Time Format
- Store internally as seconds (number)
- Display as MM:SS for user-friendly editing
- Convert on input/output

---
Created: 2026-01-12
Status: READY FOR EXECUTION
