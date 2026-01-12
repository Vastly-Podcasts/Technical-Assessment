/**
 * timeframes.test.ts
 *
 * Unit tests for timeframe utilities.
 *
 * Test Strategy:
 * - Test sorting behavior (immutability, correctness)
 * - Test active detection (boundaries, empty arrays)
 * - Test ID generation (uniqueness, format)
 */

import {
  Timeframe,
  sortTimeframes,
  isTimeframeActive,
  generateTimeframeId,
} from '../timeframes';

/**
 * Helper to create a timeframe with minimal boilerplate.
 */
function createTimeframe(start: number, end: number, id?: string): Timeframe {
  return {
    id: id || `tf-${start}-${end}`,
    start,
    end,
  };
}

describe('sortTimeframes', () => {
  describe('happy path', () => {
    test('sorts timeframes by start time ascending', () => {
      const timeframes = [
        createTimeframe(10, 15),
        createTimeframe(0, 5),
        createTimeframe(5, 10),
      ];

      const sorted = sortTimeframes(timeframes);

      expect(sorted[0].start).toBe(0);
      expect(sorted[1].start).toBe(5);
      expect(sorted[2].start).toBe(10);
    });

    test('handles already sorted array', () => {
      const timeframes = [
        createTimeframe(0, 5),
        createTimeframe(5, 10),
        createTimeframe(10, 15),
      ];

      const sorted = sortTimeframes(timeframes);

      expect(sorted[0].start).toBe(0);
      expect(sorted[1].start).toBe(5);
      expect(sorted[2].start).toBe(10);
    });

    test('handles reverse sorted array', () => {
      const timeframes = [
        createTimeframe(10, 15),
        createTimeframe(5, 10),
        createTimeframe(0, 5),
      ];

      const sorted = sortTimeframes(timeframes);

      expect(sorted[0].start).toBe(0);
      expect(sorted[1].start).toBe(5);
      expect(sorted[2].start).toBe(10);
    });
  });

  describe('immutability', () => {
    test('returns new array (does not mutate original)', () => {
      const timeframes = [
        createTimeframe(10, 15),
        createTimeframe(0, 5),
      ];
      const originalFirst = timeframes[0];

      const sorted = sortTimeframes(timeframes);

      // Original array unchanged
      expect(timeframes[0]).toBe(originalFirst);
      expect(timeframes[0].start).toBe(10);

      // Sorted is different array
      expect(sorted).not.toBe(timeframes);
      expect(sorted[0].start).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('handles empty array', () => {
      const result = sortTimeframes([]);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('handles single element', () => {
      const timeframes = [createTimeframe(5, 10)];

      const sorted = sortTimeframes(timeframes);

      expect(sorted.length).toBe(1);
      expect(sorted[0].start).toBe(5);
    });

    test('handles timeframes with same start time', () => {
      const timeframes = [
        createTimeframe(5, 15, 'a'),
        createTimeframe(5, 10, 'b'),
        createTimeframe(5, 20, 'c'),
      ];

      const sorted = sortTimeframes(timeframes);

      // All have same start, order may vary but all should be present
      expect(sorted.length).toBe(3);
      expect(sorted.every((tf) => tf.start === 5)).toBe(true);
    });

    test('handles negative start times', () => {
      const timeframes = [
        createTimeframe(0, 5),
        createTimeframe(-5, 0),
      ];

      const sorted = sortTimeframes(timeframes);

      expect(sorted[0].start).toBe(-5);
      expect(sorted[1].start).toBe(0);
    });

    test('handles decimal start times', () => {
      const timeframes = [
        createTimeframe(1.5, 2.5),
        createTimeframe(0.5, 1.0),
        createTimeframe(1.0, 1.5),
      ];

      const sorted = sortTimeframes(timeframes);

      expect(sorted[0].start).toBe(0.5);
      expect(sorted[1].start).toBe(1.0);
      expect(sorted[2].start).toBe(1.5);
    });
  });
});

describe('isTimeframeActive', () => {
  describe('backward compatibility', () => {
    test('returns true when no timeframes defined (filter always on)', () => {
      expect(isTimeframeActive(0, [])).toBe(true);
      expect(isTimeframeActive(100, [])).toBe(true);
      expect(isTimeframeActive(-1, [])).toBe(true);
    });
  });

  describe('single timeframe', () => {
    test('returns true when time is within timeframe', () => {
      const timeframes = [createTimeframe(5, 10)];

      expect(isTimeframeActive(7, timeframes)).toBe(true);
    });

    test('returns true at exact start time (inclusive)', () => {
      const timeframes = [createTimeframe(5, 10)];

      expect(isTimeframeActive(5, timeframes)).toBe(true);
    });

    test('returns true at exact end time (inclusive)', () => {
      const timeframes = [createTimeframe(5, 10)];

      expect(isTimeframeActive(10, timeframes)).toBe(true);
    });

    test('returns false before timeframe', () => {
      const timeframes = [createTimeframe(5, 10)];

      expect(isTimeframeActive(4, timeframes)).toBe(false);
      expect(isTimeframeActive(0, timeframes)).toBe(false);
    });

    test('returns false after timeframe', () => {
      const timeframes = [createTimeframe(5, 10)];

      expect(isTimeframeActive(11, timeframes)).toBe(false);
      expect(isTimeframeActive(100, timeframes)).toBe(false);
    });
  });

  describe('multiple timeframes', () => {
    test('returns true when time is in any timeframe', () => {
      const timeframes = [
        createTimeframe(0, 5),
        createTimeframe(10, 15),
        createTimeframe(20, 25),
      ];

      expect(isTimeframeActive(3, timeframes)).toBe(true);
      expect(isTimeframeActive(12, timeframes)).toBe(true);
      expect(isTimeframeActive(22, timeframes)).toBe(true);
    });

    test('returns false in gaps between timeframes', () => {
      const timeframes = [
        createTimeframe(0, 5),
        createTimeframe(10, 15),
      ];

      expect(isTimeframeActive(7, timeframes)).toBe(false);
    });

    test('handles overlapping timeframes', () => {
      const timeframes = [
        createTimeframe(0, 10),
        createTimeframe(5, 15),
      ];

      // Overlapping region should still be active
      expect(isTimeframeActive(7, timeframes)).toBe(true);

      // Non-overlapping regions
      expect(isTimeframeActive(2, timeframes)).toBe(true);
      expect(isTimeframeActive(12, timeframes)).toBe(true);
    });
  });

  describe('early exit optimization', () => {
    test('returns false quickly when time is before first timeframe', () => {
      // With sorted timeframes, should exit early
      const timeframes = [
        createTimeframe(10, 15),
        createTimeframe(20, 25),
        createTimeframe(30, 35),
      ];

      expect(isTimeframeActive(5, timeframes)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('handles zero-duration timeframe', () => {
      const timeframes = [createTimeframe(5, 5)];

      // At exactly the point
      expect(isTimeframeActive(5, timeframes)).toBe(true);

      // Before and after
      expect(isTimeframeActive(4.9, timeframes)).toBe(false);
      expect(isTimeframeActive(5.1, timeframes)).toBe(false);
    });

    test('handles negative times', () => {
      const timeframes = [createTimeframe(-10, -5)];

      expect(isTimeframeActive(-7, timeframes)).toBe(true);
      expect(isTimeframeActive(-15, timeframes)).toBe(false);
    });

    test('handles very small decimal differences', () => {
      const timeframes = [createTimeframe(5.0, 5.001)];

      expect(isTimeframeActive(5.0, timeframes)).toBe(true);
      expect(isTimeframeActive(5.0005, timeframes)).toBe(true);
      expect(isTimeframeActive(5.001, timeframes)).toBe(true);
      expect(isTimeframeActive(5.002, timeframes)).toBe(false);
    });

    test('handles very large time values', () => {
      const timeframes = [createTimeframe(0, 1e10)];

      expect(isTimeframeActive(1e9, timeframes)).toBe(true);
      expect(isTimeframeActive(1e11, timeframes)).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    test('handles time exactly at boundary between timeframes', () => {
      const timeframes = [
        createTimeframe(0, 5),
        createTimeframe(5, 10), // Starts exactly where previous ends
      ];

      // Time 5 should be in both (both are inclusive)
      expect(isTimeframeActive(5, timeframes)).toBe(true);
    });
  });
});

describe('generateTimeframeId', () => {
  describe('format', () => {
    test('returns string starting with "timeframe-"', () => {
      const id = generateTimeframeId();

      expect(typeof id).toBe('string');
      expect(id.startsWith('timeframe-')).toBe(true);
    });

    test('contains timestamp component', () => {
      const before = Date.now();
      const id = generateTimeframeId();
      const after = Date.now();

      // Extract timestamp from ID
      const parts = id.split('-');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    test('contains random component', () => {
      const id = generateTimeframeId();
      const parts = id.split('-');

      // Should have at least 3 parts: "timeframe", timestamp, random
      expect(parts.length).toBeGreaterThanOrEqual(3);
      // Random part should exist
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe('uniqueness', () => {
    test('generates unique IDs on consecutive calls', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateTimeframeId());
      }

      // All 100 should be unique
      expect(ids.size).toBe(100);
    });

    test('generates unique IDs with same timestamp', () => {
      // Even if called in same millisecond, random component differs
      const mockNow = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      const id1 = generateTimeframeId();
      const id2 = generateTimeframeId();

      jest.restoreAllMocks();

      // IDs should still be different due to random component
      // (May rarely collide, but probability is negligible)
      expect(id1).not.toBe(id2);
    });
  });

  describe('usage as React key', () => {
    test('produces valid React key (no special characters that break)', () => {
      const id = generateTimeframeId();

      // Should not contain characters that cause React key issues
      expect(id).not.toContain('<');
      expect(id).not.toContain('>');
      expect(id).not.toContain('&');
      expect(id).not.toContain('"');
    });
  });
});
