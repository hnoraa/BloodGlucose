'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DrawDataPoint } from '@/types';

interface GlucoseChartProps {
  data: DrawDataPoint[];
  title?: string;
}

/**
 * Convert UTC time string to local time in HH:MM AM/PM format
 * 
 * Handles browser timezone conversion automatically.
 * Example: "2026-05-09T08:00:00Z" -> "8:00 AM"
 * 
 * @param utcTimeString - ISO 8601 UTC datetime string
 * @returns Local time formatted as "H:MM AM/PM"
 */
function formatTimeAMPM(utcTimeString: string): string {
  try {
    const date = new Date(utcTimeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return 'Invalid';
  }
}

/**
 * Transform drawData array into Recharts chart format
 * 
 * Converts UTC times to local AM/PM times for display on the chart.
 * Keeps original UTC time for sorting/reference.
 * 
 * @param data - Array of DrawDataPoint objects with UTC times
 * @returns Array formatted for Recharts LineChart component
 */
function transformChartData(data: DrawDataPoint[]) {
  return data.map((point) => ({
    time: formatTimeAMPM(point.time),
    reading: point.reading,
    originalTime: point.time, // Keep original for sorting if needed
  }));
}

/**
 * GlucoseChart Component
 * 
 * Renders an interactive Recharts line chart showing glucose readings over time.
 * 
 * Features:
 * - X-axis: Time in 12-hour AM/PM format (local timezone)
 * - Y-axis: Glucose value in mg/dL
 * - Displays min, max, and average glucose values
 * - Responsive design adapts to container size
 * - Interactive tooltip on hover
 * 
 * @param data - Array of glucose readings (UTC times, numeric values)
 * @param title - Chart title (defaults to "Glucose Readings")
 */
export function GlucoseChart({ data, title = 'Glucose Readings' }: GlucoseChartProps) {
  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No glucose data available</p>
      </div>
    );
  }

  // Transform data for chart display with local times
  const chartData = transformChartData(data);

  // Calculate statistics from the readings
  const readings = data.map((d) => d.reading);
  const minReading = Math.min(...readings);
  const maxReading = Math.max(...readings);
  const avgReading = (readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(1);

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      {/* Chart title and statistics */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="mt-2 flex gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">Min:</span> {minReading}
          </div>
          <div>
            <span className="font-medium">Max:</span> {maxReading}
          </div>
          <div>
            <span className="font-medium">Avg:</span> {avgReading}
          </div>
        </div>
      </div>

      {/* Recharts LineChart - responsive to container size */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* X-axis displays local times in AM/PM format */}
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          {/* Y-axis displays glucose values in mg/dL */}
          <YAxis label={{ value: '(mg/dL)', angle: -90, position: 'insideLeft' }} />
          {/* Tooltip shows value on hover */}
          <Tooltip
            formatter={(value) => `${value} mg/dL`}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          {/* Line plot - glucose reading over time */}
          <Line
            type="monotone"
            dataKey="reading"
            stroke="#3b82f6"
            name="Glucose Reading"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
