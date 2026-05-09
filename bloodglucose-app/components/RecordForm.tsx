'use client';

import React, { useState } from 'react';
import { DrawDataPoint } from '@/types';

interface RecordFormProps {
  onSubmit: (data: {
    date: string;
    dosage: string;
    drawData: DrawDataPoint[];
  }) => Promise<void>;
  isLoading?: boolean;
}

interface ReadingInput {
  id: string;
  time: string; // HH:MM 24-hour format (local timezone)
  reading: string; // String for form input, will convert to number
}

/**
 * Convert local date and 24-hour time to UTC ISO 8601 string
 * 
 * This is a critical function for time conversion:
 * - User inputs date and time in their browser's local timezone
 * - This function converts that local time to UTC
 * - The UTC time is then stored in the database
 * - When displayed, the UTC time is converted back to local for viewing
 * 
 * Example:
 * - User in EST selects date "2026-05-09" and time "08:00"
 * - This becomes "2026-05-09T08:00:00Z" in their local time
 * - But that's actually 2026-05-09T12:00:00Z in UTC (if EST is UTC-4)
 * - The function returns the UTC string
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param timeString - Time string in 24-hour format (HH:MM)
 * @returns ISO 8601 UTC datetime string
 */
function timeToUTC(dateString: string, timeString: string): string {
  try {
    // Parse the date and time
    const [year, month, day] = dateString.split('-');
    const [hours, minutes] = timeString.split(':');

    // Create a local date in the browser's timezone
    const localDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    // Convert to ISO 8601 UTC format
    // toISOString() automatically handles timezone conversion
    return localDate.toISOString().replace('.000Z', 'Z');
  } catch {
    throw new Error('Invalid date or time format');
  }
}

/**
 * Record Form Component
 * 
 * Provides an intelligent, user-friendly interface for adding glucose records.
 * 
 * Key features:
 * - Date picker (defaults to today)
 * - Dosage text input (flexible format: "7 units", "5 units + needle", etc.)
 * - Dynamic readings list with add/remove functionality
 * - Each reading has: time (24-hour local) and glucose value (float)
 * - JSON preview showing exact data being submitted
 * - Automatic local-to-UTC time conversion on submit
 * - Form validation and error handling
 * 
 * Time conversion happens transparently:
 * - User sees and enters local times in 24-hour format
 * - Form converts to UTC ISO 8601 before sending to API
 * - Server stores UTC times in database
 * - When displayed, times are converted back to local and shown as 12-hour AM/PM
 */
