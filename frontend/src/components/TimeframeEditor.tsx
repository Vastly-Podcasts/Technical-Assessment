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

import React, { useState, useCallback } from 'react';
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
  const [newStart, setNewStart] = useState<string>('');
  const [newEnd, setNewEnd] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
    const start = parseTime(newStart);
    const end = parseTime(newEnd);

    if (start === null || end === null) {
      setError('Please enter valid times (MM:SS or seconds)');
      return;
    }

    const validationError = validateTimeframe(start, end);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newTimeframe: Timeframe = {
      id: generateTimeframeId(),
      start,
      end,
    };

    onTimeframesChange([...timeframes, newTimeframe]);
    setNewStart('');
    setNewEnd('');
    setError(null);
  }, [newStart, newEnd, timeframes, validateTimeframe, onTimeframesChange]);

  // Remove timeframe
  const handleRemove = useCallback(
    (id: string) => {
      onTimeframesChange(timeframes.filter((tf) => tf.id !== id));
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
    setEditingId(id);
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  return (
    <div className="timeframe-editor" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Filter Timeframes</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Define time ranges when the filter should be active. Leave empty to apply filter to entire video.
      </p>

      {/* Add new timeframe */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          Start:
          <input
            type="text"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            placeholder="0:00 or 0"
            style={{ width: '80px', padding: '0.25rem' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          End:
          <input
            type="text"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            placeholder="10:00 or 600"
            style={{ width: '80px', padding: '0.25rem' }}
          />
        </label>
        <button
          onClick={handleAdd}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: '#dc3545', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Timeframes list */}
      {timeframes.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic' }}>No timeframes defined. Filter applies to entire video.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {timeframes.map((tf) => (
            <li
              key={tf.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                marginBottom: '0.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
              }}
            >
              {editingId === tf.id ? (
                <>
                  <input
                    type="text"
                    defaultValue={formatTime(tf.start)}
                    onBlur={(e) => {
                      const start = parseTime(e.target.value);
                      if (start !== null) {
                        handleUpdate(tf.id, start, tf.end);
                      }
                    }}
                    style={{ width: '60px', padding: '0.25rem' }}
                  />
                  <span>to</span>
                  <input
                    type="text"
                    defaultValue={formatTime(tf.end)}
                    onBlur={(e) => {
                      const end = parseTime(e.target.value);
                      if (end !== null) {
                        handleUpdate(tf.id, tf.start, end);
                      }
                    }}
                    style={{ width: '60px', padding: '0.25rem' }}
                  />
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>
                    {formatTime(tf.start)} - {formatTime(tf.end)}
                  </span>
                  <button
                    onClick={() => handleEdit(tf.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(tf.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
