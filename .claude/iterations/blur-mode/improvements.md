# Improvements: Blur Mode Performance

**Identified:** 2025-01-12

---

## Code Reduction Opportunities

None - the issue is algorithmic complexity, not code duplication.

## Performance Improvements

### Critical: Replace CPU Box Blur with GPU-Accelerated Canvas Filter

**Location:** `frontend/src/utils/filters.ts:142-177`

**Problem:**
- Current implementation uses O(n*radius²) CPU box blur
- For 1080p video: ~251M operations per frame
- Causes severe lag (5-10fps instead of 30fps)
- Blocks main thread

**Solution:**
- Use Canvas 2D filter API (GPU-accelerated) like `featherMask` does
- Same approach already proven to work in `ProcessedVideo.tsx`
- Orders of magnitude faster (20-40x improvement)

**Approach:**
1. Create temporary canvas elements (reuse across calls)
2. Draw ImageData to canvas
3. Apply `ctx.filter = 'blur(radius)'` (GPU-accelerated)
4. Read back result as ImageData
5. Copy to original ImageData buffer (maintain in-place API)

**Impact:**
- Performance: 20-40x faster
- User experience: Smooth 30fps playback
- Memory: Slightly more (canvas overhead) but acceptable
- Code complexity: Similar or simpler

**Priority:** **HIGH** - Critical performance issue affecting UX

**Risk:** Low - same technique already used successfully in codebase

## Robustness Improvements

### Add Fallback for Canvas Unavailability

**Location:** New blur implementation

**Problem:**
- If canvas context creation fails, filter should gracefully degrade

**Solution:**
- Check if canvas context is available
- Fallback to original imageData if unavailable (no-op or minimal blur)

**Priority:** Medium

**Risk:** Low

## Maintainability Improvements

### Update Documentation Comments

**Location:** `filters.ts` blur function comments

**Problem:**
- Comments mention naive implementation but don't reflect GPU-accelerated version

**Solution:**
- Update comments to explain GPU-accelerated approach
- Remove outdated "naive implementation" warnings

**Priority:** Low

**Risk:** None

## UX Improvements

### Immediate: Smooth Blur Performance

**Impact:**
- Users can now use blur filter without lag
- Smooth 30fps playback
- Professional-quality effect

**Priority:** High

---

## Prioritized Improvement Plan

### High Priority (Immediate UX Impact)

1. **Replace CPU blur with GPU-accelerated canvas filter**
   - **Why:** Critical performance issue - blur mode is unusable
   - **Impact:** 20-40x performance improvement, smooth playback
   - **Estimated time:** 30 minutes
   - **Risk:** Low (proven technique)

### Medium Priority (Quality of Life)

2. **Add fallback for canvas unavailability**
   - **Why:** Robustness - handle edge cases
   - **Impact:** Prevents crashes in edge cases
   - **Estimated time:** 10 minutes
   - **Risk:** Low

### Low Priority (Nice to Have)

3. **Update documentation comments**
   - **Why:** Code clarity
   - **Impact:** Better developer experience
   - **Estimated time:** 5 minutes
   - **Risk:** None

---

## Implementation Strategy

### Phase 1: Core Performance Fix

1. Modify `applyBlur` to use canvas filter API
2. Reuse canvas elements (static module-level refs)
3. Maintain same function signature (in-place modification)
4. Test with 1080p video

### Phase 2: Robustness

1. Add canvas context availability checks
2. Add fallback behavior
3. Test edge cases

### Phase 3: Documentation

1. Update function comments
2. Update performance notes in file header
