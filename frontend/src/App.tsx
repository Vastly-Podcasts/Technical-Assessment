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

  // Mask threshold - controls person/background boundary  
  // Higher threshold = more strict (fewer pixels as person, more as background)
  // Lower threshold = more liberal (more pixels as person)
  // User can adjust via slider
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
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>Video Background Filter</h1>
        <p className="subtitle">
          Real-time person segmentation with selective background effects
        </p>
      </header>

      {/* Main content */}
      <main>
        {/* Video display */}
        <div className="video-section">
          <div className="video-container">
            <ProcessedVideo
              src={videoUrl}
              filterType={filterType}
              maskThreshold={maskThreshold}
              onProcessingChange={handleProcessingChange}
            />
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="processing-indicator">
              <span className="pulse-dot" />
              Processing in real-time
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls-section">
          <FilterSelector value={filterType} onChange={handleFilterChange} />
          
          {/* Threshold slider for tuning */}
          <div className="threshold-control" style={{ 
            padding: '12px 20px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label htmlFor="threshold-slider" style={{ fontWeight: 500, color: '#333' }}>
              Mask Threshold:
            </label>
            <input 
              id="threshold-slider"
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={maskThreshold}
              onChange={(e) => setMaskThreshold(parseFloat(e.target.value))}
              style={{ width: '150px' }}
            />
            <span style={{ minWidth: '40px', color: '#666' }}>{maskThreshold.toFixed(2)}</span>
          </div>
        </div>

        {/* Info panel */}
        <div className="info-panel">
          <h3>How it works</h3>
          <ol>
            <li>MediaPipe AI identifies the person in each video frame</li>
            <li>A segmentation mask separates person from background</li>
            <li>The selected filter is applied to background pixels only</li>
            <li>The composited result displays in real-time</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default App;
