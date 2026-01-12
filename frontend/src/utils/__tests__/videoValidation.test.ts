/**
 * videoValidation.test.ts
 *
 * Unit tests for video file validation utilities.
 *
 * Test Strategy:
 * - Test MIME type validation
 * - Test extension fallback
 * - Test file size validation
 * - Test edge cases (missing type, edge extensions)
 */

import {
  isValidVideoFile,
  isFileSizeValid,
  MAX_FILE_SIZE,
} from '../videoValidation';

/**
 * Helper to create a mock File object.
 */
function createMockFile(
  name: string,
  size: number,
  type: string = ''
): File {
  const blob = new Blob([''], { type });
  return new File([blob], name, { type }) as File;
}

/**
 * Helper to create a File with specific size.
 * Creates actual content to ensure size property is accurate.
 */
function createMockFileWithSize(
  name: string,
  size: number,
  type: string = ''
): File {
  // Create content of exact size
  const content = new Uint8Array(size);
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

describe('MAX_FILE_SIZE constant', () => {
  test('equals 500MB in bytes', () => {
    const expectedSize = 500 * 1024 * 1024; // 500 * 1MB
    expect(MAX_FILE_SIZE).toBe(expectedSize);
  });

  test('is a positive number', () => {
    expect(MAX_FILE_SIZE).toBeGreaterThan(0);
  });
});

describe('isValidVideoFile', () => {
  describe('MIME type validation', () => {
    test('accepts video/mp4', () => {
      const file = createMockFile('video.mp4', 1000, 'video/mp4');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts video/webm', () => {
      const file = createMockFile('video.webm', 1000, 'video/webm');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts video/quicktime (mov)', () => {
      const file = createMockFile('video.mov', 1000, 'video/quicktime');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts video/x-msvideo (avi)', () => {
      const file = createMockFile('video.avi', 1000, 'video/x-msvideo');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts video/x-matroska (mkv)', () => {
      const file = createMockFile('video.mkv', 1000, 'video/x-matroska');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts any video/* MIME type', () => {
      const file = createMockFile('video.ogv', 1000, 'video/ogg');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('rejects audio MIME types', () => {
      const file = createMockFile('audio.mp3', 1000, 'audio/mpeg');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('rejects image MIME types', () => {
      const file = createMockFile('image.jpg', 1000, 'image/jpeg');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('rejects application MIME types', () => {
      const file = createMockFile('document.pdf', 1000, 'application/pdf');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('rejects text MIME types', () => {
      const file = createMockFile('readme.txt', 1000, 'text/plain');
      expect(isValidVideoFile(file)).toBe(false);
    });
  });

  describe('extension fallback (when MIME type missing)', () => {
    test('accepts .mp4 extension without MIME type', () => {
      const file = createMockFile('video.mp4', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts .webm extension without MIME type', () => {
      const file = createMockFile('video.webm', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts .mov extension without MIME type', () => {
      const file = createMockFile('video.mov', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts .avi extension without MIME type', () => {
      const file = createMockFile('video.avi', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts .mkv extension without MIME type', () => {
      const file = createMockFile('video.mkv', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('rejects unknown extension without MIME type', () => {
      const file = createMockFile('video.xyz', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });
  });

  describe('case insensitivity', () => {
    test('accepts uppercase extension', () => {
      const file = createMockFile('VIDEO.MP4', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('accepts mixed case extension', () => {
      const file = createMockFile('Video.Mp4', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles file with no extension', () => {
      const file = createMockFile('video', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('handles file with only dot', () => {
      const file = createMockFile('.', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('handles hidden file with extension', () => {
      const file = createMockFile('.hidden.mp4', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('handles multiple dots in filename', () => {
      const file = createMockFile('my.video.file.mp4', 1000, '');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('handles extension-like substring not at end', () => {
      const file = createMockFile('mp4_video.txt', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('prioritizes MIME type over extension', () => {
      // File has wrong extension but correct MIME type
      const file = createMockFile('video.txt', 1000, 'video/mp4');
      expect(isValidVideoFile(file)).toBe(true);
    });

    test('uses extension when MIME type is wrong', () => {
      // File has correct extension but wrong MIME type
      const file = createMockFile('video.mp4', 1000, 'application/octet-stream');
      expect(isValidVideoFile(file)).toBe(true);
    });
  });

  describe('near-miss extensions', () => {
    test('rejects .mp3 (audio)', () => {
      const file = createMockFile('audio.mp3', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('rejects .m4a (audio)', () => {
      const file = createMockFile('audio.m4a', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });

    test('rejects .gif (image, even though animated)', () => {
      const file = createMockFile('animation.gif', 1000, '');
      expect(isValidVideoFile(file)).toBe(false);
    });
  });
});

describe('isFileSizeValid', () => {
  describe('happy path', () => {
    test('accepts file smaller than limit', () => {
      const file = createMockFileWithSize('small.mp4', 1000, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(true);
    });

    test('accepts empty file (0 bytes)', () => {
      const file = createMockFileWithSize('empty.mp4', 0, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(true);
    });

    test('accepts file at 1 byte', () => {
      const file = createMockFileWithSize('tiny.mp4', 1, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    test('accepts file exactly at size limit', () => {
      const file = createMockFileWithSize('exact.mp4', MAX_FILE_SIZE, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(true);
    });

    test('rejects file 1 byte over limit', () => {
      const file = createMockFileWithSize('over.mp4', MAX_FILE_SIZE + 1, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(false);
    });

    test('accepts file 1 byte under limit', () => {
      const file = createMockFileWithSize('under.mp4', MAX_FILE_SIZE - 1, 'video/mp4');
      expect(isFileSizeValid(file)).toBe(true);
    });
  });

  describe('large files', () => {
    test('rejects 1GB file', () => {
      // Create mock without actual content for memory efficiency
      const file = {
        name: 'huge.mp4',
        size: 1024 * 1024 * 1024, // 1GB
        type: 'video/mp4',
      } as File;

      expect(isFileSizeValid(file)).toBe(false);
    });

    test('rejects 10GB file', () => {
      const file = {
        name: 'massive.mp4',
        size: 10 * 1024 * 1024 * 1024, // 10GB
        type: 'video/mp4',
      } as File;

      expect(isFileSizeValid(file)).toBe(false);
    });
  });

  describe('practical file sizes', () => {
    test('accepts 100MB file', () => {
      const file = {
        name: 'medium.mp4',
        size: 100 * 1024 * 1024,
        type: 'video/mp4',
      } as File;

      expect(isFileSizeValid(file)).toBe(true);
    });

    test('accepts 400MB file', () => {
      const file = {
        name: 'large.mp4',
        size: 400 * 1024 * 1024,
        type: 'video/mp4',
      } as File;

      expect(isFileSizeValid(file)).toBe(true);
    });

    test('rejects 600MB file', () => {
      const file = {
        name: 'toolarge.mp4',
        size: 600 * 1024 * 1024,
        type: 'video/mp4',
      } as File;

      expect(isFileSizeValid(file)).toBe(false);
    });
  });
});

describe('combined validation scenarios', () => {
  test('valid video: correct type and size', () => {
    const file = createMockFile('video.mp4', 1000, 'video/mp4');

    expect(isValidVideoFile(file)).toBe(true);
    expect(isFileSizeValid(file)).toBe(true);
  });

  test('invalid video: wrong type but valid size', () => {
    const file = createMockFile('document.pdf', 1000, 'application/pdf');

    expect(isValidVideoFile(file)).toBe(false);
    expect(isFileSizeValid(file)).toBe(true);
  });

  test('invalid video: correct type but too large', () => {
    const file = {
      name: 'huge.mp4',
      size: MAX_FILE_SIZE + 1,
      type: 'video/mp4',
    } as File;

    expect(isValidVideoFile(file)).toBe(true);
    expect(isFileSizeValid(file)).toBe(false);
  });

  test('invalid video: wrong type and too large', () => {
    const file = {
      name: 'huge.txt',
      size: MAX_FILE_SIZE + 1,
      type: 'text/plain',
    } as File;

    expect(isValidVideoFile(file)).toBe(false);
    expect(isFileSizeValid(file)).toBe(false);
  });
});
