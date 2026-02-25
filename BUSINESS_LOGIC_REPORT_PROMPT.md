# Prompt: Generate Business Logic & Architecture Report with Diagrams

> Paste this into Claude Code while in the `chassis-compass-navigator` repo.

---

You are a senior systems analyst. Produce a comprehensive **Business Logic & Architecture Report** for the Chassis Compass Navigator application. This is a fleet management and vendor invoice processing platform built with React/TypeScript, Supabase (PostgreSQL + Edge Functions), and integrations with BlackBerry Radar, Google Maps, and multiple GPS providers.

Your report must include **Mermaid diagrams** for every major flow. Read the actual source files — do not guess.

---

## SECTION 1: System Context Diagram

Read `src/App.tsx`, `supabase/config.toml`, `supabase/functions/*/index.ts`, and `src/integrations/supabase/client.ts`.

Produce a **Mermaid C4-style context diagram** showing:
- The React SPA and all external actors (users, GPS providers, vendors, APIs)
- Supabase as the backend (Auth, Storage, Database, Edge Functions)
- External services: BlackBerry Radar, Google Maps, Lovable AI, each GPS provider (Fleetlocate, Anytrek, Fleetview)
- Data flow direction (arrows with labels)

Explain: Who uses this system? What problem does it solve? Why does a trucking/drayage company need a "chassis compass"?

---

## SECTION 2: GPS Data Unification Pipeline

Read these files carefully:
- `src/hooks/useUnifiedGpsData.ts`
- `src/hooks/useAnytrekData.ts`
- `src/hooks/useFleetlocateData.ts`
- `src/hooks/useFleetviewData.ts`
- `supabase/functions/syncAllAssets/index.ts`
- `supabase/functions/refreshLocation/index.ts`
- `supabase/functions/_shared/blackberry.ts`
- `supabase/functions/_shared/db.ts`
- `supabase/functions/_shared/geocode.ts`

Produce:
1. **Mermaid sequence diagram** showing how GPS data flows from each provider into the unified view (include the BlackBerry Radar OAuth/JWT flow, the cron-triggered sync, the per-provider hooks, and the merge/dedup in useUnifiedGpsData)
2. **Mermaid entity-relationship diagram** for the GPS-related tables: `anytrek_data`, `fleetlocate_stg`, `forrest_assetlist_data`, `chassis_master`, `asset_locations`, `assets`, `orgs`, `latest_locations`
3. **Data transformation table** showing how each provider's raw fields map to the unified `UnifiedGpsData` interface

Explain the business reasoning:
- Why aggregate from 3+ GPS providers instead of standardizing on one?
- What does the 5-minute auto-refresh accomplish operationally?
- How does deduplication by chassis ID work and why is it needed?
- What is BlackBerry Radar's role vs. the other GPS providers?

---

## SECTION 3: Invoice Ingestion & Extraction Pipeline

Read these files:
- `src/hooks/useInvoiceUpload.ts`
- `src/lib/invoiceClient.ts`
- `src/lib/invoiceStorage.ts`
- `supabase/functions/extract-dcli-invoice/index.ts`
- `supabase/functions/extract-ccm-invoice/index.ts`
- `supabase/functions/extract-trac-invoice/index.ts`
- `supabase/functions/extract-wccp-invoice/index.ts`
- `supabase/functions/extract-flexivan-invoice/index.ts`
- `supabase/functions/extract-scspa-invoice/index.ts`
- `supabase/functions/extract_invoice_data/index.ts`
- `src/components/dcli/invoice/InvoiceUploadStep.tsx`

Produce:
1. **Mermaid flowchart** showing the full invoice lifecycle: Upload → Storage → DB Insert → Edge Function Extraction → Line Items Parsed → Review → Validation → Dispute
2. **Mermaid sequence diagram** for the DCLI invoice extraction specifically (the most complete implementation), showing the interaction between frontend, Supabase Storage, the database, and the edge function
3. **Comparison table** of all 6 vendor extractors: which columns each one maps, what file formats each accepts, and which are complete vs. stub implementations

Explain the business reasoning:
- Why does a trucking company need to process invoices from 6 different chassis leasing vendors?
- What is the relationship between a chassis vendor (DCLI, FLEXIVAN, etc.) and the trucking company?
- Why extract line items from PDFs/Excel rather than receiving structured data?
- What does the dispute workflow accomplish?

---

## SECTION 4: Invoice Validation & TMS Matching

Read these files:
- The SQL migration containing the `validate_dcli_invoice()` PL/pgSQL function (search migrations for it)
- `supabase/functions/extract-csv/index.ts` (TMS CSV ingestion)
- `src/components/chassis/UtilizationTab.tsx`
- `src/hooks/useTMSData.ts`
- The migration creating the `mg_tms` table

Produce:
1. **Mermaid flowchart** showing: TMS CSV upload → storage webhook → extract-csv function → mg_tms table → validate_dcli_invoice() matching → confidence scores
2. **Mermaid diagram** of the matching algorithm: How does `validate_dcli_invoice()` compare invoice line items to TMS records? What constitutes an exact match, fuzzy match, and mismatch? What fields are compared?
3. **Decision tree diagram** showing how confidence scores are calculated and what actions follow each outcome

