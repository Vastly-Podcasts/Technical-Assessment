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

import React, { useState, useCallback } from 'react';
import ProcessedVideo, { FilterSelector } from './components/ProcessedVideo';
import { FilterType } from './utils/filters';
import { videoUrl } from './consts';

/** Available viewing modes */
type ViewMode = 'minimal' | 'theater' | 'window' | 'editor';

const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'minimal', label: 'Minimal', icon: '○' },
  { id: 'theater', label: 'Theater', icon: '▮' },
  { id: 'window', label: 'Window', icon: '⊞' },
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
        {/* Window frame (only visible in window mode) */}
        {viewMode === 'window' && (
          <div className="window-frame">
            <div className="window-sill" />
          </div>
        )}

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
            <div className="timeline-track">
              <div className="timeline-clip" />
            </div>
            <div className="timeline-scrubber" />
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
