# Understanding: Blur Mode Performance

**Analyzed:** 2025-01-12
**Target:** `frontend/src/utils/filters.ts` - `applyBlur` function

---

## Purpose

The blur filter applies a Gaussian blur effect to video frames in real-time. It's used as one of the background filter options (alongside grayscale and sepia) to create a bokeh-style background blur effect while keeping the person in focus.

## Architecture

The blur filter is implemented as a pure function in `filters.ts`:
- **Function:** `applyBlur(imageData: ImageData, radius: number = 5): void`
- **Called from:** `ProcessedVideo.tsx` → `composite()` → `applyFilter()` → `FILTERS['blur']`
- **Execution context:** Runs in hot loop at ~30fps for video processing

## Data Flow

1. Video frame captured → `ImageData` object created
2. `applyFilter(filtered, filterType)` called with `filterType='blur'`
3. `FILTERS['blur']` → `applyBlur(imageData)`
4. Blur applied in-place to `imageData.data` (Uint8ClampedArray)
5. Blurred frame used in compositing with segmentation mask

## Current Implementation

### Algorithm: Naive Box Blur (O(n*radius²))

```142:177:frontend/src/utils/filters.ts
export function applyBlur(imageData: ImageData, radius: number = 5): void {
  const { width, height, data } = imageData;

  // Create copy since we need to read original values while writing
  const original = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      // Sample all pixels in radius
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          // Skip out-of-bounds pixels
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

          const idx = (ny * width + nx) * 4;
          r += original[idx];
          g += original[idx + 1];
          b += original[idx + 2];
          count++;
        }
      }

      // Write averaged values
      const idx = (y * width + x) * 4;
      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
      // Alpha unchanged
    }
  }
}
```

### Performance Characteristics

**Complexity:** O(n * radius²)
- For each pixel: samples (2*radius+1)² neighboring pixels
- For radius=5: samples 11×11 = 121 pixels per output pixel
- For 1080p (1920×1080 = 2,073,600 pixels): ~251 million operations per frame
- At 30fps: ~7.5 billion operations per second

**Memory:**
- Creates full copy of image data: `new Uint8ClampedArray(data)` 
- For 1080p: ~8MB copy per frame
- At 30fps: ~240MB/sec memory allocation

**CPU-bound:** All processing happens on CPU, blocking main thread

## Known Issues

1. **Severe Performance Problem:** O(n*radius²) complexity makes it unusable for real-time video
   - Comments in code acknowledge this (lines 52-53, 130-134)
   - Causes lag/jank when blur filter is selected

2. **Memory Pressure:** Creates full image copy every frame
   - GC pressure from frequent allocations
   - Can cause frame drops

3. **CPU-bound:** No GPU acceleration
   - Blocks main thread
   - Can't leverage GPU for parallel processing

## Codebase Context

### Similar Pattern Already Exists

`ProcessedVideo.tsx` already uses GPU-accelerated blur for mask feathering:

```208:241:frontend/src/components/ProcessedVideo.tsx
  const featherMask = useCallback((maskData: ImageData, blurRadius: number = 2): ImageData => {
    const { width, height } = maskData;
    
    // Create/reuse temporary canvases for GPU-accelerated blur
    if (!tempCanvas1Ref.current) {
      tempCanvas1Ref.current = document.createElement('canvas');
      tempCanvas2Ref.current = document.createElement('canvas');
    }
    const sourceCanvas = tempCanvas1Ref.current;
    const destCanvas = tempCanvas2Ref.current;
    
    if (!sourceCanvas || !destCanvas) return maskData; // Fallback if canvas unavailable
    
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    destCanvas.width = width;
    destCanvas.height = height;
    
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: false });
    const destCtx = destCanvas.getContext('2d', { willReadFrequently: false });
    
    if (!sourceCtx || !destCtx) return maskData; // Fallback if canvas unavailable

    // Draw mask to source canvas
    sourceCtx.putImageData(maskData, 0, 0);
    
    // Apply GPU-accelerated blur filter to destination canvas
    destCtx.filter = `blur(${blurRadius}px)`;
    destCtx.drawImage(sourceCanvas, 0, 0);
    destCtx.filter = 'none'; // Reset filter
    
    // Read back blurred result
    return destCtx.getImageData(0, 0, width, height);
  }, []);
```

**Key insight:** Canvas filter API with `ctx.filter = 'blur()'` is GPU-accelerated and much faster than CPU box blur.

### How Blur is Used

Called from `ProcessedVideo.tsx` in the compositing function:

```288:296:frontend/src/components/ProcessedVideo.tsx
      // Create a copy for filtered version (don't modify original)
      const filtered = new ImageData(
        new Uint8ClampedArray(frame.data),
        width,
        height
      );

      // Apply the selected filter to the copy
      applyFilter(filtered, filterType);
```

The filter function signature is: `(imageData: ImageData) => void` - modifies in-place.

## Performance Comparison

**Current (CPU Box Blur):**
- 1080p frame: ~251M operations
- Time: ~100-200ms per frame (estimated)
- FPS: ~5-10fps (unusable)

**Proposed (GPU Canvas Filter):**
- 1080p frame: GPU-accelerated
- Time: ~5-10ms per frame (estimated)
- FPS: 30-60fps (smooth)

**Improvement:** ~20-40x faster

## Security Considerations

- No security issues (pure image processing)
- Canvas operations are safe

## Dependencies

- `ImageData` - standard Web API
- Canvas 2D context (for GPU-accelerated version)
- No external libraries needed
