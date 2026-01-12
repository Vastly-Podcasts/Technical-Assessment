/**
 * timeframes.ts
 *
 * Types and utilities for timeframe-based filter control.
 *
 * Timeframes define when filters should be active during video playback.
 * A timeframe is a time range (start to end) where a filter applies.
 */

/**
 * A timeframe represents a time range where a filter should be active.
 */
export interface Timeframe {
  /** Unique identifier for React keys */
  id: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/**
 * Sort timeframes by start time (ascending).
 * This enables optimized lookup algorithms.
 *
 * @param timeframes - Array of timeframes to sort
 * @returns New sorted array (original not modified)
 */
export function sortTimeframes(timeframes: Timeframe[]): Timeframe[] {
  return [...timeframes].sort((a, b) => a.start - b.start);
}

/**
 * Check if a given time falls within any active timeframe.
 *
 * This function is optimized for the common case:
 * - Early exit if time is before first timeframe
 * - Uses linear search (O(n)) - can be optimized to binary search if needed
 *
 * @param currentTime - Current video time in seconds
 * @param timeframes - Array of timeframes (should be sorted for best performance)
 * @returns true if currentTime is within any timeframe, false otherwise
 */
export function isTimeframeActive(
  currentTime: number,
  timeframes: Timeframe[]
): boolean {
  // Backward compatibility: no timeframes = filter always on
  if (timeframes.length === 0) {
    return true;
  }

  // Early exit optimization: if time is before first timeframe, no match
  if (timeframes.length > 0 && currentTime < timeframes[0].start) {
    return false;
  }

  // Check if currentTime falls within any timeframe
  // Using some() for simplicity - can optimize to binary search if many timeframes
  return timeframes.some(
    (tf) => currentTime >= tf.start && currentTime <= tf.end
  );
}

/**
 * Generate a unique ID for a new timeframe.
 * Uses timestamp + random to ensure uniqueness.
 *
 * @returns Unique string ID
 */
export function generateTimeframeId(): string {
  return `timeframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
