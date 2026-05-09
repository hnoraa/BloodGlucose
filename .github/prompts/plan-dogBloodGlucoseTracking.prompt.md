# Plan: Dog Blood Glucose Tracking App

## TL;DR

Build a full-stack **Next.js + TypeScript** app with SQLite backend and React+Recharts frontend. Single `npm start` runs everything. Database schema: glucose_records (date) + glucose_readings (time, value per record). UI: recent record with graph at top, table of all records below.

**Tech Stack**: Next.js 14+, TypeScript, React, SQLite (better-sqlite3), Recharts, TailwindCSS

---

## Steps

### Phase 1: Project Setup

1. Initialize Next.js with TypeScript & TailwindCSS
2. Install dependencies: `better-sqlite3`, `recharts`, types
3. Create folder structure (`src/app/`, `src/components/`, `src/lib/`, `db/`)

### Phase 2: Database Setup

4. Create SQLite schema:
   - Single table: `glucose_records` (id, date [UTC], dosage, drawData [JSON array])
5. Build database initialization utility (`src/lib/db.ts`) with date conversion (UTC storage ↔ browser local display)
6. Create seed data utility for testing

### Phase 3: Backend API

7. Create Next.js API routes:
   - `GET /api/records` — all records with readings (sorted by date DESC)
   - `GET /api/records/:id` — single record
   - `POST /api/records` — create record with readings
   - `DELETE /api/records/:id` — delete record & cascade
8. Add validation & error handling

### Phase 4: Frontend Components

9. Build React components:
   - `GlucoseChart.tsx` — Recharts line chart (time vs glucose value)
   - `RecordsTable.tsx` — table of all records
   - `RecordForm.tsx` — form to add new record
   - `RecentRecordSection.tsx` — container for recent record
10. Layout in `app/page.tsx`: recent section → records table

### Phase 5: State & Data Fetching

11. Use React hooks to fetch & display records
12. Handle loading/error states
13. Form submission & table refresh

### Phase 6: UI Polish

14. TailwindCSS styling + responsive design
15. Toast notifications for create/delete

### Phase 7: Testing

16. Manual workflow test (add record → see in table → view graph)
17. Update README

### Phase 8: Documentation

18. Add code comments, README with setup instructions, API docs, how to run the application, and usage guide
---

## Relevant Files (To Create)

- `src/lib/db.ts` — SQLite connection & query helpers
- `src/types/index.ts` — TypeScript types
- `src/app/page.tsx` — home page
- `src/app/api/records/route.ts` — list & create
- `src/app/api/records/[id]/route.ts` — get & delete
- `src/components/` — all React components
- `db/schema.sql` — schema reference

---

## Verification

1. `npm install` & `npm run dev` succeed
2. SQLite file created with correct schema
3. API endpoints return correct data (test with curl/Postman)
4. UI displays recent record with graph + table
5. Add/delete records work end-to-end

---

## Key Decisions

- **Next.js** for unified full-stack (one server, frontend + API)
- **SQLite with better-sqlite3** (synchronous, no server overhead)
- **Recharts** for clean, React-friendly charting
- **TailwindCSS** for fast styling
- **Excluded**: Auth, multi-dog support, data export (can add later)

---

## Database Schema Details

### glucose_records Table (Single Table)

