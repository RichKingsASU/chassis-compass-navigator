================================================================================
CLAUDE CODE PROMPT — DCLI Invoice Workflow MVP
================================================================================

Context for you, Claude Code:
- Project path: C:\TestingGIT\chassis-compass-navigator
- Stack: Vite + React + TypeScript + Tailwind + shadcn-ui + local Supabase
- All terminal commands use PowerShell syntax.  Richard has no local admin rights.
- Local Supabase DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Existing patterns to follow:
    * Shared invoice utilities live in src/utils/ and src/types/ — import, never duplicate
    * Empty states only (NO mock / fallback / demo data anywhere in UI)
    * mg_tms is a VIEW; base table is mg_data (not touched here but don't rely on mg_tms in any join)
- Scope of THIS task: DCLI only.  Don't add TRAC/FLEXIVAN/etc. yet.
- MVP is READ-ONLY.  No status editing, no BC export button yet.  Side-by-side UX eval
  vs. the DCLI_Chassis_Expenses.xlsx workbook is the goal.

--------------------------------------------------------------------------------
WHAT TO BUILD
--------------------------------------------------------------------------------

1. Three Supabase migrations under supabase/migrations/
   - 20260420120001_dcli_01_config.sql  (6 config tables + seed data)
   - 20260420120002_dcli_02_invoice.sql (dcli_invoice, dcli_invoice_payment,
                                          dcli_invoice_line, dcli_bc_export_batch scaffold)
   - 20260420120003_dcli_03_views.sql   (v_dcli_line_display, v_dcli_soa_reconciliation,
                                          v_dcli_gl_export_pending)

2. Python CLI importer at scripts/import_dcli_xlsx.py
   - Reads the DCLI_Chassis_Expenses.xlsx workbook
   - Decomposes the single "Status" column into payment_status + dispute_status
   - Upserts SOA → dcli_invoice, Payment 1..5 → dcli_invoice_payment,
     DCLI sheet → dcli_invoice_line
   - Reports unmatched customers / AMs / categories at the end

3. TypeScript integration module at src/integrations/supabase/dcli.ts
   - Typed shapes for invoice, line display, reconciliation, GL export, config
   - Fetcher functions; all read-only for MVP

4. CCN page at src/pages/DcliInvoices.tsx
   - 5 tabs:
       SOA                  → dcli_invoice grid
       DCLI (Line Items)    → v_dcli_line_display grid with payment/dispute filters
       Data for GL Template → v_dcli_gl_export_pending preview
       Data Validation      → read-only view of all 6 config tables
       Reconciliation       → v_dcli_soa_reconciliation with variance filter
   - Routes registered in src/App.tsx at /dcli-invoices
   - Sidebar nav entry added (match existing vendor links style)

--------------------------------------------------------------------------------
FILE CONTENTS (COPY VERBATIM)
--------------------------------------------------------------------------------

Claude Code: the full, verified file contents for all 6 files are attached to
this conversation as downloads from Claude (main chat). Fetch them from the
local paths Richard provides, OR ask Richard to paste them in if you don't have
filesystem access to the downloaded files.  Do NOT regenerate the SQL or Python
from scratch — those files have been reviewed against the actual workbook and
are canonical.

File list with relative paths (all must exist at these exact paths):
    supabase/migrations/20260420120001_dcli_01_config.sql
    supabase/migrations/20260420120002_dcli_02_invoice.sql
    supabase/migrations/20260420120003_dcli_03_views.sql
    scripts/import_dcli_xlsx.py
    src/integrations/supabase/dcli.ts
    src/pages/DcliInvoices.tsx


--------------------------------------------------------------------------------
STEP 0 — SUPABASE CLIENT IMPORT PATH (DO NOT CHANGE)
--------------------------------------------------------------------------------
The file src/integrations/supabase/dcli.ts imports supabase from @/lib/supabase
(this repo's convention — NOT @/integrations/supabase/client). This has already
been verified against src/lib/supabase.ts which exports supabase. Do NOT
"normalize" or rewrite this import.
--------------------------------------------------------------------------------
WIRING STEPS
--------------------------------------------------------------------------------

After creating the files above:

A) Register the route in src/App.tsx
   - Add: import DcliInvoices from "@/pages/DcliInvoices";
   - Add a route:  <Route path="/dcli-invoices" element={<DcliInvoices />} />
   - Match existing route registration style

B) Add sidebar nav entry
   - Find the existing vendor sidebar config (likely under src/components/Sidebar*
     or src/layouts/*).  Locate where DCLI / vendor links live.
   - Add a link labeled "DCLI Invoices" pointing to /dcli-invoices.
   - If a separate "Vendor Invoicing" section exists, nest under it.

C) Verify shadcn components are installed.  If any are missing, install:
     npx shadcn@latest add tabs card table badge input select

D) Apply migrations to local Supabase:
     cd C:\TestingGIT\chassis-compass-navigator
     npx supabase db push
   (If db push fails because Supabase is not linked locally, apply via psql:
     Get-Content supabase\migrations\20260420120001_dcli_01_config.sql |
       psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
    Repeat for 02 and 03.)

E) Test the importer with a sample run:
     python -m pip install pandas openpyxl "psycopg[binary]" --user
     python scripts\import_dcli_xlsx.py "C:\path\to\DCLI_Chassis_Expenses.xlsx" --dry-run
     # Then real run:
     python scripts\import_dcli_xlsx.py "C:\path\to\DCLI_Chassis_Expenses.xlsx"

F) Start the dev server and smoke-test each tab:
     npm run dev
     # open http://localhost:5173/dcli-invoices
     # verify: SOA shows invoices, Line Items tab filters work, Reconciliation
     # shows at least some MATCH rows.  If any tab shows an error, copy the
     # browser console error and address it.

G) Git commit + push:
     git add supabase\migrations\20260420120001_dcli_01_config.sql `
             supabase\migrations\20260420120002_dcli_02_invoice.sql `
             supabase\migrations\20260420120003_dcli_03_views.sql `
             scripts\import_dcli_xlsx.py `
             src\integrations\supabase\dcli.ts `
             src\pages\DcliInvoices.tsx `
             src\App.tsx
     git commit -m "feat(dcli): invoice workflow MVP (import + side-by-side UI)

- Add dcli_invoice, dcli_invoice_payment, dcli_invoice_line tables
- Add 6 DCLI-specific config tables with seed data from Data Validation sheet
- Decompose 18-value Status column into payment_status + dispute_status
- Add v_dcli_line_display, v_dcli_soa_reconciliation, v_dcli_gl_export_pending views
- Scaffold dcli_bc_export_batch tables (not wired to UI yet)
- Add Python CLI importer for DCLI_Chassis_Expenses.xlsx workbook
- Add /dcli-invoices page with SOA, Lines, GL Template, Config, Reconciliation tabs
- Read-only MVP for UX evaluation vs. source workbook"
     git push

--------------------------------------------------------------------------------
EXPECTED IMPORTER OUTPUT (first run)
--------------------------------------------------------------------------------

With the sample workbook Richard uploaded, you should see roughly:

    Reading C:\path\to\DCLI_Chassis_Expenses.xlsx
      SOA  sheet:   323 rows
      DCLI sheet: 3111 rows

    1/2  Importing SOA → dcli_invoice / dcli_invoice_payment ...
         Upserted ~320 invoice header(s).

    2/2  Importing DCLI → dcli_invoice_line ...
         Upserted 3111 line item(s).

    --- Unmatched customers (line imported with null customer_id) (~15) ---
        MATTEL SALES CORPORATION
        [... other casing mismatches ...]

    Done.

If unmatched-customer list is non-empty: those are real data-entry casing drift
(e.g. the sheet has "MATTEL SALES CORPORATION" but the Data Validation picklist
has "Mattel Sales Corporation").  The importer already uses citext so
case-insensitive matching is in play — any remaining unmatched names are genuine
typos or new customers not yet in the picklist.  Report the list to Richard; do
not auto-insert new customer rows.

--------------------------------------------------------------------------------
DO NOT
--------------------------------------------------------------------------------

- Do NOT deploy to Netlify.
- Do NOT create GitHub Actions.
- Do NOT touch any existing mg_tms / mg_data / yard_events_data code.
- Do NOT add mock or fallback data to empty states.
- Do NOT generate the SQL or Python contents from scratch — use the canonical
  files delivered with this task.
- Do NOT add Supabase Edge Functions for this task.

--------------------------------------------------------------------------------
WHEN DONE
--------------------------------------------------------------------------------

Confirm to Richard:
1. All 6 files created at the exact paths listed above.
2. Migrations applied successfully (show row counts for each config table).
3. Importer ran cleanly on the sample workbook with the count output above.
4. /dcli-invoices loads in the browser with all 5 tabs populated.
5. Git push succeeded.

Then stop.  Phase 2 (status editing, BC export button, vendor replication) is
a separate conversation.

