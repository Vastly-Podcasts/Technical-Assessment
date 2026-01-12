/**
 * ProcessedVideo.tsx
 *
 * Displays video with real-time background filtering.
 * The speaker stays in full color while the background receives an effect.
 *
 * ============================================================================
 * HOW THIS COMPONENT WORKS
 * ============================================================================
 *
 * 1. DUAL CANVAS ARCHITECTURE
 *    - Hidden <video> element plays the source
 *    - Visible <canvas> shows the processed result
 *    - User sees the canvas, not the raw video
 *
 * 2. THE COMPOSITING FORMULA (per pixel)
 *
 *    output = (original × mask) + (filtered × (1 - mask))
 *
 *    - mask = 1 (person): output = original (full color)
 *    - mask = 0 (background): output = filtered (grayscale/sepia/etc)
 *    - mask = 0.5 (edge): 50% blend (smooth transition)
 *
 * 3. DATA FLOW
 *
 *    Video plays → useSegmentation extracts {frame, mask} →
 *    applyFilter creates filtered version →
 *    composite() blends using mask →
 *    Result drawn to canvas
 *
 * ============================================================================
 * CUSTOMIZATION POINTS
 * ============================================================================
 *
 * - maskThreshold: Tune person/background boundary (0-1)
 *   Lower = more pixels as "person", Higher = tighter person boundary
 *
 * - filterType: Any filter from filters.ts
 *
 * - To add edge feathering:
 *   Apply gaussian blur to mask before compositing.
 *   See commented code in composite() function.
 *
 * ============================================================================
 * PERFORMANCE CONSIDERATIONS
 * ============================================================================
 *
 * - Canvas operations are CPU-bound
 * - At 1080p, we're moving ~8MB of pixel data per frame
 * - Target: 30fps minimum for smooth playback
 * - If performance is poor:
 *   1. Process at lower resolution, upscale display
 *   2. Use WebGL shaders for compositing
 *   3. Reduce filter complexity
 *
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSegmentation, SegmentationResult } from '../hooks/useSegmentation';
import { applyFilter, FilterType, FILTER_INFO } from '../utils/filters';

interface ProcessedVideoProps {
  /** Video source URL */
  src: string;
  /** Which filter to apply to background */
  filterType?: FilterType;
  /**
   * Mask threshold for person/background boundary.
   * - 0.1 = liberal (more pixels treated as person)
   * - 0.9 = strict (fewer pixels treated as person)
   * - 0.5 = balanced default
   */
  maskThreshold?: number;
  /** Callback when video metadata loads */
  onLoadedMetadata?: () => void;
  /** Callback when processing state changes */
  onProcessingChange?: (isProcessing: boolean) => void;
}

/**
 * ProcessedVideo displays a video with selective background filtering.
 *
 * The speaker/person remains in full color while the background
 * receives the specified filter effect.
 */
const ProcessedVideo: React.FC<ProcessedVideoProps> = ({
  src,
  filterType = 'grayscale',
  maskThreshold = 0.5,
  onLoadedMetadata,
  onProcessingChange,
}) => {
  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Local state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Initialize segmentation hook
  const { startSegmentation, stopSegmentation, isProcessing, isModelLoaded } =
    useSegmentation({ modelSelection: 0 });

  // Notify parent of processing state changes
  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  /**
   * Composite original and filtered frames using segmentation mask.
   *
   * This is the core algorithm that makes the effect work.
   */
  const composite = useCallback(
    (result: SegmentationResult, ctx: CanvasRenderingContext2D) => {
      const { frame, mask, width, height } = result;

      // Create a copy for filtered version (don't modify original)
      const filtered = new ImageData(
        new Uint8ClampedArray(frame.data),
        width,
        height
      );

      // Apply the selected filter to the copy
      applyFilter(filtered, filterType);

      // Create output buffer
      const output = ctx.createImageData(width, height);
      const outData = output.data;
      const frameData = frame.data;
      const filteredData = filtered.data;
      const maskData = mask.data;

      /**
       * Per-pixel compositing loop
       *
       * The mask from MediaPipe has the person probability in the R channel
       * (all RGB channels are the same for grayscale mask).
       *
       * We normalize to 0-1 and use as blend factor:
       * - maskValue near 1 = person pixel = use original
       * - maskValue near 0 = background pixel = use filtered
       */
      for (let i = 0; i < frameData.length; i += 4) {
        // Get mask value (0-255) and normalize to 0-1
        const maskValue = maskData[i] / 255;

        // Apply threshold to sharpen the boundary
        // This creates a more defined edge between person and background
        const blendFactor = maskValue > maskThreshold ? 1 : maskValue / maskThreshold;

        /*
         * OPTIONAL: Edge feathering
         *
         * For softer edges, you could apply a smoothstep function:
         *
         * const edge = 0.1; // edge width in mask units
         * const blendFactor = smoothstep(maskThreshold - edge, maskThreshold + edge, maskValue);
         *
         * function smoothstep(edge0: number, edge1: number, x: number): number {
         *   const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
         *   return t * t * (3 - 2 * t);
         * }
         */

        // Blend: output = original * blend + filtered * (1 - blend)
        outData[i] = frameData[i] * blendFactor + filteredData[i] * (1 - blendFactor);
        outData[i + 1] = frameData[i + 1] * blendFactor + filteredData[i + 1] * (1 - blendFactor);
        outData[i + 2] = frameData[i + 2] * blendFactor + filteredData[i + 2] * (1 - blendFactor);
        outData[i + 3] = 255; // Full opacity
      }

      // Draw composited result to canvas
      ctx.putImageData(output, 0, 0);
    },
    [filterType, maskThreshold]
  );

  /**
   * Handle video metadata loaded - set up dimensions
   */
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoDimensions({
      width: video.videoWidth,
      height: video.videoHeight,
    });
    setIsVideoReady(true);
    onLoadedMetadata?.();
  }, [onLoadedMetadata]);

  /**
   * Start processing when video is ready
   */
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!isVideoReady || !video || !canvas) return;

    // Set canvas dimensions to match video
    canvas.width = videoDimensions.width;
    canvas.height = videoDimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start segmentation and provide compositing callback
    startSegmentation(video, (result) => {
      composite(result, ctx);
    });

    // Cleanup on unmount or dependency change
    return () => {
      stopSegmentation();
    };
  }, [isVideoReady, videoDimensions, startSegmentation, stopSegmentation, composite]);

  return (
    <div className="processed-video-container">
      {/* Hidden video element - source of frames */}
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        crossOrigin="anonymous"
        controls
        muted
        style={{ display: 'none' }}
      />

      {/* Visible canvas - shows processed result */}
      <canvas
        ref={canvasRef}
        className="processed-video-canvas"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: isVideoReady ? 'block' : 'none',
        }}
      />

      {/* Loading state */}
      {!isVideoReady && (
        <div className="video-loading">Loading video...</div>
      )}

      {/* Model loading indicator */}
      {isVideoReady && !isModelLoaded && (
        <div className="model-loading">Loading AI model...</div>
      )}
    </div>
  );
};

/**
 * FilterSelector component for choosing background effect.
 *
 * Separated for reusability - can be used in settings panel, toolbar, etc.
 */
export const FilterSelector: React.FC<{
  value: FilterType;
  onChange: (filter: FilterType) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="filter-selector">
      <label htmlFor="filter-select">Background Filter:</label>
      <select
        id="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as FilterType)}
        className="filter-select"
      >
        {FILTER_INFO.map((filter) => (
          <option key={filter.id} value={filter.id}>
            {filter.name} - {filter.description}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProcessedVideo;
