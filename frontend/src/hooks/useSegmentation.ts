/**
 * useSegmentation.ts
 *
 * Core hook for real-time person segmentation using MediaPipe.
 *
 * ============================================================================
 * HOW THIS WORKS (for future developers/AI agents)
 * ============================================================================
 *
 * 1. WHAT IS SEGMENTATION?
 *    - We analyze each video frame to find which pixels are "person" vs "background"
 *    - MediaPipe's model outputs a "mask" - same dimensions as the frame
 *    - Each pixel in the mask is 0-1: how likely that pixel is a person
 *    - We use this mask to apply effects selectively (background only, person only)
 *
 * 2. THE PIPELINE
 *    Video Frame → MediaPipe → Mask → Callback with {frame, mask}
 *
 *    The consumer (ProcessedVideo component) receives both and does compositing:
 *    - Creates filtered version of frame (grayscale, sepia, etc.)
 *    - Uses mask to blend: person stays original, background gets filter
 *
 * 3. WHY THIS ARCHITECTURE?
 *    - Separation of concerns: this hook ONLY does segmentation
 *    - Filtering logic lives elsewhere (easier to add new filters)
 *    - The mask is raw data - consumer decides how to use it
 *    - This makes the hook reusable for other effects (blur, replace, etc.)
 *
 * 4. PERFORMANCE NOTES
 *    - MediaPipe runs on GPU via WebGL (fast)
 *    - We use requestAnimationFrame for smooth 60fps loop
 *    - Model selection 1 (landscape) is faster but less accurate at distance
 *    - For talking-head videos, model 0 (general) is usually better
 *
 * ============================================================================
 * EXPANSION IDEAS (for future work)
 * ============================================================================
 *
 * - Add temporal smoothing: average mask across N frames to reduce flicker
 *   Implementation: keep circular buffer of last 3-5 masks, blend them
 *
 * - Add edge feathering: blur mask slightly for softer transitions
 *   Implementation: apply small gaussian blur to mask before returning
 *
 * - Add confidence threshold control: let user tune person/background cutoff
 *   Implementation: expose threshold prop, apply in compositing step
 *
 * - Add multiple person support: current model handles this automatically,
 *   but you could separate masks per-person using instance segmentation
 *
 * ============================================================================
 * KNOWN ISSUES / GOTCHAS
 * ============================================================================
 *
 * - CORS: Video must have crossOrigin="anonymous" AND server must send
 *   appropriate headers. The provided GCS URL works, but custom uploads
 *   may fail without proper CORS setup.
 *
 * - Memory: MediaPipe model stays in memory. Always call cleanup (stopSegmentation)
 *   when unmounting or switching videos.
 *
 * - First frame delay: Model takes ~100-300ms to initialize. First few frames
 *   may not have masks. Handle gracefully in UI.
 *
 * - Mobile Safari: WebGL can be flaky. Test thoroughly if mobile support needed.
 *
 */

import { useRef, useCallback, useState } from 'react';
import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';

/** Raw segmentation result passed to consumers */
export interface SegmentationResult {
  /** The original video frame as ImageData */
  frame: ImageData;
  /** The segmentation mask - values 0-1, same dimensions as frame */
  mask: ImageData;
  /** Frame dimensions for convenience */
  width: number;
  height: number;
}

/** Configuration options for the segmentation hook */
export interface SegmentationConfig {
  /**
   * MediaPipe model selection:
   * - 0: General model (256x256) - better quality, works up to 2m from camera
   * - 1: Landscape model (144x256) - faster, works up to 5m from camera
   *
   * For typical talking-head video, use 0. For full-body or distant subjects, use 1.
   */
  modelSelection?: 0 | 1;
}

/** Callback type for receiving segmentation results */
export type SegmentationCallback = (result: SegmentationResult) => void;

/**
 * Hook for real-time person segmentation on video elements.
 *
 * @example
 * ```tsx
 * const { startSegmentation, stopSegmentation, isProcessing } = useSegmentation({
 *   modelSelection: 0
 * });
 *
 * // Start processing when video is ready
 * useEffect(() => {
 *   if (videoRef.current) {
 *     startSegmentation(videoRef.current, (result) => {
 *       // result.frame = original pixels
 *       // result.mask = segmentation mask
 *       // Do compositing here
 *     });
 *   }
 *   return () => stopSegmentation();
 * }, []);
 * ```
 */
