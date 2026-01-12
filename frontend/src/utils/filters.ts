/**
 * filters.ts
 *
 * Pure functions for image filtering. Each filter transforms ImageData in-place.
 *
 * ============================================================================
 * ARCHITECTURE DECISION
 * ============================================================================
 *
 * Why pure functions instead of a class?
 * - Simpler to understand and test
 * - No state to manage
 * - Easy to compose: you could chain filters if needed
 * - Tree-shakeable: unused filters won't be bundled
 *
 * Why modify in-place instead of returning new ImageData?
 * - Performance: ImageData can be large (1920x1080 = 8MB)
 * - We're in a hot loop (60fps), allocations = GC pressure = jank
 * - The consumer typically doesn't need the original after filtering
 *
 * ============================================================================
 * HOW TO ADD A NEW FILTER
 * ============================================================================
 *
 * 1. Create a function with signature: (imageData: ImageData) => void
 * 2. Modify imageData.data in-place (it's a Uint8ClampedArray)
 * 3. Data format is RGBA: [r0, g0, b0, a0, r1, g1, b1, a1, ...]
 * 4. Add to FILTERS object at the bottom
 * 5. Add to FilterType union type
 *
 * Example:
 * ```ts
 * function applyInvert(imageData: ImageData): void {
 *   const data = imageData.data;
 *   for (let i = 0; i < data.length; i += 4) {
 *     data[i] = 255 - data[i];       // R
 *     data[i + 1] = 255 - data[i + 1]; // G
 *     data[i + 2] = 255 - data[i + 2]; // B
 *     // Alpha unchanged
 *   }
 * }
 * ```
 *
 * ============================================================================
 * PERFORMANCE NOTES
 * ============================================================================
 *
 * - These run on CPU. For extreme performance, consider WebGL shaders.
 * - Current implementation is "good enough" for 1080p @ 30fps on modern hardware.
 * - If targeting older devices, consider processing at lower resolution and upscaling.
 *
 * - The blur filter is O(n*radius²) - expensive for large radius.
 *   For production blur, use separable gaussian (O(n*radius)) or downsample trick.
 *
 */

/**
 * Available filter types.
 * Add new filters here when implementing.
 */
export type FilterType = 'grayscale' | 'sepia' | 'blur' | 'none';

/**
 * Metadata about each filter for UI display
 */
export interface FilterInfo {
  id: FilterType;
  name: string;
  description: string;
}

/** Filter registry for UI components */
export const FILTER_INFO: FilterInfo[] = [
  { id: 'none', name: 'None', description: 'No filter applied' },
  { id: 'grayscale', name: 'Grayscale', description: 'Classic black & white' },
  { id: 'sepia', name: 'Sepia', description: 'Warm vintage tone' },
  { id: 'blur', name: 'Blur', description: 'Gaussian blur effect' },
];

/**
 * Convert to grayscale using luminosity method.
 *
 * Why luminosity (0.299R + 0.587G + 0.114B) instead of average?
 * - Human eyes are more sensitive to green, less to blue
 * - Luminosity weights match perceived brightness
 * - Same formula used by professional tools (Photoshop, etc.)
 *
 * @param imageData - Modified in-place
 */
export function applyGrayscale(imageData: ImageData): void {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Luminosity formula - matches human perception
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha (data[i + 3]) unchanged
  }
}

/**
 * Apply sepia tone for vintage look.
 *
 * The formula applies warm brown tones while maintaining some
 * color variation. Classic sepia tone formula from image processing.
 *
 * @param imageData - Modified in-place
 */
export function applySepia(imageData: ImageData): void {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard sepia matrix transformation
    // Clamp values to 255 (Uint8ClampedArray does this automatically)
    data[i] = r * 0.393 + g * 0.769 + b * 0.189;     // New R
    data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168; // New G
    data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131; // New B
  }
}

/**
 * Apply simple box blur.
 *
 * NOTE: This is a naive O(n*radius²) implementation for simplicity.
 * For production with large radius, use:
 * - Separable gaussian blur (two 1D passes)
 * - Stackblur algorithm
 * - WebGL shader
 *
 * Current radius of 5 is reasonable for the "soft focus" effect
 * without destroying performance.
 *
 * @param imageData - Modified in-place
 * @param radius - Blur radius in pixels (default: 5)
 */
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

/**
 * No-op filter (passthrough).
 * Useful when user wants to toggle effect off without changing code paths.
 */
export function applyNone(_imageData: ImageData): void {
  // Intentionally empty - no transformation
}

/**
 * Filter function lookup table.
 *
 * Using a record instead of switch statement:
 * - Easier to add new filters
 * - Type-safe: TypeScript ensures all FilterTypes have an entry
 * - Can be iterated for dynamic UI generation
 */
export const FILTERS: Record<FilterType, (imageData: ImageData) => void> = {
  grayscale: applyGrayscale,
  sepia: applySepia,
  blur: applyBlur,
  none: applyNone,
};

/**
 * Apply a filter by name.
 *
 * @param imageData - Modified in-place
 * @param filterType - Which filter to apply
 *
 * @example
 * ```ts
 * const imageData = ctx.getImageData(0, 0, width, height);
 * applyFilter(imageData, 'grayscale');
 * ctx.putImageData(imageData, 0, 0);
 * ```
 */
export function applyFilter(imageData: ImageData, filterType: FilterType): void {
  const filterFn = FILTERS[filterType];
  if (filterFn) {
    filterFn(imageData);
  }
}
