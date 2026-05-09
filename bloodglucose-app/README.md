# Blood Glucose Tracker

A full-stack Next.js + TypeScript web application for tracking your dog's blood glucose readings. Features a responsive UI with Recharts visualization, SQLite backend, and intuitive form for recording glucose curves.

**Tech Stack**: Next.js 16, TypeScript, React 19, Recharts, SQLite (better-sqlite3), TailwindCSS

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - The SQLite database will auto-initialize at `bloodglucose.db`

### Build for Production

```bash
npm run build
npm start
```

---

## Features

- ✅ **Recent Record Display** — View your most recent glucose record with chart visualization
- ✅ **Glucose Chart** — Recharts line chart showing readings over time (AM/PM 12-hour format)
- ✅ **Records Table** — All records with date, dosage, reading count, min/max/avg glucose
- ✅ **Add Record Form** — User-friendly form with intelligent time conversion (local time ↔ UTC)
- ✅ **Delete Records** — Remove records with confirmation dialog
- ✅ **Responsive Design** — Mobile-friendly UI with TailwindCSS
- ✅ **UTC Date Handling** — All dates stored as UTC, displayed in browser local time
- ✅ **Statistics** — Min, max, average glucose values calculated per record

---

## Usage

### Adding a Record

1. Click **"+ Add New Record"** button
2. Select a **date** (defaults to today)
3. Enter **dosage** (e.g., "7 units")
4. Add **glucose readings**:
   - Each row requires a time (24-hour format) and glucose value
   - Click "+ Add Reading" to add more rows
   - Click "Remove" to delete a row
5. *(Optional)* Click "Show JSON Preview" to see the exact data being submitted
6. Click **"Create Record"** to save

### Viewing Records

- **Most Recent Record** section displays the latest record with a chart
- **All Records table** shows all records with statistics
- **Delete** any record by clicking the red "Delete" button

### Time Conversion

- **Form Input**: Times are entered in your local browser timezone (24-hour format)
- **Database Storage**: Times are automatically converted to UTC ISO 8601 format
- **Display**: Times are converted back to your local timezone and shown in 12-hour AM/PM format

---

## API Endpoints

All endpoints return JSON responses with `success` (boolean) and `data` (array/object) or `error` (string).

### GET /api/records
Fetch all glucose records sorted by date (descending).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2026-05-09T00:00:00Z",
      "dosage": "7 units",
      "drawData": [
        {"time": "2026-05-09T08:00:00Z", "reading": 145.5},
        {"time": "2026-05-09T12:00:00Z", "reading": 160},
        {"time": "2026-05-09T16:00:00Z", "reading": 152.3}
      ],
      "created_at": "2026-05-09 22:05:37",
      "updated_at": "2026-05-09 22:05:37"
    }
  ]
}
```

### POST /api/records
Create a new glucose record.

**Request Body:**
```json
{
  "date": "2026-05-09T00:00:00Z",
  "dosage": "7 units",
  "drawData": [
    {"time": "2026-05-09T08:00:00Z", "reading": 145.5},
    {"time": "2026-05-09T12:00:00Z", "reading": 160},
    {"time": "2026-05-09T16:00:00Z", "reading": 152.3}
  ]
}
```

**Response:** 201 Created with the new record object

### GET /api/records/:id
Fetch a specific glucose record by ID.

**Response:** 200 OK with the record object

### DELETE /api/records/:id
Delete a glucose record by ID.

**Response:** 200 OK with `{"success": true, "data": {"id": <id>}}`

---

## Database Schema

### glucose_records Table

```sql
CREATE TABLE glucose_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  dosage TEXT NOT NULL,
  drawData TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` — Unique auto-increment identifier
- `date` — ISO 8601 UTC datetime (e.g., "2026-05-09T00:00:00Z"). Unique per day.
- `dosage` — Text field for insulin dosage (e.g., "7 units")
- `drawData` — JSON array of glucose readings with time and value

**drawData Format:**
```json
[
  {"time": "2026-05-09T08:00:00Z", "reading": 145.5},
  {"time": "2026-05-09T12:00:00Z", "reading": 160},
  {"time": "2026-05-09T16:00:00Z", "reading": 152.3}
]
```

---

## Project Structure

```
bloodglucose-app/
├── app/
│   ├── layout.tsx           — Root layout
│   ├── page.tsx             — Home page (main UI)
│   ├── globals.css          — Global styles
│   └── api/
│       └── records/
│           ├── route.ts     — GET /api/records, POST /api/records
│           └── [id]/
│               └── route.ts — GET /api/records/:id, DELETE /api/records/:id
├── components/
│   ├── GlucoseChart.tsx          — Recharts line chart component
│   ├── RecordsTable.tsx          — Table of all records
│   ├── RecordForm.tsx            — Form to add new record
│   └── RecentRecordSection.tsx   — Container for latest record + chart
├── lib/
│   └── db.ts                — SQLite connection & query helpers
├── types/
│   └── index.ts             — TypeScript type definitions
└── bloodglucose.db          — SQLite database (auto-created)
```

---

## Key Design Decisions

- **One record per day** — The `date` field has a UNIQUE constraint, ensuring one record per UTC day
- **UTC storage, local display** — All times stored as UTC ISO 8601, converted to browser local time on display
- **Dosage as text** — Allows flexible formats ("7 units", "5 units + needle", etc.)
- **No authentication** — Single-user application
- **No pagination** — Suitable for typical usage patterns (under 1000 records)
- **Synchronous SQLite** — better-sqlite3 provides fast queries without async overhead

---

## Development

### Running Tests

The application uses manual testing via the UI. To verify full end-to-end functionality:

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Add a record with glucose readings
4. Verify the record appears in the table and chart
5. Delete the record and confirm removal

### Linting

```bash
npm run lint
```

---

## Environment Variables

Create a `.env.local` file in the project root (optional):

```
DATABASE_PATH=./bloodglucose.db
PORT=3000
NODE_ENV=development
```

Defaults:
- `DATABASE_PATH` — `./bloodglucose.db` (project root)
- `PORT` — 3000
- `NODE_ENV` — development

---

## Limitations & Future Enhancements

**Current Limitations:**
- Single-user only (no authentication)
- No data export (CSV, PDF)
- No multi-dog support
- No advanced analytics

**Potential Enhancements:**
- User authentication & multi-user support
- Data export (CSV, PDF)
- Glucose trend analysis & alerts
- Multiple dogs/pets support
- Notes field per record
- Photo upload for records

---

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or specify a different port
PORT=3001 npm run dev
```

### Database locked error
- Ensure only one dev server is running
- Delete `bloodglucose.db` and restart to reset

### Records not showing
- Check browser console for errors (F12)
- Verify API responses via browser Network tab

---

## License

See [LICENSE](../LICENSE) file in the root directory.