```sql
CREATE TABLE glucose_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,  -- ISO 8601 UTC datetime (e.g., "2026-05-09T00:00:00Z")
  dosage TEXT NOT NULL,  -- e.g., "7 units"
  drawData TEXT NOT NULL,  -- JSON array of {time (UTC), reading (float)}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**drawData JSON Format:**
```json
[
  { "time": "2026-05-09T08:00:00Z", "reading": 145.5 },
  { "time": "2026-05-09T12:00:00Z", "reading": 160.0 },
  { "time": "2026-05-09T16:00:00Z", "reading": 152.3 }
]
```
(All times stored as ISO 8601 UTC, frontend converts to browser local time for display)

---

## API Endpoint Details

### GET /api/records

**Response:**
```json
[
  {
    "id": 1,
    "date": "2026-05-09T14:30:00Z",
    "dosage": "7 units",
    "drawData": [
      { "time": "2026-05-09T08:00:00Z", "reading": 145.5 },
      { "time": "2026-05-09T12:00:00Z", "reading": 160.0 },
      { "time": "2026-05-09T16:00:00Z", "reading": 152.3 }
    ]
  }
]
```

### POST /api/records

**Request Body:**
```json
{
  "date": "2026-05-09T14:30:00Z",
  "dosage": "7 units",
  "drawData": [
    { "time": "2026-05-09T08:00:00Z", "reading": 145.5 },
    { "time": "2026-05-09T12:00:00Z", "reading": 160.0 },
    { "time": "2026-05-09T16:00:00Z", "reading": 152.3 }
  ]
}
```

**Response:** 201 Created with new record

### GET /api/records/:id

**Response:** Single record with parsed drawData

### DELETE /api/records/:id

**Response:** 204 No Content

---

## Component Architecture

### RecentRecordSection
- Fetches latest record on mount
- Converts UTC date to browser local time for display
- Displays date & dosage prominently
- Renders `GlucoseChart` with drawData array
- Shows stats: min, max, avg glucose values from drawData

### GlucoseChart
- Receives drawData array (UTC time, reading float pairs)
- Converts UTC times to browser local time for display
- Renders Recharts LineChart
- X-axis: local time formatted as AM/PM 12-hour format (e.g., "8:00 AM"), Y-axis: glucose reading value
- Tooltip on hover shows local time in AM/PM & reading value

### RecordsTable
- Displays all records in table format
- Columns: Date (converted to local time), Dosage, Number of Draws, Min/Max/Avg Glucose, Actions (delete)
- Sorted by date descending (UTC)
- Converts UTC dates to local time for display
- Refetch on delete/create

### RecordForm
- **Intelligent JSON Conversion:** Provides user-friendly local time inputs, automatically converts to UTC ISO 8601 timestamps
- Date picker (input as local date, stored as UTC datetime with 00:00:00 time component)
- Dosage input (text field, e.g., "7 units")
- **Dynamic readings list with intelligent UI:**
  - Add/remove reading rows with smooth UX
  - Each row has: local time picker (HH:MM 24-hour format), glucose reading input (float)
  - Real-time JSON preview showing the exact structure being submitted (24-hour times)
  - On form submit:
    1. Reads all local time + reading pairs from form inputs
    2. Converts each local time to UTC ISO 8601 format (using date + time picker values)
    3. Validates all readings are present and valid floats
    4. Constructs drawData JSON array: `[{time: "UTC", reading: <float>}, ...]`
    5. POSTs to `/api/records` with date, dosage, and serialized drawData
- Form validation: ensures at least one reading, all times are valid, all readings are numbers

### Home Page (app/page.tsx)
- Header with app title
- RecentRecordSection (if records exist)
- RecordsTable
- RecordForm in a modal or collapsible section
- Loading & error states

---

## Installation & Running

1. Run `npm install`
2. Run `npm run dev`
3. Open `http://localhost:3000`
4. SQLite database auto-created at project root as `bloodglucose.db`
5. (Optional) Run seed script to populate test data: `npm run seed`

---

## Environment Variables (.env.local)

```
DATABASE_PATH=./bloodglucose.db
PORT=3000
NODE_ENV=development
```

---

## Notes & Assumptions

- Glucose readings (drawData) stored as JSON array within single record
- **drawData format:** `{time: "<ISO 8601 UTC>", reading: <float>}`
- **Reading times:** Stored in 24-hour format (HH:MM), displayed as AM/PM 12-hour format in UI
- Dates stored as UTC ISO 8601 strings in database, converted to browser local time on display
- Dosage is a text field (flexible format: "7 units", "5 units + needle", etc.)
- One record per day (unique date constraint)
- No user authentication (single-user app)
- No pagination initially (can add if records grow large)
- Frontend handles UTC ↔ local time conversion for better UX
- RecordForm provides intelligent UI that abstracts JSON conversion from user (they see simple time/reading inputs)
- Add useful comments in codebase for clarity, especially around time conversions and data handling