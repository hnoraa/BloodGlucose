import Database from 'better-sqlite3';
import path from 'path';
import { GlucoseRecord, DrawDataPoint } from '@/types';

let db: Database.Database | null = null;

/**
 * Get or initialize the SQLite database
 */
export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'bloodglucose.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema if not exists
  initializeSchema();

  return db;
}

/**
 * Initialize database schema
 * Handles both new databases and migrations of existing ones
 */
function initializeSchema() {
  if (!db) return;

  // Create the main table
  db.exec(`
    CREATE TABLE IF NOT EXISTS glucose_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      dosage TEXT NOT NULL,
      first_dose_time TEXT,
      second_dose_time TEXT,
      drawData TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if the new columns exist and add them if needed (migration for existing databases)
  const tableInfo = db.prepare("PRAGMA table_info(glucose_records)").all();
  const columnNames = (tableInfo as any[]).map((col: any) => col.name);

  if (!columnNames.includes('first_dose_time')) {
    db.exec('ALTER TABLE glucose_records ADD COLUMN first_dose_time TEXT');
  }
  if (!columnNames.includes('second_dose_time')) {
    db.exec('ALTER TABLE glucose_records ADD COLUMN second_dose_time TEXT');
  }
}

/**
 * Get all glucose records, sorted by date descending
 */
export function getAllRecords(): GlucoseRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM glucose_records
    ORDER BY date DESC
  `);
  
  const rows = stmt.all() as any[];
  return rows.map(parseRecord);
}

/**
 * Get a specific glucose record by ID
 */
export function getRecordById(id: number): GlucoseRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM glucose_records WHERE id = ?
  `);
  
  const row = stmt.get(id) as any;
  return row ? parseRecord(row) : null;
}

/**
 * Get the most recent glucose record
 */
export function getLatestRecord(): GlucoseRecord | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM glucose_records
    ORDER BY date DESC
    LIMIT 1
  `);
  
  const row = stmt.get() as any;
  return row ? parseRecord(row) : null;
}

/**
 * Create a new glucose record
 */
export function createRecord(record: {
  date: string;
  dosage: string;
  first_dose_time?: string;
  second_dose_time?: string;
  drawData: DrawDataPoint[];
}): GlucoseRecord {
  const database = getDb();
  
  const stmt = database.prepare(`
    INSERT INTO glucose_records (date, dosage, first_dose_time, second_dose_time, drawData)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(
    record.date,
    record.dosage,
    record.first_dose_time || null,
    record.second_dose_time || null,
    JSON.stringify(record.drawData)
  );
  
  const newRecord = getRecordById(info.lastInsertRowid as number);
  if (!newRecord) {
    throw new Error('Failed to create record');
  }
  
  return newRecord;
}

/**
 * Delete a glucose record
 */
export function deleteRecord(id: number): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    DELETE FROM glucose_records WHERE id = ?
  `);
  
  const info = stmt.run(id);
  return (info.changes as number) > 0;
}

/**
 * Update a glucose record
 */
export function updateRecord(
  id: number,
  updates: Partial<Omit<GlucoseRecord, 'id' | 'created_at' | 'updated_at'>>
): GlucoseRecord | null {
  const database = getDb();
  const record = getRecordById(id);
  
  if (!record) return null;
  
  const updated: any = {
    date: updates.date ?? record.date,
    dosage: updates.dosage ?? record.dosage,
    first_dose_time: updates.first_dose_time ?? record.first_dose_time ?? null,
    second_dose_time: updates.second_dose_time ?? record.second_dose_time ?? null,
    drawData: updates.drawData ?? record.drawData,
  };
  
  const stmt = database.prepare(`
    UPDATE glucose_records
    SET date = ?, dosage = ?, first_dose_time = ?, second_dose_time = ?, drawData = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    updated.date,
    updated.dosage,
    updated.first_dose_time,
    updated.second_dose_time,
    JSON.stringify(updated.drawData),
    id
  );
  
  return getRecordById(id);
}

/**
 * Parse a database row into a GlucoseRecord object
 */
function parseRecord(row: any): GlucoseRecord {
  return {
    id: row.id,
    date: row.date,
    dosage: row.dosage,
    drawData: JSON.parse(row.drawData),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