export function useSegmentation(config: SegmentationConfig = {}) {
  const { modelSelection = 0 } = config;

  // Refs persist across renders without causing re-renders
  const segmentationRef = useRef<SelfieSegmentation | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbackRef = useRef<SegmentationCallback | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const isModelLoadedRef = useRef(false); // Ref to avoid stale closure in processFrame
  const isProcessingRef = useRef(false); // Track if we're currently processing a frame
  const lastFrameTimeRef = useRef<number>(0); // Track frame timing for skipping

  /**
   * Initialize MediaPipe model (lazy - only when needed)
   *
   * Why lazy init? Model is ~2MB download. Don't load until user actually
   * wants to process video. Also allows config changes before start.
   */
  const initializeModel = useCallback(() => {
    if (segmentationRef.current) return segmentationRef.current;

    const segmentation = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    segmentation.setOptions({
      modelSelection,
      // selfieMode: false - we're processing video, not mirrored selfie camera
    });

    segmentation.onResults((results: Results) => {
      if (!callbackRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Draw original frame to canvas to extract ImageData
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Draw mask to canvas to extract as ImageData
      // The segmentationMask is a grayscale image where:
      // - WHITE (255) = Person/foreground 
      // - BLACK (0) = Background
      // Note: We need to scale the mask to canvas size
      ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
      const mask = ctx.getImageData(0, 0, canvas.width, canvas.height);

      callbackRef.current({
        frame,
        mask,
        width: canvas.width,
        height: canvas.height,
      });
    });

    segmentationRef.current = segmentation;
    return segmentation;
  }, [modelSelection]);

  /**
   * Start processing video frames
   *
   * @param video - HTMLVideoElement to process
   * @param callback - Called for each frame with segmentation result
   */
  const startSegmentation = useCallback(async (
    video: HTMLVideoElement,
    callback: SegmentationCallback
  ) => {
    // Store callback in ref so it's accessible in onResults without stale closure
    callbackRef.current = callback;

    // Create offscreen canvas matching video dimensions
    // Why offscreen? We don't need to display this canvas, just extract pixels
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;

    const segmentation = initializeModel();

    // Wait for model to load before starting loop
    // MediaPipe loads model on first send(), so we do a dummy send
    setIsProcessing(true);

    /**
     * Main processing loop using requestAnimationFrame
     *
     * Why rAF instead of setInterval?
     * - Syncs with browser's paint cycle (smoother)
     * - Automatically pauses when tab is hidden (saves CPU)
     * - Consistent timing regardless of processing speed
     * 
     * Frame skipping: If processing takes too long, skip frames to maintain smooth playback
     */
    const processFrame = async () => {
      // Skip if video is paused or ended
      if (video.paused || video.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Skip if video dimensions aren't ready yet
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Update canvas dimensions if video size changed (rare but possible)
      if (canvasRef.current &&
          (canvasRef.current.width !== video.videoWidth ||
           canvasRef.current.height !== video.videoHeight)) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }

      // Skip if we're still processing the previous frame (prevents queue buildup)
      // This ensures we maintain smooth playback even if MediaPipe is slow
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Check if we should skip this frame (target ~30fps, skip if too soon)
      const now = performance.now();
      const timeSinceLastFrame = now - lastFrameTimeRef.current;
      const targetFrameTime = 1000 / 30; // 30fps target
      
      if (timeSinceLastFrame < targetFrameTime * 0.8) {
        // Too soon, skip this frame
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Mark as processing
      isProcessingRef.current = true;
      lastFrameTimeRef.current = now;

      // Send frame to MediaPipe for segmentation (non-blocking)
      // Results come back via onResults callback (set up in initializeModel)
      segmentation.send({ image: video }).then(() => {
        isProcessingRef.current = false;
      }).catch(() => {
        isProcessingRef.current = false;
      });

      // Mark model as loaded after first successful send
      if (!isModelLoadedRef.current) {
        isModelLoadedRef.current = true;
        setIsModelLoaded(true);
      }

      // Schedule next frame immediately (don't wait for processing)
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [initializeModel]);

  /**
   * Stop processing and cleanup resources
   *
   * IMPORTANT: Always call this when:
   * - Component unmounts
   * - Switching to different video
   * - User disables the effect
   */
  const stopSegmentation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    callbackRef.current = null;
    setIsProcessing(false);
  }, []);

  /**
   * Full cleanup including model disposal
   *
   * Use this when you're completely done (page unload)
   * Don't use for pause/resume - model reload is expensive
   */
  const dispose = useCallback(() => {
    stopSegmentation();

    if (segmentationRef.current) {
      segmentationRef.current.close();
      segmentationRef.current = null;
    }

    canvasRef.current = null;
    setIsModelLoaded(false);
  }, [stopSegmentation]);

  return {
    startSegmentation,
    stopSegmentation,
    dispose,
    isProcessing,
    isModelLoaded,
  };
}
