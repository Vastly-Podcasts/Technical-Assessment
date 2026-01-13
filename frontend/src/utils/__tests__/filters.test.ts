/**
 * filters.test.ts
 *
 * Unit tests for image filter functions.
 *
 * Test Strategy:
 * - Test each filter function independently
 * - Verify in-place modification behavior
 * - Check edge cases (empty, single pixel, large images)
 * - Verify alpha channel preservation
 */

import {
  applyGrayscale,
  applySepia,
  applyBlur,
  applyNone,
  applyFilter,
  FILTERS,
  FILTER_INFO,
  FilterType,
} from '../filters';

/**
 * Helper to create ImageData-like object for testing.
 * Jest runs in jsdom which has ImageData, but we create a simple helper
 * for clarity and explicit control.
 */
function createImageData(pixels: number[]): ImageData {
  const data = new Uint8ClampedArray(pixels);
  const pixelCount = data.length / 4;
  const width = pixelCount;
  const height = 1;
  return {
    data,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

/**
 * Helper to create 2D ImageData.
 */
function createImageData2D(width: number, height: number, pixels: number[]): ImageData {
  const data = new Uint8ClampedArray(pixels);
  return {
    data,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('applyGrayscale', () => {
  describe('happy path', () => {
    test('converts pure red to gray using luminosity formula', () => {
      // Pure red (255, 0, 0)
      const imageData = createImageData([255, 0, 0, 255]);

      applyGrayscale(imageData);

      // Luminosity: 255 * 0.299 + 0 * 0.587 + 0 * 0.114 = 76.245
      const expectedGray = Math.round(255 * 0.299);
      expect(imageData.data[0]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[1]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[2]).toBeCloseTo(expectedGray, 0);
    });

    test('converts pure green to gray', () => {
      const imageData = createImageData([0, 255, 0, 255]);

      applyGrayscale(imageData);

      // Luminosity: 0 * 0.299 + 255 * 0.587 + 0 * 0.114 = 149.685
      const expectedGray = Math.round(255 * 0.587);
      expect(imageData.data[0]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[1]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[2]).toBeCloseTo(expectedGray, 0);
    });

    test('converts pure blue to gray', () => {
      const imageData = createImageData([0, 0, 255, 255]);

      applyGrayscale(imageData);

      // Luminosity: 0 * 0.299 + 0 * 0.587 + 255 * 0.114 = 29.07
      const expectedGray = Math.round(255 * 0.114);
      expect(imageData.data[0]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[1]).toBeCloseTo(expectedGray, 0);
      expect(imageData.data[2]).toBeCloseTo(expectedGray, 0);
    });

    test('keeps pure white as white', () => {
      const imageData = createImageData([255, 255, 255, 255]);

      applyGrayscale(imageData);

      // White stays white (255 * 0.299 + 255 * 0.587 + 255 * 0.114 = 255)
      expect(imageData.data[0]).toBe(255);
      expect(imageData.data[1]).toBe(255);
      expect(imageData.data[2]).toBe(255);
    });

    test('keeps pure black as black', () => {
      const imageData = createImageData([0, 0, 0, 255]);

      applyGrayscale(imageData);

      expect(imageData.data[0]).toBe(0);
      expect(imageData.data[1]).toBe(0);
      expect(imageData.data[2]).toBe(0);
    });
  });

  describe('perceptual correctness', () => {
    test('green appears brighter than red (human eye sensitivity)', () => {
      const red = createImageData([255, 0, 0, 255]);
      const green = createImageData([0, 255, 0, 255]);

      applyGrayscale(red);
      applyGrayscale(green);

      // Green should be brighter (higher gray value) than red
      expect(green.data[0]).toBeGreaterThan(red.data[0]);
    });

    test('red appears brighter than blue (human eye sensitivity)', () => {
      const red = createImageData([255, 0, 0, 255]);
      const blue = createImageData([0, 0, 255, 255]);

      applyGrayscale(red);
      applyGrayscale(blue);

      // Red should be brighter than blue
      expect(red.data[0]).toBeGreaterThan(blue.data[0]);
    });
  });

  describe('alpha channel preservation', () => {
    test('preserves fully opaque alpha', () => {
      const imageData = createImageData([255, 0, 0, 255]);

      applyGrayscale(imageData);

      expect(imageData.data[3]).toBe(255);
    });

    test('preserves transparent alpha', () => {
      const imageData = createImageData([255, 0, 0, 0]);

      applyGrayscale(imageData);

      expect(imageData.data[3]).toBe(0);
    });

    test('preserves semi-transparent alpha', () => {
      const imageData = createImageData([255, 0, 0, 128]);

      applyGrayscale(imageData);

      expect(imageData.data[3]).toBe(128);
    });
  });

  describe('edge cases', () => {
    test('handles empty ImageData', () => {
      const imageData = createImageData([]);

      // Should not throw
      expect(() => applyGrayscale(imageData)).not.toThrow();
    });

    test('handles multiple pixels', () => {
      const imageData = createImageData([
        255, 0, 0, 255, // Red
        0, 255, 0, 255, // Green
        0, 0, 255, 255, // Blue
      ]);

      applyGrayscale(imageData);

      // Each pixel should be converted independently
      expect(imageData.data[0]).toBeCloseTo(76, 0); // Red -> gray
      expect(imageData.data[4]).toBeCloseTo(150, 0); // Green -> gray
      expect(imageData.data[8]).toBeCloseTo(29, 0); // Blue -> gray
    });
  });

  describe('in-place modification', () => {
    test('modifies original ImageData (returns undefined)', () => {
      const imageData = createImageData([255, 0, 0, 255]);

      const result = applyGrayscale(imageData);

      expect(result).toBeUndefined();
      expect(imageData.data[0]).not.toBe(255); // Was modified
    });
  });
});

describe('applySepia', () => {
  describe('happy path', () => {
    test('applies sepia tone to mid-gray', () => {
      // Use mid-gray (100, 100, 100) instead of white to avoid clamping
      const imageData = createImageData([100, 100, 100, 255]);

      applySepia(imageData);

      // Sepia gives warm brownish tones
      // R should be highest, then G, then B
      expect(imageData.data[0]).toBeGreaterThan(imageData.data[1]);
      expect(imageData.data[1]).toBeGreaterThan(imageData.data[2]);
    });

    test('keeps pure black as black', () => {
      const imageData = createImageData([0, 0, 0, 255]);

      applySepia(imageData);

      expect(imageData.data[0]).toBe(0);
      expect(imageData.data[1]).toBe(0);
      expect(imageData.data[2]).toBe(0);
    });

    test('applies sepia transformation matrix correctly', () => {
      const imageData = createImageData([100, 100, 100, 255]);

      applySepia(imageData);

      // Sepia matrix for (100, 100, 100):
      // R: 100*0.393 + 100*0.769 + 100*0.189 = 135.1
      // G: 100*0.349 + 100*0.686 + 100*0.168 = 120.3
      // B: 100*0.272 + 100*0.534 + 100*0.131 = 93.7
      expect(imageData.data[0]).toBeCloseTo(135, 0);
      expect(imageData.data[1]).toBeCloseTo(120, 0);
      expect(imageData.data[2]).toBeCloseTo(94, 0);
    });
  });

  describe('clamping behavior', () => {
    test('clamps values exceeding 255', () => {
      // High values that would exceed 255 after sepia transform
      const imageData = createImageData([255, 255, 255, 255]);

      applySepia(imageData);

      // Uint8ClampedArray automatically clamps
      expect(imageData.data[0]).toBeLessThanOrEqual(255);
      expect(imageData.data[1]).toBeLessThanOrEqual(255);
      expect(imageData.data[2]).toBeLessThanOrEqual(255);
    });
  });

  describe('alpha channel preservation', () => {
    test('preserves alpha channel', () => {
      const imageData = createImageData([100, 100, 100, 128]);

      applySepia(imageData);

      expect(imageData.data[3]).toBe(128);
    });
  });
});

describe('applyBlur', () => {
  /**
   * Note: applyBlur uses browser canvas APIs with module-level cached canvases.
   * In jsdom, canvas is limited, so we test what we can:
   * - Function accepts parameters without throwing
   * - Modifies imageData (or leaves it unchanged if canvas APIs fail)
   */
  describe('function contract', () => {
    test('does not throw with valid ImageData', () => {
      const imageData = createImageData2D(1, 1, [255, 0, 0, 255]);

      expect(() => applyBlur(imageData)).not.toThrow();
    });

    test('accepts custom blur radius parameter', () => {
      const imageData = createImageData2D(1, 1, [255, 0, 0, 255]);

      expect(() => applyBlur(imageData, 10)).not.toThrow();
    });

    test('handles 2D imageData with width and height', () => {
      const imageData = createImageData2D(2, 2, [
        255, 0, 0, 255, // pixel 1
        0, 255, 0, 255, // pixel 2
        0, 0, 255, 255, // pixel 3
        255, 255, 0, 255, // pixel 4
      ]);

      expect(() => applyBlur(imageData)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    test('handles empty ImageData', () => {
      const imageData = createImageData2D(0, 0, []);

      expect(() => applyBlur(imageData)).not.toThrow();
    });

    test('handles zero blur radius', () => {
      const imageData = createImageData2D(1, 1, [255, 0, 0, 255]);

      expect(() => applyBlur(imageData, 0)).not.toThrow();
    });

    test('handles large blur radius', () => {
      const imageData = createImageData2D(1, 1, [255, 0, 0, 255]);

      expect(() => applyBlur(imageData, 100)).not.toThrow();
    });
  });
});

describe('applyNone', () => {
  test('does not modify ImageData', () => {
    const originalPixels = [255, 128, 64, 200];
    const imageData = createImageData([...originalPixels]);

    applyNone(imageData);

    expect(Array.from(imageData.data)).toEqual(originalPixels);
  });

  test('handles empty ImageData', () => {
    const imageData = createImageData([]);

    expect(() => applyNone(imageData)).not.toThrow();
  });
});

describe('applyFilter', () => {
  describe('filter dispatch', () => {
    test('dispatches to grayscale filter', () => {
      const imageData = createImageData([255, 0, 0, 255]);

      applyFilter(imageData, 'grayscale');

      // Should have applied grayscale (R, G, B all equal)
      expect(imageData.data[0]).toBe(imageData.data[1]);
      expect(imageData.data[1]).toBe(imageData.data[2]);
    });

    test('dispatches to sepia filter', () => {
      const imageData = createImageData([100, 100, 100, 255]);

      applyFilter(imageData, 'sepia');

      // Sepia: R > G > B
      expect(imageData.data[0]).toBeGreaterThan(imageData.data[2]);
    });

    test('dispatches to none filter', () => {
      const imageData = createImageData([255, 128, 64, 255]);
      const originalR = imageData.data[0];

      applyFilter(imageData, 'none');

      expect(imageData.data[0]).toBe(originalR);
    });
  });

  describe('type safety', () => {
    test('all FilterType values have corresponding filter function', () => {
      const filterTypes: FilterType[] = ['grayscale', 'sepia', 'blur', 'none'];

      filterTypes.forEach((type) => {
        expect(FILTERS[type]).toBeDefined();
        expect(typeof FILTERS[type]).toBe('function');
      });
    });
  });
});

describe('FILTER_INFO', () => {
  test('has entry for each filter type', () => {
    const filterTypes: FilterType[] = ['grayscale', 'sepia', 'blur', 'none'];

    filterTypes.forEach((type) => {
      const info = FILTER_INFO.find((f) => f.id === type);
      expect(info).toBeDefined();
      expect(info?.name).toBeTruthy();
      expect(info?.description).toBeTruthy();
    });
  });

  test('has correct count of filters', () => {
    expect(FILTER_INFO.length).toBe(20);
  });
});
