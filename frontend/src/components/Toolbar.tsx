/**
 * Toolbar.tsx
 *
 * Elegant, accessible toolbar for video filter controls.
 *
 * Performance optimizations:
 * - React.memo on all sub-components to prevent unnecessary re-renders
 * - useMemo for computed values (filterOptions, blendOptions)
 * - useCallback for event handlers
 */

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { FilterType, FILTER_INFO } from '../utils/filters';
import { BlendCurveType, BLEND_CURVE_INFO } from '../utils/compositingCurves';
import { Timeframe, generateTimeframeId } from '../utils/timeframes';

// ============================================================================
// HUMAN-READABLE DESCRIPTIONS (static, outside component)
// ============================================================================

const FILTER_DESCRIPTIONS: Record<FilterType, string> = {
  none: 'No effect applied to background',
  grayscale: 'Classic black & white background',
  sepia: 'Warm vintage photo effect',
  blur: 'Soft focus background blur',
  invert: 'Photo negative - flip all colors',
  pixelate: '8-bit retro gaming aesthetic',
  posterize: 'Pop art poster effect',
  cyberpunk: 'Neon magenta, blade runner vibes',
  vaporwave: 'A E S T H E T I C pink & cyan',
  nightvision: 'Military green phosphor glow',
  thermal: 'Heat signature infrared look',
  glitch: 'RGB channel chaos & artifacts',
  duotone: 'Two-tone purple to orange gradient',
  saturate: 'Boosted vivid colors',
  desaturate: 'Subdued muted tones',
  warm: 'Golden hour sunset glow',
  cool: 'Arctic blue icy tint',
  vintage: 'Faded 70s film photograph',
  noir: 'High contrast black & white drama',
  emboss: '3D raised surface texture',
};

const BLEND_CURVE_DESCRIPTIONS: Record<BlendCurveType, string> = {
  linear: 'Sharp, direct edges',
  smoothstep: 'Balanced, natural transitions',
  smootherstep: 'Extra smooth, professional look',
  cosine: 'Gentle wave-like falloff',
  sigmoid: 'Crisp separation, soft edges',
  power2: 'Gradual reveal of background',
  power3: 'Very gradual background blend',
  inversePower2: 'More of you stays in color',
  inversePower3: 'Maximum you, minimum effect',
};

// Pre-compute options once (static data)
const FILTER_OPTIONS = FILTER_INFO.map((f) => ({
  ...f,
  description: FILTER_DESCRIPTIONS[f.id] || f.description,
}));

const BLEND_OPTIONS = BLEND_CURVE_INFO.map((c) => ({
  ...c,
  description: BLEND_CURVE_DESCRIPTIONS[c.id] || c.description,
}));

// ============================================================================
// TOOLTIP COMPONENT (memoized)
// ============================================================================

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip = memo<TooltipProps>(({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 500);
  }, []);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="tooltip-trigger"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className="tooltip tooltip--bottom" role="tooltip">
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

// ============================================================================
// STYLED SELECT COMPONENT (memoized)
// ============================================================================

interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ id: string; name: string }>;
  id: string;
}

const StyledSelect = memo<StyledSelectProps>(({ value, onChange, options, id }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div className="toolbar-select-wrapper">
      <select id={id} value={value} onChange={handleChange} className="toolbar-select">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <span className="toolbar-select-arrow">
        <svg width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </span>
    </div>
  );
});

StyledSelect.displayName = 'StyledSelect';

// ============================================================================
// STYLED SLIDER COMPONENT (memoized)
// ============================================================================

interface StyledSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  id: string;
  formatValue: (value: number) => string;
}

const StyledSlider = memo<StyledSliderProps>(({ value, onChange, min, max, step, id, formatValue }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value)),
    [onChange]
  );

  const displayValue = useMemo(() => formatValue(value), [formatValue, value]);

  return (
    <div className="toolbar-slider-container">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="toolbar-slider"
        style={{
          background: `linear-gradient(to right, var(--slider-fill) 0%, var(--slider-fill) ${percentage}%, var(--slider-track) ${percentage}%, var(--slider-track) 100%)`,
        }}
      />
      <span className="toolbar-slider-value">{displayValue}</span>
    </div>
  );
});

StyledSlider.displayName = 'StyledSlider';

// ============================================================================
// UPLOAD BUTTON COMPONENT (memoized)
// ============================================================================