Explain the business reasoning:
- What is a TMS (Transportation Management System) and what is MercuryGate?
- Why cross-reference vendor invoices against TMS shipment records?
- What kinds of billing errors does this catch?
- How does the utilization calculation (UtilizationTab.tsx) help the business — what decisions does utilization % drive?

---

## SECTION 5: AI-Powered Semantic Search (Embeddings)

Read these files:
- `supabase/functions/build-embeddings/index.ts`
- `supabase/functions/chat-vendors/index.ts`
- The SQL migration containing `match_invoice_lines()` and the pgvector setup

Produce:
1. **Mermaid sequence diagram** showing: batch embedding generation → pgvector storage → user query → embedding → cosine similarity search → results enriched with raw data
2. **Architecture diagram** showing how pgvector, the Lovable AI API, and the chat-vendors function interact

Explain the business reasoning:
- Why use semantic search over invoices instead of simple text search?
- What kinds of questions would a user ask the chat-vendors function?
- How does the embedding similarity threshold (0.7) affect result quality?

---

## SECTION 6: Asset Management & Geofencing

Read these files:
- `supabase/functions/assetsCrud/index.ts`
- `supabase/functions/geofencesCrud/index.ts`
- `supabase/functions/getDistance/index.ts`
- `supabase/functions/_shared/blackberry.ts`
- `supabase/functions/_shared/db.ts`

Produce:
1. **Mermaid sequence diagram** for asset creation/sync with BlackBerry Radar (include OAuth flow, duplicate detection, Supabase upsert)
2. **Mermaid diagram** for geofence lifecycle: creation in both Radar and Supabase, polygon definition, and deletion sync
3. **Diagram** showing the distance calculation flow (Haversine straight-line vs. Google Maps driving distance)

Explain the business reasoning:
- Why sync assets to BlackBerry Radar?
- What are geofences used for in trucking/drayage operations?
- Why calculate both straight-line and driving distance?

---

## SECTION 7: Chassis Utilization Analytics

Read `src/components/chassis/UtilizationTab.tsx` and `src/pages/ChassisDetail.tsx`.

Produce:
1. **Mermaid flowchart** of the utilization calculation algorithm: date range filtering → daily utilization map → monthly aggregation → KPI derivation
2. **Dashboard wireframe diagram** (ASCII or Mermaid) showing the layout of all 6 KPI cards, the daily timeline chart, the monthly trend chart, the revenue vs cost chart, and the usage history table
3. **Formula documentation** for each metric: utilization %, idle days, avg revenue/day, margin %

Explain the business reasoning:
- What does chassis utilization % tell operations managers?
- Why track idle days — what cost does idle chassis represent?
- How does revenue-per-day-per-chassis inform leasing decisions?
- Why is the date range filter defaulted to 3 months?

---

## SECTION 8: Frontend Navigation & User Journeys

Read `src/App.tsx`, `src/components/layout/DashboardLayout.tsx`, and `src/utils/navigationHelpers.ts`.

Produce:
1. **Mermaid sitemap/graph** showing ALL routes and their hierarchy (Dashboard, Chassis, GPS providers, TMS, Yards, Vendors × 6, Invoices, Settings)
2. **User journey diagrams** (Mermaid) for these 3 key workflows:
   - Fleet manager checking chassis location and utilization
   - Accounts payable clerk uploading and validating a DCLI invoice
   - Operations analyst searching invoice data via AI chat

Explain: What are the distinct user personas this application serves?

---

## SECTION 9: Database Schema (Complete ERD)

Read `src/integrations/supabase/types.ts` and all files in `supabase/migrations/`.

Produce a **comprehensive Mermaid ER diagram** covering ALL tables with their columns, types, and relationships. Group tables into domains:
- GPS/Location domain
- Invoice domain (per vendor)
- Asset/BlackBerry domain
- TMS domain
- Chassis master domain

---

## SECTION 10: Business Value Summary

Based on everything above, produce:

1. **Value stream map** — from raw GPS data and vendor invoices to actionable business intelligence
2. **Risk matrix** — what business risks does this system mitigate (overbilling, idle assets, lost chassis, etc.)?
3. **ROI narrative** — if a trucking company has 500 chassis across 6 vendors, what's the estimated value of:
   - Catching 2% invoice overbilling
   - Reducing chassis idle time by 5%
   - Real-time visibility vs. daily manual reports

---

## FORMAT REQUIREMENTS

- Use ```mermaid code blocks for all diagrams
- Every diagram must have a title
- Every section must have a "Business Reasoning" subsection explaining the WHY, not just the WHAT
- Use tables for comparisons and field mappings
- Include file path references (file:line) for every claim
- Write for an audience of: (a) a CTO evaluating the codebase, and (b) a new developer onboarding to the project
- Output as a single Markdown file named `BUSINESS_LOGIC_REPORT.md`
