/**
 * TimeframeEditor.tsx
 *
 * UI component for managing timeframes (time ranges when filters apply).
 *
 * Allows users to:
 * - Add new timeframes
 * - Edit existing timeframes
 * - Remove timeframes
 * - Validate timeframes (start < end, within video duration)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Timeframe, generateTimeframeId } from '../utils/timeframes';

interface TimeframeEditorProps {
  /** Current timeframes */
  timeframes: Timeframe[];
  /** Callback when timeframes change */
  onTimeframesChange: (timeframes: Timeframe[]) => void;
  /** Video duration in seconds (for validation) */
  videoDuration: number;
}

/**
 * Format seconds to MM:SS display format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse MM:SS or seconds string to number
 */
function parseTime(input: string): number | null {
  // Try MM:SS format first
  const mmssMatch = input.match(/^(\d+):(\d+)$/);
  if (mmssMatch) {
    const mins = parseInt(mmssMatch[1], 10);
    const secs = parseInt(mmssMatch[2], 10);
    if (isNaN(mins) || isNaN(secs) || secs >= 60) return null;
    return mins * 60 + secs;
  }
  
  // Try plain number (seconds)
  const num = parseFloat(input);
  if (isNaN(num) || num < 0) return null;
  return num;
}

export const TimeframeEditor: React.FC<TimeframeEditorProps> = ({
  timeframes,
  onTimeframesChange,
  videoDuration,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStart, setNewStart] = useState<number>(0);
  const [newEnd, setNewEnd] = useState<number>(Math.max(10, videoDuration > 0 ? Math.min(10, videoDuration) : 10));
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [editingStart, setEditingStart] = useState<number>(0);
  const [editingEnd, setEditingEnd] = useState<number>(0);

  // Update newEnd when videoDuration changes
  useEffect(() => {
    if (videoDuration > 0) {
      setNewEnd((prev) => Math.min(prev, videoDuration));
      setNewStart((prev) => (prev >= videoDuration ? 0 : prev));
    }
  }, [videoDuration]);

  // Validation helper
  const validateTimeframe = useCallback(
    (start: number, end: number): string | null => {
      if (start < 0) {
        return 'Start time cannot be negative';
      }
      if (end <= start) {
        return 'End time must be greater than start time';
      }
      if (videoDuration > 0 && start > videoDuration) {
        return `Start time (${formatTime(start)}) exceeds video duration (${formatTime(videoDuration)})`;
      }
      if (videoDuration > 0 && end > videoDuration) {
        return `End time (${formatTime(end)}) exceeds video duration (${formatTime(videoDuration)})`;
      }
      return null;
    },
    [videoDuration]
  );

  // Add new timeframe
  const handleAdd = useCallback(() => {
    if (newEnd <= newStart) {
      setError('End time must be greater than start time');
      return;
    }

    const validationError = validateTimeframe(newStart, newEnd);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newTimeframe: Timeframe = {
      id: generateTimeframeId(),
      start: newStart,
      end: newEnd,
    };

    setAddingId(newTimeframe.id);
    onTimeframesChange([...timeframes, newTimeframe]);
    setNewStart(0);
    setNewEnd(Math.max(10, videoDuration > 0 ? Math.min(10, videoDuration) : 10));
    setError(null);
    
    // Clear adding animation after transition
    setTimeout(() => setAddingId(null), 300);
  }, [newStart, newEnd, timeframes, validateTimeframe, onTimeframesChange, videoDuration]);

  // Remove timeframe with animation
  const handleRemove = useCallback(
    (id: string) => {
      setRemovingId(id);
      // Wait for exit animation before removing
      setTimeout(() => {
        onTimeframesChange(timeframes.filter((tf) => tf.id !== id));
        setRemovingId(null);
      }, 250);
    },
    [timeframes, onTimeframesChange]
  );

  // Update existing timeframe
  const handleUpdate = useCallback(
    (id: string, start: number, end: number) => {
      const validationError = validateTimeframe(start, end);
      if (validationError) {
        setError(validationError);
        return;
      }

      onTimeframesChange(
        timeframes.map((tf) =>
          tf.id === id ? { ...tf, start, end } : tf
        )
      );
      setEditingId(null);
      setError(null);
    },
    [timeframes, validateTimeframe, onTimeframesChange]
  );

  // Start editing a timeframe
  const handleEdit = useCallback((id: string) => {
    const timeframe = timeframes.find((tf) => tf.id === id);
    if (timeframe) {
      setEditingStart(timeframe.start);
      setEditingEnd(timeframe.end);
      setEditingId(id);
    }
  }, [timeframes]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  // Calculate slider percentage
  const getSliderPercentage = (value: number): number => {
    if (videoDuration <= 0) return 0;
    return Math.min(100, Math.max(0, (value / videoDuration) * 100));
  };

  // Get max duration for sliders
  const maxDuration = videoDuration > 0 ? videoDuration : 600; // Default to 10 minutes if no duration

  return (
    <div className="timeframe-editor">
      <div className="timeframe-editor__header">
        <h3 className="timeframe-editor__title">Filter Timeframes</h3>
        <p className="timeframe-editor__description">
          Define time ranges when the filter should be active. Leave empty to apply filter to entire video.
        </p>
      </div>

      {/* Add new timeframe */}
      {videoDuration > 0 && (
        <div className="timeframe-editor__form">
          <div className="timeframe-editor__slider-container">
            <div className="timeframe-editor__slider-header">
              <span className="timeframe-editor__slider-label">Start: {formatTime(newStart)}</span>
              <span className="timeframe-editor__slider-label">End: {formatTime(newEnd)}</span>
              <span className="timeframe-editor__slider-label">Duration: {formatTime(newEnd - newStart)}</span>
            </div>
            
            {/* Visual timeline */}
            <div className="timeframe-editor__timeline">
              <div 
                className="timeframe-editor__timeline-range"
                style={{
                  left: `${getSliderPercentage(newStart)}%`,
                  width: `${getSliderPercentage(newEnd) - getSliderPercentage(newStart)}%`,
                }}
              />
            </div>

            {/* Sliders */}
            <div className="timeframe-editor__sliders">
              <div className="timeframe-editor__slider-wrapper">
                <input
                  type="range"
                  className="timeframe-editor__slider"
                  min="0"
                  max={maxDuration}
                  step="0.1"
                  value={newStart}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setNewStart(value);
                    if (value >= newEnd) {
                      setNewEnd(Math.min(value + 1, maxDuration));
                    }
                    setError(null);
                  }}
                  aria-label="Start time"
                />
              </div>
              <div className="timeframe-editor__slider-wrapper">
                <input
                  type="range"
                  className="timeframe-editor__slider"
                  min="0"
                  max={maxDuration}
                  step="0.1"
                  value={newEnd}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setNewEnd(value);
                    if (value <= newStart) {
                      setNewStart(Math.max(0, value - 1));
                    }
                    setError(null);
                  }}
                  aria-label="End time"
                />
              </div>
            </div>
          </div>

          <button
            className="timeframe-editor__add-btn"
            onClick={handleAdd}
            aria-label="Add timeframe"
            disabled={newEnd <= newStart}
          >
            <span>Add Timeframe</span>
          </button>

          {/* Error message */}
          {error && (
            <div className={`timeframe-editor__error ${error ? 'timeframe-editor__error--show' : ''}`}>
              {error}
            </div>
          )}
        </div>
      )}

      {videoDuration <= 0 && (
        <div className="timeframe-editor__no-video">
          <p>Upload a video to define timeframes</p>
        </div>
      )}

      {/* Timeframes list */}
      {timeframes.length === 0 ? (
        <div className="timeframe-editor__empty">
          <div className="timeframe-editor__empty-icon">⏱</div>
          <p className="timeframe-editor__empty-text">No timeframes defined.</p>
          <p className="timeframe-editor__empty-hint">Filter applies to entire video.</p>
        </div>
      ) : (
        <ul className="timeframe-editor__list">
          {timeframes.map((tf) => (
            <li
              key={tf.id}
              className={`timeframe-editor__item ${
                removingId === tf.id ? 'timeframe-editor__item--removing' : ''
              } ${addingId === tf.id ? 'timeframe-editor__item--adding' : ''} ${
                editingId === tf.id ? 'timeframe-editor__item--editing' : ''
              }`}
            >
              {editingId === tf.id ? (
                <div className="timeframe-editor__edit-form">
                  <div className="timeframe-editor__slider-container timeframe-editor__slider-container--inline">
                    <div className="timeframe-editor__slider-header">
                      <span className="timeframe-editor__slider-label">Start: {formatTime(editingStart)}</span>
                      <span className="timeframe-editor__slider-label">End: {formatTime(editingEnd)}</span>
                    </div>
                    
                    {/* Visual timeline */}
                    <div className="timeframe-editor__timeline">
                      <div 
                        className="timeframe-editor__timeline-range"
                        style={{
                          left: `${getSliderPercentage(editingStart)}%`,
                          width: `${getSliderPercentage(editingEnd) - getSliderPercentage(editingStart)}%`,
                        }}
                      />
                    </div>

                    {/* Sliders */}
                    <div className="timeframe-editor__sliders">
                      <div className="timeframe-editor__slider-wrapper">
                        <input
                          type="range"
                          className="timeframe-editor__slider"
                          min="0"
                          max={maxDuration}
                          step="0.1"
                          value={editingStart}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingStart(value);
                            if (value >= editingEnd) {
                              setEditingEnd(Math.min(value + 1, maxDuration));
                            }
                          }}
                          aria-label="Edit start time"
                        />
                      </div>
                      <div className="timeframe-editor__slider-wrapper">
                        <input
                          type="range"
                          className="timeframe-editor__slider"
                          min="0"
                          max={maxDuration}
                          step="0.1"
                          value={editingEnd}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setEditingEnd(value);
                            if (value <= editingStart) {
                              setEditingStart(Math.max(0, value - 1));
                            }
                          }}
                          aria-label="Edit end time"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="timeframe-editor__edit-actions">
                    <button
                      className="timeframe-editor__btn timeframe-editor__btn--save"
                      onClick={() => handleUpdate(tf.id, editingStart, editingEnd)}
                      aria-label="Save changes"
                    >
                      Save
                    </button>
                    <button
                      className="timeframe-editor__btn timeframe-editor__btn--cancel"
                      onClick={handleCancelEdit}
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="timeframe-editor__item-content">
                    <span className="timeframe-editor__time-range">
                      <span className="timeframe-editor__time">{formatTime(tf.start)}</span>
                      <span className="timeframe-editor__time-separator">→</span>
                      <span className="timeframe-editor__time">{formatTime(tf.end)}</span>
                    </span>
                    <span className="timeframe-editor__duration">
                      ({formatTime(tf.end - tf.start)})
                    </span>
                  </div>
                  <div className="timeframe-editor__item-actions">
                    <button
                      className="timeframe-editor__btn timeframe-editor__btn--edit"
                      onClick={() => handleEdit(tf.id)}
                      aria-label="Edit timeframe"
                    >
                      Edit
                    </button>
                    <button
                      className="timeframe-editor__btn timeframe-editor__btn--remove"
                      onClick={() => handleRemove(tf.id)}
                      aria-label="Remove timeframe"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