export function RecordForm({ onSubmit, isLoading = false }: RecordFormProps) {
  // Initialize with today's date in local timezone
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Form state
  const [date, setDate] = useState(today);
  const [dosage, setDosage] = useState('');
  const [firstDoseTime, setFirstDoseTime] = useState('');
  const [secondDoseTime, setSecondDoseTime] = useState('');
  const [readings, setReadings] = useState<ReadingInput[]>([
    { id: '1', time: '08:00', reading: '' },
    { id: '2', time: '12:00', reading: '' },
    { id: '3', time: '16:00', reading: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const addReading = () => {
    const newId = (Math.max(...readings.map((r) => parseInt(r.id))) + 1).toString();
    setReadings([...readings, { id: newId, time: '00:00', reading: '' }]);
  };

  const removeReading = (id: string) => {
    if (readings.length > 1) {
      setReadings(readings.filter((r) => r.id !== id));
    }
  };

  const updateReading = (id: string, field: 'time' | 'reading', value: string) => {
    setReadings(
      readings.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /**
   * Build draw data without side effects (pure function)
   * Used for JSON preview to avoid triggering infinite re-renders
   */
  const buildDrawDataSilent = (): DrawDataPoint[] | null => {
    const drawData: DrawDataPoint[] = [];

    for (const reading of readings) {
      if (!reading.time || !reading.reading) {
        return null; // Return null silently instead of calling setError
      }

      try {
        const utcTime = timeToUTC(date, reading.time);
        const readingValue = parseFloat(reading.reading);

        if (isNaN(readingValue)) {
          return null; // Return null silently
        }

        drawData.push({
          time: utcTime,
          reading: readingValue,
        });
      } catch (e) {
        return null; // Return null silently
      }
    }

    return drawData;
  };

  /**
   * Build draw data with error handling (has side effects)
   * Used for form submission to show validation errors to user
   */
  const buildDrawData = (): DrawDataPoint[] | null => {
    const drawData: DrawDataPoint[] = [];

    for (const reading of readings) {
      if (!reading.time || !reading.reading) {
        setError('All readings must have a time and value');
        return null;
      }

      try {
        const utcTime = timeToUTC(date, reading.time);
        const readingValue = parseFloat(reading.reading);

        if (isNaN(readingValue)) {
          setError(`Invalid reading value: ${reading.reading}`);
          return null;
        }

        drawData.push({
          time: utcTime,
          reading: readingValue,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid time format');
        return null;
      }
    }

    return drawData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !dosage) {
      setError('Date and dosage are required');
      return;
    }

    const drawData = buildDrawData();
    if (!drawData) {
      return;
    }

    try {
      // Convert local date to UTC for submission
      const utcDate = new Date(date).toISOString().split('T')[0] + 'T00:00:00Z';

      // Convert dose times to UTC if provided
      let utcFirstDoseTime: string | undefined;
      let utcSecondDoseTime: string | undefined;

      if (firstDoseTime) {
        try {
          utcFirstDoseTime = timeToUTC(date, firstDoseTime);
        } catch (e) {
          setError('Invalid first dose time');
          return;
        }
      }

      if (secondDoseTime) {
        try {
          utcSecondDoseTime = timeToUTC(date, secondDoseTime);
        } catch (e) {
          setError('Invalid second dose time');
          return;
        }
      }

      await onSubmit({
        date: utcDate,
        dosage,
        first_dose_time: utcFirstDoseTime,
        second_dose_time: utcSecondDoseTime,
        drawData,
      });

      // Reset form
      setDate(today);
      setDosage('');
      setFirstDoseTime('');
      setSecondDoseTime('');
      setReadings([
        { id: '1', time: '08:00', reading: '' },
        { id: '2', time: '12:00', reading: '' },
        { id: '3', time: '16:00', reading: '' },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record');
    }
  };

  // Calculate JSON preview using silent build (no side effects)
  const jsonPreview = showJsonPreview ? JSON.stringify(buildDrawDataSilent() || [], null, 2) : null;

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Record</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Input */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dosage Input */}
        <div>
          <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-2">
            Dosage (e.g., "7 units")
          </label>
          <input
            id="dosage"
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="7 units"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* First Dose Time */}
        <div>
          <label htmlFor="firstDoseTime" className="block text-sm font-medium text-gray-700 mb-2">
            First Dose Time (optional, local time)
          </label>
          <input
            id="firstDoseTime"
            type="time"
            value={firstDoseTime}
            onChange={(e) => setFirstDoseTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {firstDoseTime && (
            <p className="text-xs text-gray-500 mt-1">
              Will be stored as UTC
            </p>
          )}
        </div>

        {/* Second Dose Time */}
        <div>
          <label htmlFor="secondDoseTime" className="block text-sm font-medium text-gray-700 mb-2">
            Second Dose Time (optional, local time)
          </label>
          <input
            id="secondDoseTime"
            type="time"
            value={secondDoseTime}
            onChange={(e) => setSecondDoseTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {secondDoseTime && (
            <p className="text-xs text-gray-500 mt-1">
              Will be stored as UTC
            </p>
          )}
        </div>

        {/* Readings Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">Readings</label>
            <button
              type="button"
              onClick={addReading}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
            >
              + Add Reading
            </button>
          </div>

          <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
            {readings.length === 0 ? (
              <p className="text-sm text-gray-500">No readings added yet</p>
            ) : (
              readings.map((reading) => (
                <div
                  key={reading.id}
                  className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200"
                >
                  <input
                    type="time"
                    value={reading.time}
                    onChange={(e) => updateReading(reading.id, 'time', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Reading value"
                    value={reading.reading}
                    onChange={(e) => updateReading(reading.id, 'reading', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">mg/dL</span>
                  <button
                    type="button"
                    onClick={() => removeReading(reading.id)}
                    disabled={readings.length === 1}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* JSON Preview Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            {showJsonPreview ? 'Hide' : 'Show'} JSON Preview
          </button>

          {jsonPreview && (
            <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300">
              <pre className="text-xs overflow-auto max-h-40 text-gray-700">{jsonPreview}</pre>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
