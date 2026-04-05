# Pier S Yard Management System

Yard inventory management application for **Forrest Transportation — Pier S**. Accepts daily Excel uploads from the Pier S TMS, runs automated audit checks for data errors and typos, stores snapshots, and provides a live yard report dashboard.

## Features

- **Excel Upload**: Drag-and-drop Excel files from Pier S TMS equipment inventory export
- **Automated Auditing**: 16 audit checks catch typos, invalid data, duplicate entries, and non-canonical comments
- **Snapshot Storage**: Every upload is stored in Supabase Storage for historical reference
- **Live Dashboard**: Real-time yard inventory with search, filtering, and metric cards
- **Upload History**: Track all past uploads with error/warning counts

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres + Storage + Auth)
- **File Parsing**: xlsx library
- **Deployment**: Vercel-ready

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd pier-s-yard
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (for client-side reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server-side writes) |

### 3. Run database migrations

Execute the SQL in `supabase/migrations/001_create_tables.sql` in your Supabase SQL editor. This creates:

- `piers_equipment_inventory` — main inventory table with composite unique on `(equip_no, last_gate_in_time)`
- `pier_s_upload_log` — upload audit log with JSONB audit results
- Row Level Security policies for public read access

### 4. Create Supabase Storage bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `pier-s-yard`
3. Set it to public (for read access) or configure appropriate policies
4. Files are stored at: `snapshots/YYYY-MM-DDTHH-MM-SS_<filename>`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Uploading Inventory

1. Navigate to `/upload`
2. Drag and drop (or click to browse) your `.xlsx` file from the Pier S TMS export
3. The file is parsed and a preview of the first 10 rows is shown
4. Click **Upload & Audit** to process the file
5. Review the audit report — filter by severity (Errors, Warnings, Notes)
6. Export the audit report as CSV if needed

### Audit Checks

The system runs 16 automated checks:

| # | Check | Severity |
|---|-------|----------|
| 1 | Duplicate equipment number in same upload | Error |
| 2 | Equipment number format (4 letters + 6-7 digits) | Error |
| 3 | Unknown equipment prefix (Levenshtein suggestion) | Warning |
| 4 | Invalid equipment type (must be CHZ or CON) | Error |
| 5 | Invalid load type (case-insensitive match) | Warning |
| 6 | Negative days onsite | Error |
| 7 | Days onsite > 90 (flag for review) | Warning |
| 8 | Days onsite > 30 (extended dwell) | Info |
| 9 | Unknown spot/resource name (Levenshtein suggestion) | Warning |
| 10 | Non-canonical comment phrasing | Info |
| 11 | Unknown carrier code | Warning |
| 12 | Invalid gate-in time format | Error |
| 13 | Blank equipment number | Error |
| 14 | Cross-file carrier name mismatch | Warning |
| 15 | Container with unknown load state | Info |
| 16 | Unusual booking number format | Info |

### Dashboard

The dashboard at `/` shows:

- **Metric Cards**: Available, Reserved, Overdue (>90 days), Do Not Use
- **Inventory Table**: Searchable, filterable, paginated
- **Color Coding**: Red for errors, yellow for warnings
- **Filters**: Status, spot/resource, free text search
- **Last Updated**: Timestamp from most recent upload

## Project Structure

```
pier-s-yard/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Dashboard page
│   ├── upload/page.tsx         # Upload + audit page
│   └── api/
│       ├── upload/route.ts     # POST: file upload + audit + upsert
│       └── inventory/route.ts  # GET: filtered inventory query
├── components/
│   ├── UploadZone.tsx          # Drag-and-drop uploader
│   ├── AuditReport.tsx         # Audit findings with severity tabs
│   ├── DataPreview.tsx         # Parsed data preview table
│   ├── YardDashboard.tsx       # Main dashboard component
│   ├── MetricCards.tsx         # Summary stat cards
│   ├── InventoryTable.tsx      # Filterable inventory table
│   └── UploadHistory.tsx       # Past upload log
├── lib/
│   ├── supabase.ts             # Supabase client (browser + server)
│   ├── parseExcel.ts           # XLSX parser + column normalization
│   ├── auditRules.ts           # All 16 audit check functions
│   └── types.ts                # TypeScript interfaces
└── supabase/
    └── migrations/             # SQL migration files
```
