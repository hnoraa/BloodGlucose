'use client';

import React from 'react';
import { GlucoseRecord } from '@/types';

interface RecordsTableProps {
  records: GlucoseRecord[];
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
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
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Calculate statistics from drawData
 */
function calculateStats(record: GlucoseRecord) {
  if (!record.drawData || record.drawData.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const readings = record.drawData.map((d) => d.reading);
  const min = Math.min(...readings);
  const max = Math.max(...readings);
  const avg = (readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(1);

  return { min, max, avg };
}

/**
 * Records Table Component
 * Displays all glucose records in a table format
 */
export function RecordsTable({ records, onDelete, onEdit, isLoading = false }: RecordsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading records...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No records yet. Create your first glucose record!</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Dosage</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                Readings
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                Min (mg/dL)
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                Max (mg/dL)
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                Avg (mg/dL)
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const stats = calculateStats(record);
              return (
                <tr
                  key={record.id}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition`}
                >
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {formatDateLocal(record.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.dosage}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {record.drawData.length}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-800">
                    {stats.min}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-800">
                    {stats.max}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-800">
                    {stats.avg}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button 
                      onClick={() => onEdit(record.id)} 
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs mr-2">
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this record?')) {
                          onDelete(record.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