interface UploadButtonProps {
  fileName: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  error: string | null;
}

const UploadButton = memo<UploadButtonProps>(({ fileName, onFileSelect, onReset, error }) => {
  const displayName = useMemo(
    () => (fileName && fileName.length > 20 ? fileName.slice(0, 17) + '...' : fileName),
    [fileName]
  );

  return (
    <div className="toolbar-upload">
      <label htmlFor="toolbar-video-upload" className="toolbar-upload-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>{fileName ? 'Change' : 'Upload'}</span>
      </label>
      <input
        id="toolbar-video-upload"
        type="file"
        accept="video/*"
        onChange={onFileSelect}
        className="toolbar-upload-input"
      />
      {fileName && (
        <div className="toolbar-file-info">
          <span className="toolbar-file-name" title={fileName}>{displayName}</span>
          <button onClick={onReset} className="toolbar-reset-btn" aria-label="Remove video" type="button">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z" />
            </svg>
          </button>
        </div>
      )}
      {error && <div className="toolbar-error">{error}</div>}
    </div>
  );
});

UploadButton.displayName = 'UploadButton';

// ============================================================================
// TIMEFRAME MINI EDITOR (memoized)
// ============================================================================

interface TimeframeMiniEditorProps {
  timeframes: Timeframe[];
  onTimeframesChange: (timeframes: Timeframe[]) => void;
  videoDuration: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const TimeframeMiniEditor = memo<TimeframeMiniEditorProps>(({ timeframes, onTimeframesChange, videoDuration }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newStart, setNewStart] = useState(0);
  const [newEnd, setNewEnd] = useState(10);

  const maxDuration = videoDuration > 0 ? videoDuration : 60;

  useEffect(() => {
    if (videoDuration > 0) {
      setNewEnd((prev) => Math.min(prev, videoDuration));
    }
  }, [videoDuration]);

  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), []);

  const handleAdd = useCallback(() => {
    if (newEnd <= newStart || videoDuration <= 0) return;
    const newTimeframe: Timeframe = {
      id: generateTimeframeId(),
      start: Math.min(newStart, videoDuration),
      end: Math.min(newEnd, videoDuration),
    };
    onTimeframesChange([...timeframes, newTimeframe]);
    setNewStart(0);
    setNewEnd(Math.min(10, videoDuration));
  }, [newStart, newEnd, videoDuration, timeframes, onTimeframesChange]);

  const handleRemove = useCallback(
    (id: string) => onTimeframesChange(timeframes.filter((tf) => tf.id !== id)),
    [timeframes, onTimeframesChange]
  );

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setNewStart(val);
      if (val >= newEnd) setNewEnd(Math.min(val + 1, maxDuration));
    },
    [newEnd, maxDuration]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setNewEnd(val);
      if (val <= newStart) setNewStart(Math.max(0, val - 1));
    },
    [newStart]
  );

  return (
    <div className="toolbar-timeframes">
      <button className="toolbar-timeframes-toggle" onClick={toggleExpanded} type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Timeframes</span>
        <span className="toolbar-timeframes-count">{timeframes.length > 0 ? timeframes.length : 'All'}</span>
        <svg className={`toolbar-timeframes-chevron ${isExpanded ? 'expanded' : ''}`} width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="toolbar-timeframes-panel">
          {videoDuration > 0 ? (
            <>
              <div className="toolbar-timeframes-add">
                <div className="toolbar-timeframes-range">
                  <div className="toolbar-timeframes-input-group">
                    <label>Start</label>
                    <input type="range" min={0} max={maxDuration} step={0.5} value={newStart} onChange={handleStartChange} />
                    <span>{formatTime(newStart)}</span>
                  </div>
                  <div className="toolbar-timeframes-input-group">
                    <label>End</label>
                    <input type="range" min={0} max={maxDuration} step={0.5} value={newEnd} onChange={handleEndChange} />
                    <span>{formatTime(newEnd)}</span>
                  </div>
                </div>
                <button className="toolbar-timeframes-add-btn" onClick={handleAdd} disabled={newEnd <= newStart} type="button">
                  + Add
                </button>
              </div>
              {timeframes.length > 0 ? (
                <ul className="toolbar-timeframes-list">
                  {timeframes.map((tf) => (
                    <li key={tf.id} className="toolbar-timeframes-item">
                      <span className="toolbar-timeframes-times">{formatTime(tf.start)} → {formatTime(tf.end)}</span>
                      <button className="toolbar-timeframes-remove" onClick={() => handleRemove(tf.id)} aria-label="Remove" type="button">×</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="toolbar-timeframes-empty">Filter applies to entire video</p>
              )}
            </>
          ) : (
            <p className="toolbar-timeframes-empty">Upload a video first</p>
          )}
        </div>
      )}
    </div>
  );
});

