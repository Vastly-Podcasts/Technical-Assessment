/**
 * App.tsx
 *
 * Main application component for the Video Background Filter demo.
 *
 * ============================================================================
 * WHAT THIS APP DOES
 * ============================================================================
 *
 * Applies a visual filter to the background of a video while keeping
 * the speaker/person in full color. Uses MediaPipe for real-time
 * person segmentation.
 *
 * ============================================================================
 * COMPONENT ARCHITECTURE
 * ============================================================================
 *
 * App
 * ├── ProcessedVideo     ← Main video display with segmentation
 * │   ├── useSegmentation hook (MediaPipe)
 * │   └── Canvas compositing
 * └── FilterSelector     ← UI control for filter selection
 *
 * State lives in App, passed down to children.
 * ProcessedVideo handles all video/canvas/segmentation logic internally.
 *
 * ============================================================================
 * FOR FUTURE DEVELOPERS
 * ============================================================================
 *
 * To add new features:
 *
 * 1. NEW FILTER: Add to utils/filters.ts, it will appear in selector
 *
 * 2. VIDEO UPLOAD: Replace hardcoded videoUrl with file input
 *    - Add input[type=file] with accept="video/*"
 *    - Create object URL: URL.createObjectURL(file)
 *    - Pass to ProcessedVideo src prop
 *    - Remember to revoke URL on cleanup
 *
 * 3. TIMELINE CONTROLS: Seek to specific timestamps
 *    - ProcessedVideo exposes video ref internally
 *    - Add prop for external control, or lift video ref up
 *    - Use video.currentTime = seconds to seek
 *
 * 4. EXPORT: Save processed video
 *    - Use MediaRecorder API to capture canvas stream
 *    - canvas.captureStream(30) gives you MediaStream
 *    - Record chunks, create blob, download
 *
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ProcessedVideo, { FilterSelector } from './components/ProcessedVideo';
import { FilterType } from './utils/filters';
import { videoUrl } from './consts';
import { isValidVideoFile, isFileSizeValid, MAX_FILE_SIZE } from './utils/videoValidation';
import { Timeframe, sortTimeframes } from './utils/timeframes';
import { TimeframeEditor } from './components/TimeframeEditor';

/** Available viewing modes */
type ViewMode = 'minimal' | 'theater' | 'editor';

const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'minimal', label: 'Minimal', icon: '○' },
  { id: 'theater', label: 'Theater', icon: '▮' },
  { id: 'editor', label: 'Editor', icon: '◫' },
];

/**
 * Main application component.
 *
 * Renders the processed video with filter controls.
 */
