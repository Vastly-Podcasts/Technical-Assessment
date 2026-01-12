/**
 * videoValidation.ts
 *
 * Utilities for validating video files before upload/processing.
 *
 * ============================================================================
 * VALIDATION STRATEGY
 * ============================================================================
 *
 * We validate in two ways:
 * 1. MIME type check: file.type.startsWith('video/')
 * 2. Extension fallback: Check file extension against known video extensions
 *
 * Why both?
 * - Some browsers (especially mobile) don't set MIME types correctly
 * - Some valid video files have non-standard MIME types
 * - Extension fallback catches cases where MIME type is missing/wrong
 *
 * ============================================================================
 * FILE SIZE LIMITS
 * ============================================================================
 *
 * 500MB limit chosen as a practical balance:
 * - Large enough for most user videos (1080p, 5-10 minutes)
 * - Small enough to prevent browser crashes on low-memory devices
 * - Can be adjusted based on target device capabilities
 *
 * Note: Object URLs are limited by browser memory, not this constant.
 * This limit prevents users from selecting files that will likely fail.
 *
 * ============================================================================
 * CODEC COMPATIBILITY LIMITATIONS
 * ============================================================================
 *
 * IMPORTANT: This validation only checks file type, not codec compatibility.
 *
 * Some video codecs may not play in all browsers:
 * - H.265 (HEVC): Not supported in Safari on macOS < 11, Chrome/Firefox
 * - VP9: Not supported in Safari
 * - AV1: Limited browser support
 *
 * If a file passes validation but fails to play, it's likely a codec
 * compatibility issue. The video element's onerror event will fire,
 * but we don't currently handle this gracefully (falls back to default video).
 *
 * For production, consider:
 * - Transcoding on backend to ensure compatibility
 * - Codec detection and user warnings
 * - Graceful error handling with user-friendly messages
 */

/**
 * Maximum file size in bytes (500MB)
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Valid video file extensions (case-insensitive)
 */
const VALID_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

/**
 * Check if a file is a valid video file.
 *
 * Validates by:
 * 1. MIME type (if available): file.type.startsWith('video/')
 * 2. Extension fallback: Check file extension against known video extensions
 *
 * @param file - File object to validate
 * @returns true if file appears to be a valid video file
 *
 * @example
 * ```ts
 * if (isValidVideoFile(file)) {
 *   // Process video
 * } else {
 *   // Show error
 * }
 * ```
 */
export function isValidVideoFile(file: File): boolean {
  // Check MIME type first (most reliable when available)
  if (file.type && file.type.startsWith('video/')) {
    return true;
  }

  // Fallback: check extension (for browsers that don't set MIME type correctly)
  const fileName = file.name.toLowerCase();
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  return VALID_VIDEO_EXTENSIONS.includes(extension);
}

/**
 * Check if file size is within acceptable limits.
 *
 * @param file - File object to check
 * @returns true if file size is within MAX_FILE_SIZE limit
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}
