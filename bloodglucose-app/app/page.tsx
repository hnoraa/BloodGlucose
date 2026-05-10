'use client';

import { useState, useEffect } from 'react';
import { GlucoseRecord } from '@/types';
import { RecentRecordSection } from '@/components/RecentRecordSection';
import { RecordsTable } from '@/components/RecordsTable';
import { RecordForm } from '@/components/RecordForm';

/**
 * Home Page Component
 * 
 * Main landing page for the Blood Glucose Tracker application.
 * Orchestrates:
 * - Fetching all glucose records on mount
 * - Displaying the most recent record with chart
 * - Displaying table of all records
 * - Form to add new records
 * - Error handling and loading states
 */
export default function Home() {
  // State management
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<GlucoseRecord | null>(null);

  /**
   * Fetch all records on component mount
   * Records are sorted by date DESC (latest first) from the API
   */
  useEffect(() => {
    fetchRecords();
  }, []);

  /**
   * Fetch all glucose records from the API
   * Updates the records state and handles errors
   */
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/records');
      const data = await response.json();

      if (!data.success) {
        setError('Failed to fetch records');
        setRecords([]);
      } else {
        setRecords(data.data || []);
        setError(null);
      }
    } catch (err) {
      setError('Error fetching records');
      setRecords([]);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle creating a new glucose record
   * Called when the RecordForm is submitted with date, dosage, and glucose readings
   * 
   * The form has already converted local times to UTC before sending
   * After successful creation, refreshes the records list
   */
  const handleCreateRecord = async (data: {
    date: string;
    dosage: string;
    drawData: Array<{ time: string; reading: number }>;
  }) => {
    try {
      setIsFormLoading(true);
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create record');
      }

      // Refresh records and close form
      await fetchRecords();
      setShowForm(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating record';
      setError(message);
      throw err;
    } finally {
      setIsFormLoading(false);
    }
  };

  /**
   * Handle editing a glucose record
   * Called when user clicks Edit in the records table
   * Currently shows an alert as edit functionality is not implemented yet
   */
  const handleEditRecord = async (id: number) => {
    alert('Edit functionality is not implemented yet. Record ID: ' + id);
  }

  /**
   * Handle deleting a glucose record
   * Called when user clicks Delete in the records table
   * Refreshes the records list after deletion
   */
  const handleDeleteRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      // Refresh records
      await fetchRecords();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting record';
      setError(message);
      throw err;
    }
  };

  // The latest record is the first one (sorted by date DESC from API)
  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with title */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Blood Glucose Tracker</h1>
          <p className="text-gray-600 mt-1">Track your dog's glucose curve data</p>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert - displays any API or form errors */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 font-bold text-lg cursor-pointer"
            >
              ×
            </button>
            <p>{error}</p>
          </div>
        )}

        {/* Recent Record Section - shows latest record with chart */}
        <section className="mb-8">
          <RecentRecordSection record={latestRecord} isLoading={isLoading} />
        </section>

        {/* Records Table Section - all records with add form */}
        <section className="mb-8">
          {/* Header with title and Add New Record button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">All Records</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancel' : '+ Add New Record'}
            </button>
          </div>

          {/* Record Form - shown when user clicks "Add New Record" */}
          {showForm && (
            <div className="mb-6">
              <RecordForm onSubmit={handleCreateRecord} editingRecord={null} isLoading={isFormLoading} />
            </div>
          )}

          {/* Table of all records with delete action */}
          <RecordsTable
            records={records}
            onDelete={handleDeleteRecord}
            onEdit={handleEditRecord}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}
