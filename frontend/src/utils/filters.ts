/**
 * filters.ts
 *
 * Pure functions for image filtering. Each filter transforms ImageData in-place.
 *
 * NOW WITH 20 FILTERS - from classic to wild!
 */

/**
 * Available filter types.
 */
export type FilterType =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'blur'
  | 'invert'
  | 'pixelate'
  | 'posterize'
  | 'cyberpunk'
  | 'vaporwave'
  | 'nightvision'
  | 'thermal'
  | 'glitch'
  | 'duotone'
  | 'saturate'
  | 'desaturate'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'noir'
  | 'emboss';

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
  { id: 'blur', name: 'Blur', description: 'Soft focus effect' },
  { id: 'invert', name: 'Invert', description: 'Photo negative' },
  { id: 'pixelate', name: 'Pixelate', description: '8-bit retro look' },
  { id: 'posterize', name: 'Posterize', description: 'Pop art colors' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon magenta vibes' },
  { id: 'vaporwave', name: 'Vaporwave', description: 'Aesthetic pink & cyan' },
  { id: 'nightvision', name: 'Night Vision', description: 'Military green glow' },
  { id: 'thermal', name: 'Thermal', description: 'Heat signature look' },
  { id: 'glitch', name: 'Glitch', description: 'RGB channel chaos' },
  { id: 'duotone', name: 'Duotone', description: 'Two-tone gradient' },
  { id: 'saturate', name: 'Vivid', description: 'Boosted colors' },
  { id: 'desaturate', name: 'Muted', description: 'Subdued tones' },
  { id: 'warm', name: 'Warm', description: 'Golden hour glow' },
  { id: 'cool', name: 'Cool', description: 'Arctic blue tint' },
  { id: 'vintage', name: 'Vintage', description: 'Faded film look' },
  { id: 'noir', name: 'Noir', description: 'High contrast drama' },
  { id: 'emboss', name: 'Emboss', description: '3D raised effect' },
];

// ============================================================================
// CLASSIC FILTERS
// ============================================================================

export function applyNone(_imageData: ImageData): void {
  // No-op
}

export function applyGrayscale(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

export function applySepia(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = r * 0.393 + g * 0.769 + b * 0.189;
    data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
    data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
  }
}

let blurSourceCanvas: HTMLCanvasElement | null = null;
let blurDestCanvas: HTMLCanvasElement | null = null;

export function applyBlur(imageData: ImageData, radius: number = 5): void {
  const { width, height, data } = imageData;
  if (!blurSourceCanvas) {
    blurSourceCanvas = document.createElement('canvas');
    blurDestCanvas = document.createElement('canvas');
  }
  if (!blurSourceCanvas || !blurDestCanvas) return;

  blurSourceCanvas.width = width;
  blurSourceCanvas.height = height;
  blurDestCanvas.width = width;
  blurDestCanvas.height = height;

  const sourceCtx = blurSourceCanvas.getContext('2d', { willReadFrequently: false });
  const destCtx = blurDestCanvas.getContext('2d', { willReadFrequently: false });
  if (!sourceCtx || !destCtx) return;

  sourceCtx.putImageData(imageData, 0, 0);
  destCtx.filter = `blur(${radius}px)`;
  destCtx.drawImage(blurSourceCanvas, 0, 0);
  destCtx.filter = 'none';

  const blurredData = destCtx.getImageData(0, 0, width, height);
  data.set(blurredData.data);
}

export function applyInvert(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
}

// ============================================================================
// RETRO & ARTISTIC
// ============================================================================

export function applyPixelate(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const pixelSize = 8;

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Sample center of block
      const centerX = Math.min(x + Math.floor(pixelSize / 2), width - 1);
      const centerY = Math.min(y + Math.floor(pixelSize / 2), height - 1);
      const idx = (centerY * width + centerX) * 4;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      // Fill entire block with that color
      for (let py = y; py < Math.min(y + pixelSize, height); py++) {
        for (let px = x; px < Math.min(x + pixelSize, width); px++) {
          const pIdx = (py * width + px) * 4;
          data[pIdx] = r;
          data[pIdx + 1] = g;
          data[pIdx + 2] = b;
        }
      }
    }
  }
}

