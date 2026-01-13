/**
 * Toolbar.tsx
 *
 * Elegant, accessible toolbar for video filter controls.
 *
 * Design Philosophy: "Lens Bar"
 * - Horizontal strip inspired by camera lens controls
 * - Clear visual hierarchy with grouped controls
 * - Tooltips explain every control in plain language
 * - Smooth microinteractions for premium feel
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilterType, FILTER_INFO } from '../utils/filters';
import { BlendCurveType, BLEND_CURVE_INFO } from '../utils/compositingCurves';

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, shortcut, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
      }
      setIsVisible(true);
    }, 400); // Delay before showing
  }, []);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className="tooltip-trigger"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className="tooltip"
          style={{
            left: position.x,
            top: position.y,
          }}
          role="tooltip"
        >
          <div className="tooltip-content">{content}</div>
          {shortcut && <div className="tooltip-shortcut">{shortcut}</div>}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CONTROL GROUP COMPONENT
// ============================================================================

interface ControlGroupProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

const ControlGroup: React.FC<ControlGroupProps> = ({ label, tooltip, children }) => {
  return (
    <Tooltip content={tooltip}>
      <div className="toolbar-control-group">
        <label className="toolbar-label">{label}</label>
        {children}
      </div>
    </Tooltip>
  );
};

// ============================================================================
// STYLED SELECT COMPONENT
// ============================================================================

interface StyledSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; name: string; description: string }>;
  id: string;
}

function StyledSelect<T extends string>({
  value,
  onChange,
  options,
  id,
}: StyledSelectProps<T>) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="toolbar-select"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// STYLED SLIDER COMPONENT
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

const StyledSlider: React.FC<StyledSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  id,
  formatValue,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="toolbar-slider-container">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="toolbar-slider"
        style={{
          background: `linear-gradient(to right, var(--slider-fill) 0%, var(--slider-fill) ${percentage}%, var(--slider-track) ${percentage}%, var(--slider-track) 100%)`,
        }}
      />
      <span className="toolbar-slider-value">{formatValue(value)}</span>
    </div>
  );
};

// ============================================================================
// UPLOAD BUTTON COMPONENT
// ============================================================================

interface UploadButtonProps {
  fileName: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  error: string | null;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  fileName,
  onFileSelect,
  onReset,
  error,
}) => {
  return (
    <div className="toolbar-upload">
      <label htmlFor="toolbar-video-upload" className="toolbar-upload-btn">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
          <span className="toolbar-file-name" title={fileName}>
            {fileName.length > 15 ? fileName.slice(0, 12) + '...' : fileName}
          </span>
          <button
            onClick={onReset}
            className="toolbar-reset-btn"
            aria-label="Remove video"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z" />
            </svg>
          </button>
        </div>
      )}
      {error && <div className="toolbar-error">{error}</div>}
    </div>
  );
};

// ============================================================================
// HUMAN-READABLE DESCRIPTIONS
// ============================================================================

const FILTER_DESCRIPTIONS: Record<FilterType, string> = {
  none: 'No effect applied to background',
  grayscale: 'Classic black & white background',
  sepia: 'Warm vintage photo effect',
  blur: 'Soft focus background blur',
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

// ============================================================================
// MAIN TOOLBAR COMPONENT
// ============================================================================

interface ToolbarProps {
  // Filter settings
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;

  // Sensitivity/threshold
  sensitivity: number;
  onSensitivityChange: (value: number) => void;

  // Blend curve
  blendCurve: BlendCurveType;
  onBlendCurveChange: (curve: BlendCurveType) => void;

  // Edge softness
  edgeSoftness: number;
  onEdgeSoftnessChange: (value: number) => void;

  // Upload
  fileName: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  uploadError: string | null;

  // Processing state
  isProcessing?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
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
  isProcessing,
}) => {
  // Enrich filter options with human descriptions
  const filterOptions = FILTER_INFO.map((f) => ({
    ...f,
    description: FILTER_DESCRIPTIONS[f.id] || f.description,
  }));

  // Enrich blend curve options with human descriptions
  const blendOptions = BLEND_CURVE_INFO.map((c) => ({
    ...c,
    description: BLEND_CURVE_DESCRIPTIONS[c.id] || c.description,
  }));

  return (
    <div className="toolbar" role="toolbar" aria-label="Video filter controls">
      {/* Left section: Effect controls */}
      <div className="toolbar-section toolbar-section--effects">
        <ControlGroup
          label="Effect"
          tooltip={`Background style: ${FILTER_DESCRIPTIONS[filterType]}`}
        >
          <StyledSelect
            id="filter-select"
            value={filterType}
            onChange={onFilterChange}
            options={filterOptions}
          />
        </ControlGroup>

        <ControlGroup
          label="Sensitivity"
          tooltip="How much of you stays in color. Higher = tighter outline around you."
        >
          <StyledSlider
            id="sensitivity-slider"
            value={sensitivity}
            onChange={onSensitivityChange}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </ControlGroup>
      </div>

      {/* Center section: Edge controls */}
      <div className="toolbar-section toolbar-section--edges">
        <ControlGroup
          label="Edge Style"
          tooltip={`How you blend into the background: ${BLEND_CURVE_DESCRIPTIONS[blendCurve]}`}
        >
          <StyledSelect
            id="blend-curve-select"
            value={blendCurve}
            onChange={onBlendCurveChange}
            options={blendOptions}
          />
        </ControlGroup>

        <ControlGroup
          label="Edge Softness"
          tooltip="How soft the boundary is. 0 = crisp edge, higher = feathered glow."
        >
          <StyledSlider
            id="edge-softness-slider"
            value={edgeSoftness}
            onChange={onEdgeSoftnessChange}
            min={0}
            max={10}
            step={1}
            formatValue={(v) => `${v}px`}
          />
        </ControlGroup>
      </div>

      {/* Right section: File and status */}
      <div className="toolbar-section toolbar-section--file">
        <Tooltip content="Upload your own video to apply effects">
          <UploadButton
            fileName={fileName}
            onFileSelect={onFileSelect}
            onReset={onReset}
            error={uploadError}
          />
        </Tooltip>

        {isProcessing && (
          <div className="toolbar-status">
            <span className="toolbar-status-dot" />
            <span className="toolbar-status-text">Live</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