TimeframeMiniEditor.displayName = 'TimeframeMiniEditor';

// ============================================================================
// CONTROL GROUP COMPONENT (memoized)
// ============================================================================

interface ControlGroupProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
}

const ControlGroup = memo<ControlGroupProps>(({ label, tooltip, children, className = '' }) => (
  <div className={`toolbar-control-group ${className}`}>
    <Tooltip content={tooltip}>
      <label className="toolbar-label">{label}</label>
    </Tooltip>
    {children}
  </div>
));

ControlGroup.displayName = 'ControlGroup';

// ============================================================================
// LIVE STATUS (memoized)
// ============================================================================

const LiveStatus = memo(() => (
  <div className="toolbar-status">
    <span className="toolbar-status-dot" />
    <span className="toolbar-status-text">Live</span>
  </div>
));

LiveStatus.displayName = 'LiveStatus';

// ============================================================================
// MAIN TOOLBAR COMPONENT
// ============================================================================

interface ToolbarProps {
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  blendCurve: BlendCurveType;
  onBlendCurveChange: (curve: BlendCurveType) => void;
  edgeSoftness: number;
  onEdgeSoftnessChange: (value: number) => void;
  fileName: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  uploadError: string | null;
  timeframes: Timeframe[];
  onTimeframesChange: (timeframes: Timeframe[]) => void;
  videoDuration: number;
  isProcessing?: boolean;
}

// Format functions (stable references)
const formatPercent = (v: number) => `${Math.round(v * 100)}%`;
const formatPx = (v: number) => `${v}px`;

export const Toolbar = memo<ToolbarProps>(({
  filterType,
  onFilterChange,
  sensitivity,
  onSensitivityChange,
  blendCurve,
  onBlendCurveChange,
  edgeSoftness,
  onEdgeSoftnessChange,
  fileName,
  onFileSelect,
  onReset,
  uploadError,
  timeframes,
  onTimeframesChange,
  videoDuration,
  isProcessing,
}) => {
  // Memoize tooltip content based on current values
  const filterTooltip = FILTER_DESCRIPTIONS[filterType];
  const blendTooltip = BLEND_CURVE_DESCRIPTIONS[blendCurve];

  return (
    <div className="toolbar" role="toolbar" aria-label="Video filter controls">
      <div className="toolbar-inner">
        <ControlGroup label="Effect" tooltip={filterTooltip}>
          <StyledSelect id="filter-select" value={filterType} onChange={onFilterChange as (v: string) => void} options={FILTER_OPTIONS} />
        </ControlGroup>

        <ControlGroup label="Sensitivity" tooltip="How much of you stays in color. Higher = tighter outline.">
          <StyledSlider id="sensitivity-slider" value={sensitivity} onChange={onSensitivityChange} min={0} max={1} step={0.05} formatValue={formatPercent} />
        </ControlGroup>

        <ControlGroup label="Edge Style" tooltip={blendTooltip}>
          <StyledSelect id="blend-curve-select" value={blendCurve} onChange={onBlendCurveChange as (v: string) => void} options={BLEND_OPTIONS} />
        </ControlGroup>

        <ControlGroup label="Softness" tooltip="Edge blur. 0 = crisp, higher = feathered.">
          <StyledSlider id="edge-softness-slider" value={edgeSoftness} onChange={onEdgeSoftnessChange} min={0} max={10} step={1} formatValue={formatPx} />
        </ControlGroup>

        <div className="toolbar-divider" />

        <ControlGroup label="Video" tooltip="Upload your own video to apply effects" className="toolbar-control-group--upload">
          <UploadButton fileName={fileName} onFileSelect={onFileSelect} onReset={onReset} error={uploadError} />
        </ControlGroup>

        <ControlGroup label="When" tooltip="Define time ranges when the filter is active" className="toolbar-control-group--timeframes">
          <TimeframeMiniEditor timeframes={timeframes} onTimeframesChange={onTimeframesChange} videoDuration={videoDuration} />
        </ControlGroup>

        {isProcessing && <LiveStatus />}
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;