const App: React.FC = () => {
  // Current filter selection - defaults to grayscale per assessment example
  const [filterType, setFilterType] = useState<FilterType>('grayscale');

  // Processing state for UI feedback
  const [isProcessing, setIsProcessing] = useState(false);

  // Viewing mode
  const [viewMode, setViewMode] = useState<ViewMode>('minimal');

  // Mask threshold - controls person/background boundary
  const [maskThreshold, setMaskThreshold] = useState(0.7);

  // Timeline clip position (0-100, represents percentage)
  const [clipPosition, setClipPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Timeframe state
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  
  // Sort timeframes for optimized lookup (sorted by start time)
  const sortedTimeframes = useMemo(() => {
    return sortTimeframes(timeframes);
  }, [timeframes]);

  /**
   * Handle filter change from selector.
   * Could be extended to persist preference or sync with backend.
   */
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilterType(newFilter);
  }, []);

  /**
   * Handle processing state changes.
   * Useful for showing loading spinners, disabling controls, etc.
   */
  const handleProcessingChange = useCallback((processing: boolean) => {
    setIsProcessing(processing);
  }, []);

  /**
   * Handle mouse down on timeline clip - start dragging
   */
  const handleClipMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle file selection for video upload.
   * Validates file type and size before creating object URL.
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // User cancelled file selection
    if (!file) {
      setUploadError(null);
      return;
    }

    // Validate file type
    if (!isValidVideoFile(file)) {
      setUploadError("Please select a valid video file (mp4, webm, mov, avi, mkv)");
      return;
    }

    // Validate file size
    if (!isFileSizeValid(file)) {
      setUploadError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Clear previous error and set new file
    setUploadError(null);
    setVideoFile(file);
  }, []);

  /**
   * Handle reset button - clear uploaded video and return to default
   */
  const handleResetVideo = useCallback(() => {
    setVideoFile(null);
    setUploadError(null);
  }, []);


  /**
   * Handle video duration change - validate and clamp existing timeframes
   */
  const handleDurationChange = useCallback((duration: number) => {
    setVideoDuration(duration);
    
    // Validate and clamp existing timeframes to new duration
    if (duration > 0 && timeframes.length > 0) {
      setTimeframes((prev) =>
        prev
          .map((tf) => ({
            ...tf,
            start: Math.min(tf.start, duration),
            end: Math.min(tf.end, duration),
          }))
          .filter((tf) => tf.start < tf.end) // Remove invalid timeframes
      );
    }
  }, [timeframes]);

  /**
   * Reset timeframes when video source changes
   * This ensures timeframes don't persist across different videos
   */
  useEffect(() => {
    setTimeframes([]);
  }, [objectUrl, videoUrl]);

  /**
   * Manage object URLs for uploaded video files.
   * 
   * Critical cleanup logic:
   * - Store previous URL before creating new one (prevents race conditions)
   * - Revoke previous URL AFTER new one is set (ensures ProcessedVideo has new URL)
   * - Cleanup on unmount or when videoFile becomes null
   * 
   * Why this order matters:
   * - If we revoke before setting new URL, ProcessedVideo might try to use revoked URL
   * - If we don't revoke previous URL, memory leaks accumulate
   * - Cleanup function ensures URL is revoked even if component unmounts during file change
   */
  useEffect(() => {
    if (!videoFile) {
      // Clear object URL when no file selected
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      return;
    }

    // Store previous URL before creating new one
    const previousUrl = objectUrl;

    // Create new object URL
    const newUrl = URL.createObjectURL(videoFile);
    setObjectUrl(newUrl);

    // Revoke previous URL AFTER new one is set (prevents race condition)
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    // Cleanup on unmount or when videoFile becomes null
    return () => {
      if (newUrl) {
        URL.revokeObjectURL(newUrl);
      }
    };
  }, [videoFile]); // Only depend on videoFile, not objectUrl

  /**
   * Handle mouse move - update clip position while dragging
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineTrackRef.current) return;

      const track = timelineTrackRef.current;
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Clip is 60% wide, so constrain position to 0-40% so it doesn't overflow
      const percentage = Math.max(0, Math.min(40, (x / rect.width) * 100));
      setClipPosition(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={`app-container mode-${viewMode}`}>
      {/* Mode selector - floating top right */}
      <div className="mode-selector">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-btn ${viewMode === mode.id ? 'active' : ''}`}
            onClick={() => setViewMode(mode.id)}
            title={mode.label}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Main viewport */}
      <div className="viewport">
        {/* Editor timeline bar (only visible in editor mode) */}
        {viewMode === 'editor' && (
          <div className="editor-header">
            <div className="editor-title">Preview</div>
            <div className="editor-controls">
              <span className="editor-timecode">00:00:00</span>
            </div>
          </div>
        )}

        {/* Video display */}
        <div className="video-stage">
          <div className="video-container">
            <ProcessedVideo
              src={objectUrl || videoUrl}
              filterType={filterType}
              maskThreshold={maskThreshold}
              onProcessingChange={handleProcessingChange}
              onDurationChange={handleDurationChange}
              activeTimeframes={sortedTimeframes}
            />
          </div>

          {/* Live indicator - repositioned for theater/editor */}
          {isProcessing && (
            <div className="processing-indicator">
              <span className="pulse-dot" />
              Live
            </div>
          )}
        </div>

        {/* Editor timeline (only visible in editor mode) */}
        {viewMode === 'editor' && (
          <div className="editor-timeline">
            <div className="timeline-track" ref={timelineTrackRef}>
              <div 
                className="timeline-clip" 
                style={{ left: `${clipPosition}%` }}
                onMouseDown={handleClipMouseDown}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="controls-section">
        <FilterSelector value={filterType} onChange={handleFilterChange} />

        <div className="threshold-control">
          <label htmlFor="threshold-slider">Sensitivity</label>
          <input
            id="threshold-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={maskThreshold}
            onChange={(e) => setMaskThreshold(parseFloat(e.target.value))}
          />
          <span className="threshold-value">{Math.round(maskThreshold * 100)}%</span>
        </div>

        {/* Video upload control */}
        <div className="upload-control" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label
            htmlFor="video-upload"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: videoFile ? '#4a5568' : '#4299e1',
              color: 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textAlign: 'center',
              display: 'block',
            }}
          >
            {videoFile ? videoFile.name : 'Upload Video'}
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {videoFile && (
            <button
              onClick={handleResetVideo}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Reset
            </button>
          )}
          {uploadError && (
            <div
              style={{
                color: '#e53e3e',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#fed7d7',
                borderRadius: '0.25rem',
              }}
            >
              {uploadError}
            </div>
          )}
        </div>

        {/* Timeframe Editor */}
        <TimeframeEditor
          timeframes={timeframes}
          onTimeframesChange={setTimeframes}
          videoDuration={videoDuration}
        />
      </div>
    </div>
  );
};

export default App;