export function applyPosterize(imageData: ImageData): void {
  const data = imageData.data;
  const levels = 4;
  const step = 255 / levels;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }
}

export function applyVintage(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Fade blacks, reduce contrast, add warmth
    const r = data[i], g = data[i + 1], b = data[i + 2];

    // Lift blacks
    data[i] = Math.min(255, r * 0.9 + 30);
    data[i + 1] = Math.min(255, g * 0.85 + 20);
    data[i + 2] = Math.min(255, b * 0.8 + 10);

    // Slight desaturation
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i] * 0.7 + gray * 0.3;
    data[i + 1] = data[i + 1] * 0.7 + gray * 0.3;
    data[i + 2] = data[i + 2] * 0.7 + gray * 0.3;
  }
}

export function applyNoir(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // High contrast grayscale
    let gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // S-curve for contrast boost
    gray = gray / 255;
    gray = gray < 0.5
      ? 2 * gray * gray
      : 1 - 2 * (1 - gray) * (1 - gray);
    gray = gray * 255;

    // Crush blacks slightly
    gray = Math.max(0, gray - 10);

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

// ============================================================================
// CYBERPUNK & NEON
// ============================================================================

export function applyCyberpunk(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    // Shift towards magenta and cyan
    data[i] = Math.min(255, r * 1.2 + 20);     // Boost red
    data[i + 1] = g * 0.6;                      // Reduce green
    data[i + 2] = Math.min(255, b * 1.3 + 30); // Boost blue
  }
}

export function applyVaporwave(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = r * 0.299 + g * 0.587 + b * 0.114;

    // Pink to cyan gradient based on luminance
    const t = luma / 255;

    // Pink: #ff71ce, Cyan: #01cdfe
    data[i] = 255 * (1 - t) + 1 * t;           // R: pink to cyan
    data[i + 1] = 113 * (1 - t) + 205 * t;     // G
    data[i + 2] = 206 * (1 - t) + 254 * t;     // B
  }
}

export function applyNightvision(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Phosphor green with slight noise
    const noise = (Math.random() - 0.5) * 20;
    const green = Math.min(255, luma * 1.5 + noise);

    data[i] = green * 0.1;        // Almost no red
    data[i + 1] = green;          // Full green
    data[i + 2] = green * 0.1;    // Almost no blue
  }
}

export function applyThermal(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const luma = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;

    // Heat map: black -> blue -> purple -> red -> orange -> yellow -> white
    let r, g, b;
    if (luma < 0.2) {
      // Black to blue
      const t = luma / 0.2;
      r = 0; g = 0; b = t * 128;
    } else if (luma < 0.4) {
      // Blue to purple
      const t = (luma - 0.2) / 0.2;
      r = t * 128; g = 0; b = 128 + t * 64;
    } else if (luma < 0.6) {
      // Purple to red
      const t = (luma - 0.4) / 0.2;
      r = 128 + t * 127; g = 0; b = 192 - t * 192;
    } else if (luma < 0.8) {
      // Red to orange/yellow
      const t = (luma - 0.6) / 0.2;
      r = 255; g = t * 200; b = 0;
    } else {
      // Yellow to white
      const t = (luma - 0.8) / 0.2;
      r = 255; g = 200 + t * 55; b = t * 255;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

// ============================================================================
// GLITCH & EXPERIMENTAL
// ============================================================================

export function applyGlitch(imageData: ImageData): void {
  const { width, height, data } = imageData;

  // RGB channel shift
  const shiftAmount = 8;
  const copy = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Shift red channel right
      const redX = Math.min(width - 1, x + shiftAmount);
      const redIdx = (y * width + redX) * 4;
      data[idx] = copy[redIdx];

      // Keep green in place
      data[idx + 1] = copy[idx + 1];

      // Shift blue channel left
      const blueX = Math.max(0, x - shiftAmount);
      const blueIdx = (y * width + blueX) * 4;
      data[idx + 2] = copy[blueIdx + 2];
    }
  }

  // Add occasional horizontal glitch lines
  for (let i = 0; i < 5; i++) {
    const y = Math.floor(Math.random() * height);
    const lineWidth = Math.floor(Math.random() * 3) + 1;
    const offset = Math.floor(Math.random() * 40) - 20;

    for (let dy = 0; dy < lineWidth && y + dy < height; dy++) {
      for (let x = 0; x < width; x++) {
        const srcX = (x + offset + width) % width;
        const srcIdx = ((y + dy) * width + srcX) * 4;
        const dstIdx = ((y + dy) * width + x) * 4;
        data[dstIdx] = copy[srcIdx];
        data[dstIdx + 1] = copy[srcIdx + 1];
        data[dstIdx + 2] = copy[srcIdx + 2];
      }
    }
  }
}

