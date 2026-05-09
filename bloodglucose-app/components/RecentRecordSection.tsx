'use client';

import React, { useEffect, useState } from 'react';
import { GlucoseRecord } from '@/types';
import { GlucoseChart } from './GlucoseChart';

interface RecentRecordSectionProps {
  record: GlucoseRecord | null;
  isLoading?: boolean;
}

/**
 * Convert UTC date to local date string
 */
function formatDateLocal(utcDateString: string): string {
  try {
    const date = new Date(utcDateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Recent Record Section Component
 * Displays the most recent glucose record with a chart
 */
export function RecentRecordSection({
  record,
  isLoading = false,
}: RecentRecordSectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-blue-50 rounded-lg border-2 border-blue-200">
        <p className="text-blue-600">Loading latest record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center h-64 bg-blue-50 rounded-lg border-2 border-blue-200">
        <p className="text-blue-600">No records available yet</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Most Recent Record</h2>
        <p className="text-sm text-gray-600 mt-1">{formatDateLocal(record.date)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Dosage</p>
          <p className="text-lg font-semibold text-gray-800">{record.dosage}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Total Readings</p>
          <p className="text-lg font-semibold text-gray-800">{record.drawData.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Min Value</p>
          <p className="text-lg font-semibold text-gray-800">
            {Math.min(...record.drawData.map((d) => d.reading))} mg/dL
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Max Value</p>
          <p className="text-lg font-semibold text-gray-800">
            {Math.max(...record.drawData.map((d) => d.reading))} mg/dL
          </p>
        </div>
      </div>

      <GlucoseChart data={record.drawData} title="Glucose Curve" />
    </div>
  );
}
