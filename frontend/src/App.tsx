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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ProcessedVideo, { FilterSelector } from './components/ProcessedVideo';
import { FilterType } from './utils/filters';
import { videoUrl } from './consts';

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
              src={videoUrl}
              filterType={filterType}
              maskThreshold={maskThreshold}
              onProcessingChange={handleProcessingChange}
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
      </div>
    </div>
  );
};

export default App;
