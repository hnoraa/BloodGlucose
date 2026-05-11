/**
 * DrawDataPoint represents a single glucose reading with timestamp
 * 
 * Example:
 * {
 *   time: "2026-05-09T08:00:00Z",  // ISO 8601 UTC format
 *   reading: 145.5                  // mg/dL
 * }
 */
export interface DrawDataPoint {
  time: string; // ISO 8601 UTC format (e.g., "2026-05-09T08:00:00Z")
  reading: number; // Glucose reading value as float (mg/dL)
  site?: string; // Optional field for injection site (e.g., "abdomen", "arm")
}

/**
 * GlucoseRecord represents a complete glucose record for a single day
 * Contains multiple readings (drawData array) per record, plus first/second dose times
 * 
 * Important: `date` is a unique constraint per UTC day
 * All times are stored as UTC ISO 8601 format
 */
export interface GlucoseRecord {
  id: number;
  date: string; // ISO 8601 UTC format (e.g., "2026-05-09T00:00:00Z") - UNIQUE per day
  dosage: string; // e.g., "7 units" - flexible text field for different formats
  first_dose_time?: string; // ISO 8601 UTC format - optional time of first dose
  second_dose_time?: string; // ISO 8601 UTC format - optional time of second dose
  drawData: DrawDataPoint[]; // Array of glucose readings for this record
  created_at?: string; // Timestamp when record was created
  updated_at?: string; // Timestamp when record was last updated
}

/**
 * CreateRecordRequest is the shape of the POST /api/records request body
 * Frontend converts local time inputs to UTC before sending
 */
export interface CreateRecordRequest {
  date: string; // ISO 8601 UTC datetime for the record date
  dosage: string; // Insulin dosage given
  first_dose_time?: string; // ISO 8601 UTC format - optional
  second_dose_time?: string; // ISO 8601 UTC format - optional
  drawData: DrawDataPoint[]; // Array of glucose readings
}

/**
 * APIResponse is a generic wrapper for all API responses
 * All endpoints follow this format for consistency
 * 
 * Success response example:
 * {
 *   "success": true,
 *   "data": { ...record }
 * }
 * 
 * Error response example:
 * {
 *   "success": false,
 *   "error": "Record already exists for this date"
 * }
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