export function applyDuotone(imageData: ImageData): void {
  const data = imageData.data;

  // Deep purple to gold
  const dark = { r: 45, g: 20, b: 80 };   // Dark purple
  const light = { r: 255, g: 200, b: 50 }; // Gold

  for (let i = 0; i < data.length; i += 4) {
    const luma = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;

    data[i] = dark.r + (light.r - dark.r) * luma;
    data[i + 1] = dark.g + (light.g - dark.g) * luma;
    data[i + 2] = dark.b + (light.b - dark.b) * luma;
  }
}

export function applyEmboss(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);

  // Emboss kernel: detect edges and add 3D effect
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        // Simple emboss: difference between diagonal pixels
        const topLeft = copy[((y - 1) * width + (x - 1)) * 4 + c];
        const bottomRight = copy[((y + 1) * width + (x + 1)) * 4 + c];

        // Emboss formula: difference + 128 (gray bias)
        data[idx + c] = Math.min(255, Math.max(0, bottomRight - topLeft + 128));
      }
    }
  }
}

// ============================================================================
// COLOR ADJUSTMENTS
// ============================================================================

export function applySaturate(imageData: ImageData): void {
  const data = imageData.data;
  const saturationBoost = 1.5;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * saturationBoost));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * saturationBoost));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * saturationBoost));
  }
}

export function applyDesaturate(imageData: ImageData): void {
  const data = imageData.data;
  const saturationAmount = 0.3; // Keep 30% of color

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    data[i] = gray + (r - gray) * saturationAmount;
    data[i + 1] = gray + (g - gray) * saturationAmount;
    data[i + 2] = gray + (b - gray) * saturationAmount;
  }
}

export function applyWarm(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Add warmth: boost red/yellow, reduce blue
    data[i] = Math.min(255, data[i] * 1.1 + 10);     // Boost red
    data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slight green boost
    data[i + 2] = Math.max(0, data[i + 2] * 0.9);    // Reduce blue
  }
}

export function applyCool(imageData: ImageData): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Add coolness: boost blue, reduce red/yellow
    data[i] = Math.max(0, data[i] * 0.9);              // Reduce red
    data[i + 1] = data[i + 1];                         // Keep green
    data[i + 2] = Math.min(255, data[i + 2] * 1.15 + 10); // Boost blue
  }
}

// ============================================================================
// FILTER REGISTRY
// ============================================================================

export const FILTERS: Record<FilterType, (imageData: ImageData) => void> = {
  none: applyNone,
  grayscale: applyGrayscale,
  sepia: applySepia,
  blur: applyBlur,
  invert: applyInvert,
  pixelate: applyPixelate,
  posterize: applyPosterize,
  cyberpunk: applyCyberpunk,
  vaporwave: applyVaporwave,
  nightvision: applyNightvision,
  thermal: applyThermal,
  glitch: applyGlitch,
  duotone: applyDuotone,
  saturate: applySaturate,
  desaturate: applyDesaturate,
  warm: applyWarm,
  cool: applyCool,
  vintage: applyVintage,
  noir: applyNoir,
  emboss: applyEmboss,
};

export function applyFilter(imageData: ImageData, filterType: FilterType): void {
  const filterFn = FILTERS[filterType];
  if (filterFn) {
    filterFn(imageData);
  }
}
