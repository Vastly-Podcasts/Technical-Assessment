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
 * - Edge feathering: Applied automatically (3px blur radius)
 *   Softens mask edges for smoother person/background boundaries.
 *   Adjust blur radius in featherMask() if needed.
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
import { Timeframe, isTimeframeActive } from '../utils/timeframes';
import { apiGet } from '../utils/api';
import { API_ENDPOINTS, HEALTH_CHECK_INTERVAL } from '../utils/config';

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
  /** Callback when video duration is available */
  onDurationChange?: (duration: number) => void;
  /** Timeframes when filter should be active (empty = always active) */
  activeTimeframes?: Timeframe[];
  /** Callback when processing state changes */
  onProcessingChange?: (isProcessing: boolean) => void;
  /** Callback when backend status changes */
  onBackendStatusChange?: (connected: boolean) => void;
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
  onDurationChange,
  activeTimeframes = [],
  onProcessingChange,
  onBackendStatusChange,
}) => {
  // Refs for DOM elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ref for timeframes to avoid stale closure in composite callback
  const timeframesRef = useRef<Timeframe[]>([]);

  // Local state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Initialize segmentation hook
  const { startSegmentation, stopSegmentation, isProcessing, isModelLoaded } =
    useSegmentation({ modelSelection: 0 });

  // Check backend health on mount with exponential backoff
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 5;
    const baseInterval = HEALTH_CHECK_INTERVAL;

    const checkBackend = async () => {
      try {
        await apiGet(API_ENDPOINTS.HEALTH, {
          timeout: 5000, // 5 second timeout for health checks
          maxRetries: 0, // No retries for health checks (we'll retry the check itself)
        });
        
        setBackendStatus('connected');
        onBackendStatusChange?.(true);
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        setBackendStatus('disconnected');
        onBackendStatusChange?.(false);
        retryCount++;
        
        // Exponential backoff: increase interval up to 5 minutes
        if (retryCount < maxRetries) {
          const backoffInterval = Math.min(baseInterval * Math.pow(2, retryCount), 300000);
          if (intervalId) clearInterval(intervalId);
          intervalId = setTimeout(checkBackend, backoffInterval);
        }
      }
    };

    // Initial check
    checkBackend();
    
    // Set up periodic checks with base interval
    intervalId = setInterval(checkBackend, baseInterval);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [onBackendStatusChange]);

  // Notify parent of processing state changes
  useEffect(() => {
    onProcessingChange?.(isProcessing && isModelLoaded);
  }, [isProcessing, isModelLoaded, onProcessingChange]);

  // Track video play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleEnded = () => setIsVideoPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Attempt autoplay when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!isVideoReady || !video) return;

    // Try to start playback
    video.play().catch((error) => {
      // Autoplay blocked - user needs to click to start
      // Silently handle autoplay restrictions (browser policy)
      // Error is expected and doesn't need user notification
      if (process.env.NODE_ENV === 'development') {
        // Only log in development for debugging
        console.debug('Autoplay blocked, click to play:', error);
      }
    });
  }, [isVideoReady]);

  /**
   * Handle play/pause toggle
   */
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((error) => {
        // Handle play errors gracefully
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to play video:', error);
        }
        // In production, silently handle - user can try again
      });
    } else {
      video.pause();
    }
  }, []);

  // Reuse temp canvases for feathering to avoid allocations
  const tempCanvas1Ref = useRef<HTMLCanvasElement | null>(null);
  const tempCanvas2Ref = useRef<HTMLCanvasElement | null>(null);
  
  /**
   * Apply GPU-accelerated blur to mask for edge feathering.
   * 
   * Uses canvas filter API (GPU-accelerated) instead of CPU box blur for performance.
   * This is critical for real-time processing - CPU blur was causing severe lag.
   * 
   * @param maskData - Mask ImageData to blur
   * @param blurRadius - CSS blur radius (default: 2px for subtle feathering)
   * @returns New ImageData with blurred mask
   */
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

  /**
   * Composite original and filtered frames using segmentation mask.
   *
   * This is the core algorithm that makes the effect work.
   * 
   * MediaPipe Selfie Segmentation mask:
   * - WHITE (255) = Person/Foreground pixels  
   * - BLACK (0) = Background pixels
   *
   * We want:
   * - Person → original frame (keep in color)
   * - Background → filtered frame (apply grayscale/sepia/etc)
   * 
   * Edge feathering is applied to the mask for smoother boundaries.
   * 
   * Timeframe support: Filter only applies during active timeframes.
   * If not in an active timeframe, show original frame without filtering.
   */
  const composite = useCallback(
    (result: SegmentationResult, ctx: CanvasRenderingContext2D) => {
      const { frame, mask, width, height, timestamp } = result;
      const video = videoRef.current;
      
      // Check if filter should be active based on timeframes
      let shouldApplyFilter = true;
      if (timeframesRef.current.length > 0 && video) {
        // Use timestamp from result (captured when frame was sent) to avoid race condition
        const frameTime = timestamp ?? video.currentTime;
        
        // Handle video looping: use modulo arithmetic if video loops
        const videoDuration = video.duration || Infinity;
        const loopTime = videoDuration > 0 && video.loop 
          ? frameTime % videoDuration 
          : frameTime;
        
        // Check if we're in an active timeframe
        shouldApplyFilter = isTimeframeActive(loopTime, timeframesRef.current);
      }
      
      // If not in active timeframe, show original frame without filtering
      if (!shouldApplyFilter) {
        ctx.putImageData(frame, 0, 0);
        return;
      }

      // Create a copy for filtered version (don't modify original)
      const filtered = new ImageData(
        new Uint8ClampedArray(frame.data),
        width,
        height
      );

      // Apply the selected filter to the copy
      applyFilter(filtered, filterType);

      // Feather mask edges for smoother boundaries using GPU-accelerated blur
      // Small radius (2px) provides subtle edge softening without performance hit
      const featheredMask = featherMask(mask, 2);

      // Create output buffer
      const output = ctx.createImageData(width, height);
      const outData = output.data;
      const frameData = frame.data;
      const filteredData = filtered.data;
      const maskData = featheredMask.data;

      /**
       * MediaPipe Selfie Segmentation mask interpretation:
       * 
       * Mask values are 0-255 where:
       * - HIGH values (255) = Person/foreground probability
       * - LOW values (0) = Background probability
       * 
       * We use a smooth transition curve to map mask values to blend factors.
       * The threshold parameter controls where the transition occurs.
       * 
       * Smoothstep function provides a smooth S-curve transition:
       * - Below threshold*0.5: mostly background (filtered)
       * - Above threshold*1.5: mostly person (original)
       * - Between: smooth blend
       */

      // Convert threshold to 0-255 scale
      const threshold255 = maskThreshold * 255;
      // Define transition region (wider = smoother, narrower = sharper)
      const transitionLow = threshold255 * 0.5;  // Start of transition
      const transitionHigh = Math.min(255, threshold255 * 1.5);  // End of transition (clamped to 255)

      // Safety check: if transition region is too narrow or zero, use binary threshold
      // This prevents division by zero and handles edge cases at threshold extremes
      const transitionRange = transitionHigh - transitionLow;
      const useBinaryThreshold = transitionRange < 1.0; // Less than 1 pixel difference

      // Smoothstep helper: smooth S-curve interpolation
      const smoothstep = (t: number): number => {
        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));
        // Smoothstep: 3t² - 2t³
        return t * t * (3 - 2 * t);
      };

      for (let i = 0; i < frameData.length; i += 4) {
        // Get mask value (0-255)
        const maskValue = maskData[i];

        // Map mask value to blend factor using smooth transition
        // maskValue < transitionLow → blendFactor ≈ 0 (background)
        // maskValue > transitionHigh → blendFactor ≈ 1 (person)
        // Between → smooth curve
        let blendFactor: number;
        
        if (useBinaryThreshold) {
          // Binary threshold when transition region is too narrow
          // Use threshold255 as the cutoff point
          blendFactor = maskValue >= threshold255 ? 1 : 0;
        } else {
          let normalizedValue: number;
          if (maskValue <= transitionLow) {
            normalizedValue = 0;
          } else if (maskValue >= transitionHigh) {
            normalizedValue = 1;
          } else {
            // Normalize to [0, 1] within transition region
            // Safety check: transitionRange is guaranteed > 1.0 here
            normalizedValue = (maskValue - transitionLow) / transitionRange;
          }

          // Apply smoothstep for smoother curve
          blendFactor = smoothstep(normalizedValue);
        }

        // Blend: output = original * blend + filtered * (1 - blend)
        // blendFactor = 1 → original (person)
        // blendFactor = 0 → filtered (background)
        outData[i] = frameData[i] * blendFactor + filteredData[i] * (1 - blendFactor);
        outData[i + 1] = frameData[i + 1] * blendFactor + filteredData[i + 1] * (1 - blendFactor);
        outData[i + 2] = frameData[i + 2] * blendFactor + filteredData[i + 2] * (1 - blendFactor);
        outData[i + 3] = 255; // Full opacity
      }

      // Draw composited result to canvas
      ctx.putImageData(output, 0, 0);
    },
    [filterType, maskThreshold, featherMask]
  );
  
  // Update timeframes ref when prop changes (avoids stale closure)
  useEffect(() => {
    timeframesRef.current = activeTimeframes ?? [];
  }, [activeTimeframes]);

  /**
   * Reset video ready state when src changes
   * This ensures the effect on line 371 re-runs when a new video loads
   */
  useEffect(() => {
    setIsVideoReady(false);
    stopSegmentation(); // Stop processing old video immediately
  }, [src, stopSegmentation]);

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
    // Notify parent of video duration for timeframe validation
    if (video.duration && isFinite(video.duration)) {
      onDurationChange?.(video.duration);
    }
  }, [onLoadedMetadata, onDurationChange]);

  /**
   * Start processing when video is ready
   * Restart segmentation when timeframes change to ensure callback updates
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

    // Stop any existing segmentation before starting new one
    stopSegmentation();

    // Start segmentation and provide compositing callback
    startSegmentation(video, (result) => {
      composite(result, ctx);
    });

    // Cleanup on unmount or dependency change
    return () => {
      stopSegmentation();
    };
  }, [isVideoReady, videoDimensions, activeTimeframes, startSegmentation, stopSegmentation, composite]);

  // Detect if URL is object URL (blob:) vs external URL
  // Object URLs don't need crossOrigin attribute (can cause CORS errors)
  // External URLs need crossOrigin="anonymous" for MediaPipe canvas operations
  const isObjectUrl = src.startsWith('blob:');

  return (
    <div className="processed-video-container" style={{ position: 'relative' }}>
      {/* 
        Video element - positioned off-screen instead of display:none
        display:none prevents video from playing/loading in some browsers
        Using position:absolute + visibility:hidden keeps it functional
      */}
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        crossOrigin={isObjectUrl ? undefined : "anonymous"}
        autoPlay
        playsInline
        loop
        muted
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
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

      {/* Play/Pause control button - always visible when video is ready */}
      {isVideoReady && isModelLoaded && (
        <button
          className="video-control-button"
          onClick={handlePlayPause}
          aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            background: 'rgba(29, 29, 31, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 10,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(29, 29, 31, 0.95)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(29, 29, 31, 0.85)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          {isVideoPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)" style={{ marginLeft: '2px' }}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      )}

      {/* Loading state */}
      {!isVideoReady && (
        <div className="video-loading">Loading video...</div>
      )}

      {/* Model loading indicator */}
      {isVideoReady && !isModelLoaded && (
        <div className="model-loading" onClick={handlePlayPause} style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 500 }}>Loading AI model...</div>
          <div style={{ fontSize: '13px', marginTop: '8px', color: '#aeaeb2' }}>
            Click here if video doesn't start automatically
          </div>
        </div>
      )}

      {/* Backend status indicator */}
      <div
        className="backend-status"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          background: backendStatus === 'connected'
            ? 'rgba(52, 199, 89, 0.12)'
            : backendStatus === 'checking'
              ? 'rgba(255, 159, 10, 0.12)'
              : 'rgba(255, 59, 48, 0.12)',
          color: backendStatus === 'connected'
            ? '#248a3d'
            : backendStatus === 'checking'
              ? '#9a6700'
              : '#d70015',
        }}
      >
        {backendStatus === 'connected' ? 'Connected' : backendStatus === 'checking' ? 'Connecting...' : 'Disconnected'}
      </div>
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
      <label htmlFor="filter-select">Effect</label>
      <select
        id="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as FilterType)}
        className="filter-select"
      >
        {FILTER_INFO.map((filter) => (
          <option key={filter.id} value={filter.id}>
            {filter.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProcessedVideo;
