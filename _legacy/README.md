# _legacy

This directory contains legacy code preserved for reference. It is NOT built, run, or imported by the main CCN app (Vite + React at the repo root).

## pier-s-yard/

Standalone Next.js 14 + Supabase app for Pier S yard inventory management. Ingests daily Excel exports from Pier S TMS, runs 16 automated audit checks (including Levenshtein fuzzy matching for typos in equipment prefixes, spot names, and comment phrasing), stores snapshots in Supabase Storage, and displays a live yard dashboard.

**Status:** Relocated here from the repo root to separate it from the main CCN Vite app. Preserved as-is and scheduled for port into CCN as a proper route. Do not install dependencies or run inside this directory — it is historical reference only.

**Key files:**
- `lib/auditRules.ts` — 16 audit checks, hardcoded valid prefixes/spots/comments
- `lib/parseExcel.ts` — Excel parser with column normalization
- `supabase/migrations/001_create_tables.sql` — `piers_equipment_inventory`, `pier_s_upload_log` schema (not yet applied to CCN's local Supabase)
- `README.md` — original app README with full feature list

**Planned port target:** new `/pier-s-yard` route in CCN using existing Vite + React + shadcn stack. Migration would be renumbered to fit the CCN migration sequence (next number in `supabase/migrations/`).
