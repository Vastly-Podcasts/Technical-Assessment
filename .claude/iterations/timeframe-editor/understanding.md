# Understanding: TimeframeEditor Component

**Analyzed:** 2025-01-12
**Target:** `frontend/src/components/TimeframeEditor.tsx`

---

## Purpose
The TimeframeEditor component allows users to define time ranges when filters should be active during video playback. Users can add, edit, and remove timeframes. When no timeframes are defined, the filter applies to the entire video.

## Architecture
- **Component Type:** Functional React component with hooks
- **State Management:** Local state for editing mode, form inputs, and error messages
- **Props:** 
  - `timeframes`: Array of current timeframes
  - `onTimeframesChange`: Callback when timeframes are modified
  - `videoDuration`: Video duration for validation

## Data Flow
1. User enters start/end times in input fields
2. User clicks "Add" button
3. Input is parsed (supports MM:SS or seconds format)
4. Validation checks (start < end, within video duration, non-negative)
5. New timeframe added to array via callback
6. Parent component updates state
7. Component re-renders with new timeframe list

## Dependencies
- `../utils/timeframes`: Timeframe type, ID generation
- React hooks: `useState`, `useCallback`

## Key Functions

### `formatTime(seconds: number): string`
- **Purpose:** Convert seconds to MM:SS format
- **Inputs:** Number of seconds
- **Outputs:** Formatted string (e.g., "01:30")
- **Complexity:** Simple

### `parseTime(input: string): number | null`
- **Purpose:** Parse MM:SS or plain number to seconds
- **Inputs:** String input from user
- **Outputs:** Seconds as number, or null if invalid
- **Complexity:** Simple

### `validateTimeframe(start: number, end: number): string | null`
- **Purpose:** Validate timeframe values
- **Inputs:** Start and end times in seconds
- **Outputs:** Error message string or null if valid
- **Complexity:** Simple

### `handleAdd()`
- **Purpose:** Add new timeframe to list
- **Side effects:** Updates parent state, clears form inputs
- **Complexity:** Simple

### `handleRemove(id: string)`
- **Purpose:** Remove timeframe from list
- **Side effects:** Updates parent state
- **Complexity:** Simple

### `handleUpdate(id: string, start: number, end: number)`
- **Purpose:** Update existing timeframe
- **Side effects:** Updates parent state, exits edit mode
- **Complexity:** Simple

## Current Patterns
- Inline styles (not using design system)
- Basic form inputs with minimal styling
- Simple list rendering
- No animations or transitions
- Basic error display

## Known Issues
- Uses inline styles instead of design system CSS variables
- No visual feedback on interactions (hover, focus, active states)
- No animations for add/remove/edit operations
- Empty state is plain text
- Buttons have basic styling
- No microinteractions or polish
- Input fields could have better UX (focus states, transitions)

## Performance Characteristics
- Lightweight component, minimal re-renders
- Uses `useCallback` for handlers (good)
- No performance issues identified

## Security Considerations
- Input validation prevents invalid timeframes
- No XSS concerns (React handles escaping)

## Codebase Context
- Design system exists in `index.css` with CSS variables
- Other components use design system classes
- Component is used in `App.tsx` in editor mode
- Timeframes are sorted and passed to `ProcessedVideo` component
