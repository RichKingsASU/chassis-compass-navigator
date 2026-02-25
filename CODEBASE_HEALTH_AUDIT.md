# CODEBASE HEALTH AUDIT

**Project:** Chassis Compass Navigator (vite_react_shadcn_ts)
**Last Active:** 2026-02-25 (original development: Nov 4-18, 2025)
**Primary Stack:** TypeScript 5.5, React 18, Vite 5, Supabase (PostgreSQL + Deno Edge Functions), Tailwind CSS 3, shadcn/ui
**Total Files:** 376 | **Total LOC:** ~50,609

---

## Executive Summary

Chassis Compass Navigator is a **fleet management and vendor invoice processing platform** built for trucking/drayage companies. It was developed over a 2-week sprint (November 4-18, 2025) using the Lovable.dev AI code generation platform. The application aggregates real-time GPS tracking data from multiple providers (Fleetlocate, Anytrek, Fleetview, BlackBerry Radar), manages chassis inventory across yards, and processes invoices from 6 chassis leasing vendors (DCLI, CCM, TRAC, FLEXIVAN, WCCP, SCSPA). It includes TMS (Transportation Management System) data import for invoice-to-shipment matching with confidence scoring, AI-powered semantic search over invoice data via pgvector embeddings, and chassis utilization analytics with financial KPIs.

The codebase is in a **prototype/MVP state**. It contains substantial domain-specific business logic worth preserving — GPS data unification, BlackBerry Radar OAuth integration, invoice extraction pipelines, and a PL/pgSQL confidence-scoring validation algorithm. However, it suffers from **critical security vulnerabilities** (disabled JWT verification on all 18 edge functions, universally permissive RLS policies, wildcard CORS, exposed API keys), **zero test coverage**, heavy vendor-specific code duplication (6 near-identical invoice pipelines), 169 console.log statements, 124 untyped `any` usages, and TypeScript strict mode completely disabled. The architecture (React SPA + Supabase BaaS) is sound and modern, but the implementation quality reflects rapid AI-assisted generation rather than production-grade engineering.

Revival is feasible. The core business logic encodes domain knowledge that would be expensive to recreate from scratch. However, the security posture requires **immediate remediation before any production deployment**, the vendor abstraction layer needs consolidation, and a testing infrastructure must be established.

**Overall Revival Verdict:** PARTIAL

---

## Dependency Health

**Rating:** YELLOW (Needs Updates)

| Dependency | Current Version | Latest Known | Status |
|-----------|----------------|-------------|--------|
| react | ^18.3.1 | 19.2.4 | Outdated (1 major) |
| react-dom | ^18.3.1 | 19.2.4 | Outdated (1 major) |
| react-router-dom | ^6.26.2 | 7.13.1 | Outdated (1 major, consolidated into `react-router`) |
| vite | ^5.4.1 | 7.3.1 | Outdated (2 major) |
| tailwindcss | ^3.4.11 | 4.2.1 | Outdated (1 major, complete config overhaul) |
| typescript | ^5.5.3 | 5.7+ | OK (minor) |
| @supabase/supabase-js | ^2.57.4 | 2.97.0 | OK (same major) |
| @tanstack/react-query | ^5.56.2 | 5.90+ | OK (same major) |
| xlsx | ^0.18.5 | 0.18.5 (npm abandoned) | CRITICAL — CVE-2023-30533 (Prototype Pollution), CVE-2024-22363 (ReDoS). No npm fixes available. |
| mapbox-gl | ^3.15.0 | 3.18.1 | OK (minor) |
| @react-google-maps/api | ^2.20.7 | 2.x | OK |
| next-themes | ^0.3.0 | 0.4.6 | Misuse — designed for Next.js, not Vite/SPA |
| recharts | ^2.12.7 | 2.x | OK |
| lucide-react | ^0.462.0 | 0.470+ | OK |
| zod | ^3.23.8 | 3.x | OK |
| react-hook-form | ^7.53.0 | 7.x | OK |
| date-fns | ^3.6.0 | 3.x | OK |
| lovable-tagger | ^1.1.7 (dev) | N/A | Lovable platform-specific, dev-only |
| eslint | ^9.9.0 | 9.x | OK |

**Action Items:**
1. **CRITICAL:** Replace `xlsx` (npm 0.18.5) — package is abandoned on npm. Switch to ExcelJS or install SheetJS from CDN (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`)
2. **HIGH:** Upgrade Vite 5 → 7 (breaking changes in config, requires Node 20.19+)
3. **HIGH:** Upgrade Tailwind 3 → 4 (CSS-first configuration, 5x faster builds)
4. **MEDIUM:** Upgrade React 18 → 19 (Activity API, concurrent features)
5. **MEDIUM:** Migrate react-router-dom v6 → react-router v7 (package consolidation)
6. **LOW:** Replace `next-themes` with a custom Vite-compatible ThemeProvider
7. **LOW:** Update @supabase/supabase-js to latest 2.97.x for bug fixes

---

## Architecture Assessment

**Pattern:** Single-Page Application (SPA) with serverless backend (BaaS via Supabase)

**Diagram:**
```
                    ┌──────────────────────────────────────────────────────────────┐
                    │                    FRONTEND (React SPA)                       │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
                    │  │Dashboard │  │ Chassis  │  │  Vendor  │  │   GPS    │     │
                    │  │  Page    │  │ Mgmt/Map │  │ Invoices │  │ Overview │     │
                    │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
                    │       │              │              │              │           │
                    │  ┌────┴──────────────┴──────────────┴──────────────┴────┐     │
                    │  │           React Query + Custom Hooks                 │     │
                    │  │  useUnifiedGpsData | useInvoiceUpload | useDCLIData  │     │
                    │  └─────────────────────────┬───────────────────────────┘     │
                    └────────────────────────────┼──────────────────────────────────┘
                                                 │ HTTPS (Supabase JS SDK)
                    ┌────────────────────────────┼──────────────────────────────────┐
                    │                    SUPABASE PLATFORM                           │
                    │  ┌─────────────────────────┴──────────────────────────────┐   │
                    │  │                 PostgREST + Auth + Storage              │   │
                    │  └───┬──────────┬───────────────┬────────────────────────┘   │
                    │      │          │               │                             │
                    │  ┌───┴───┐  ┌───┴────┐  ┌──────┴──────────────────────┐     │
                    │  │ Auth  │  │Storage │  │   PostgreSQL Database        │     │
                    │  │(anon) │  │Buckets │  │  chassis_master | mg_tms    │     │
                    │  └───────┘  │invoices│  │  dcli_invoice_staging       │     │
                    │             │ccm-inv │  │  anytrek_data | fleetlocate │     │
                    │             └────────┘  │  pgvector embeddings        │     │
                    │                         └─────────────────────────────┘     │
                    │  ┌──────────────────────┐                                    │
                    │  │  18 Edge Functions    │                                    │
                    │  │  (Deno Runtime)       │                                    │
                    │  │                       │                                    │
                    │  │ extract-dcli-invoice  │──── XLSX/PDF parsing               │
                    │  │ extract-ccm-invoice   │──── XLSX/PDF parsing               │
                    │  │ extract-trac-invoice  │──── PDF/text parsing               │
                    │  │ syncAllAssets         │──── BlackBerry Radar API (OAuth)    │
                    │  │ chat-vendors          │──── Lovable AI Gateway (embeddings) │
                    │  │ getDistance            │──── Google Maps Distance Matrix     │
                    │  │ standardize-gps-data  │──── Google Maps Geocoding           │
                    │  │ build-embeddings      │──── text-embedding-ada-002          │
                    │  └──────────────────────┘                                    │
                    └──────────────────────────────────────────────────────────────┘
```

**Strengths:**
- Clean separation between frontend (React Query hooks) and backend (Supabase Edge Functions)
- Multi-provider GPS unification is well-architected (3 providers → unified interface with 5-minute auto-refresh)
- Invoice extraction pipeline is modular (one function per vendor, shared patterns)
- React Query provides excellent caching, loading/error states, and automatic refetching
- shadcn/ui provides consistent, accessible UI component library
- pgvector for semantic search is a modern, scalable approach
- BlackBerry Radar integration has production-quality OAuth/JWT signing (`_shared/blackberry.ts`)

**Weaknesses:**
- No authentication enforcement on frontend routes or backend functions
- Heavy vendor-specific code duplication (6 near-identical invoice pipelines with no shared abstraction)
- 3 out of 6 vendor data hooks are stubs (FLEXIVAN, TRAC, WCCP — no real data fetching)
- Tight coupling to Supabase (all hooks call Supabase client directly, no data access layer)
- No error boundaries or global error handling strategy in React tree
- No CI/CD pipeline, no Docker configuration, no deployment automation, no IaC
- TypeScript strict mode completely disabled (no strictNullChecks, no noImplicitAny)
- Zero test infrastructure (no test framework, no test files, no test scripts)

---

## Module-by-Module Salvage Assessment

### src/hooks/ — Custom React Hooks
- **Purpose:** Data fetching, GPS unification, invoice upload orchestration, search, TMS data
- **LOC:** 1,339 across 15 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — `useUnifiedGpsData` (multi-provider aggregation with dedup by chassis ID, last-write-wins, 5-min auto-refresh), `useInvoiceUpload` (6-step upload orchestration with rollback), `useDCLIData` (metrics calculation with status aggregation)
- **Code Quality:** NEEDS-REFACTOR — 3 hooks are stubs returning hardcoded/empty data (`useFLEXIVANData`, `useTRACData`, `useWCCPData`), remainder is functional but mixed business/data-access logic
- **Coupling:** LOCKED-IN (all hooks use `supabase` client directly via `@/integrations/supabase/client`)
- **Test Coverage:** NONE
- **Recommendation:** Keep and refactor. Extract Supabase queries into a data access layer so hooks contain only business logic. Complete stub implementations. Add unit tests for `useUnifiedGpsData` and `useInvoiceUpload`.
- **Key Files to Save:**
  - `useUnifiedGpsData.ts` — Core GPS aggregation logic (multi-provider merge + dedup)
  - `useInvoiceUpload.ts` — Multi-step upload orchestration with error handling
  - `useDCLIData.ts` — Most complete vendor data hook with dashboard metrics
  - `useChassisSearch.ts` — Reusable search/filter pattern

### supabase/functions/ — Deno Edge Functions
- **Purpose:** Invoice extraction (6 vendors + 1 AI-based), GPS sync, asset CRUD, geofence management, semantic search, distance calculation
- **LOC:** 3,637 across 24 files (18 functions + 6 shared utilities)
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — BlackBerry OAuth with ES256 JWT signing (`_shared/blackberry.ts`, 195 LOC of crypto), invoice column-mapping extraction, TMS CSV ingestion with 40+ typed columns, pgvector embedding pipeline
- **Code Quality:** NEEDS-REFACTOR — Duplicated CORS headers and error patterns across all functions, wildcard CORS, disabled JWT, no input validation
- **Coupling:** LOCKED-IN (Deno runtime + Supabase SDK + external APIs: BlackBerry, Google Maps, Lovable AI)
- **Test Coverage:** NONE
- **Recommendation:** Keep all functions. Create a shared base handler with auth + CORS. Abstract invoice extraction into a common pipeline. Fix JWT and CORS immediately.
- **Key Files to Save:**
  - `_shared/blackberry.ts` — ES256 JWT signing + OAuth + token caching (195 LOC, hard to recreate)
  - `_shared/db.ts` — Haversine distance, asset CRUD, location management
  - `_shared/geocode.ts` — Google Maps reverse geocoding abstraction
  - `extract-dcli-invoice/index.ts` — Most complete invoice extractor (template for others, 274 LOC)
  - `extract_invoice_data/index.ts` — AI-based extraction using Gemini 2.5 Flash (426 LOC)
  - `chat-vendors/index.ts` — Semantic search with pgvector embeddings
  - `syncAllAssets/index.ts` — Background API sync pattern
  - `extract-csv/index.ts` — TMS CSV ingestion with typed column mapping

### supabase/migrations/ — Database Schema
- **Purpose:** PostgreSQL schema definitions, RLS policies, PL/pgSQL functions, storage bucket configs
- **LOC:** 4,869 across 60 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — `validate_dcli_invoice()` (confidence-scored TMS matching with field-by-field comparison), `match_invoice_lines()` (pgvector cosine similarity search), complex multi-domain schema
- **Code Quality:** NEEDS-REFACTOR — All RLS policies are `USING(true)`, some duplicate migrations exist, incremental patches could be squashed
- **Coupling:** LOCKED-IN (PostgreSQL + Supabase + pgvector extension)
- **Test Coverage:** NONE
- **Recommendation:** Keep and consolidate. Squash 60 files into a single baseline migration. Rewrite all RLS policies with proper org/user scoping. The `validate_dcli_invoice()` function encodes irreplaceable business logic.
- **Key Files to Save:**
  - Migration with `validate_dcli_invoice()` — PL/pgSQL confidence scoring (equipment match base 40-100, penalty deductions -10 to -20)
  - Migration with `match_invoice_lines()` — pgvector 1536-dim cosine similarity, threshold 0.7
  - Migrations creating `chassis_master`, `dcli_invoice_staging`, `mg_tms` tables

### src/components/chassis/ — Chassis Management UI
- **Purpose:** GPS map visualization with colored pins/clustering, utilization analytics dashboard, reservation management
- **LOC:** ~3,200 across 11 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — `UtilizationTab.tsx` (699 LOC) contains real business logic: utilization % calculation, daily/monthly aggregation, financial KPI derivation (revenue, cost, margin per chassis)
- **Code Quality:** REUSABLE — Well-structured components with clear responsibilities
- **Coupling:** MIXED — Uses Google Maps API and Mapbox GL, adaptable
- **Test Coverage:** NONE
- **Recommendation:** Keep as-is. `UtilizationTab.tsx` and `ChassisMapView.tsx` contain the most valuable domain visualization logic.
- **Key Files to Save:**
  - `UtilizationTab.tsx` — Full utilization analytics engine (699 LOC)
  - `ChassisMapView.tsx` — Map with colored pins and clustering (334 LOC)
  - `ChassisReservationDialog.tsx` — Reservation workflow (316 LOC)

### src/components/dcli/ — DCLI Vendor Implementation (Most Complete)
- **Purpose:** DCLI invoice lifecycle — upload, review, line-item tracking, auditing, dispute
- **LOC:** ~1,500 across 16 files
- **Salvage Value:** HIGH (serves as template for all vendors)
- **Logic Complexity:** HIGH — Multi-step invoice upload, line-item review with validation status, dispute workflow with reason tracking
- **Code Quality:** NEEDS-REFACTOR — Good logic but vendor-specific, should be generalized
- **Coupling:** MIXED — Business logic portable, Supabase queries locked-in
- **Test Coverage:** NONE
- **Recommendation:** Extract as the template for a generic `VendorInvoice` system. DCLI is the most complete vendor and should serve as the base for consolidating all 6 vendors.
- **Key Files to Save:**
  - `invoice/InvoiceUploadStep.tsx` — Most complete upload flow (465 LOC)
  - `DCLIInvoiceTracker.tsx` — Invoice tracking with filtering (431 LOC)
  - `invoice/InvoiceReviewStep.tsx` — Review workflow (296 LOC)

### src/components/ccm/ — CCM Vendor
- **Purpose:** CCM invoice management with Excel import and document upload
- **LOC:** ~2,500 across 42 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — Similar to DCLI but with Excel-specific parsing and document management
- **Code Quality:** NEEDS-REFACTOR — Heavily duplicated from DCLI pattern
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Merge unique CCM logic (Excel parsing, document upload) into the generic vendor abstraction.
- **Key Files to Save:**
  - `DocumentUpload.tsx` — Unique file handling logic (375 LOC)

### src/components/{trac,wccp,scspa,flexivan}/ — Other Vendors
- **Purpose:** Vendor-specific invoice management
- **LOC:** ~700-900 each, 7-9 files per vendor
- **Salvage Value:** LOW
- **Logic Complexity:** LOW — Many are minimal implementations or stubs (TRAC InvoiceTracker is 41 LOC, FLEXIVAN and SCSPA have basic upload flows only)
- **Code Quality:** REWRITE — Incomplete implementations that should be generated from the generic vendor abstraction
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Discard vendor-specific implementations. Build generic `<VendorDashboard>`, `<VendorInvoiceTracker>`, `<VendorInvoiceUpload>` components configured per vendor.

### src/components/ui/ — shadcn/ui Component Library
- **Purpose:** Reusable UI primitives (buttons, dialogs, forms, tables, etc.)
- **LOC:** 5,096 across 50 files
- **Salvage Value:** LOW (easily regenerable)
- **Logic Complexity:** LOW — Standard shadcn/ui components, mostly unchanged from generation
- **Code Quality:** REUSABLE — Community-maintained, well-tested upstream
- **Coupling:** PORTABLE — Works with any React + Tailwind project
- **Test Coverage:** NONE locally (tested upstream)
- **Recommendation:** Keep as-is. Can be regenerated with `npx shadcn@latest add`. Only `chart.tsx` (363 LOC) and `visual-editor.tsx` (343 LOC) have custom logic.

### src/components/yards/ — Yard Inventory Management
- **Purpose:** Yard inventory data views for port/terminal yards (POLA, JED)
- **LOC:** ~1,000 across 5+ files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — `YardInventoryDataView.tsx` (706 LOC) has inventory table filtering, Excel export, status calculations
- **Code Quality:** NEEDS-REFACTOR — Large monolithic component
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Keep `YardInventoryDataView.tsx` and decompose into smaller components.

### src/pages/ — Page Components
- **Purpose:** Route-level components connecting hooks to UI components
- **LOC:** 8,841 across 51 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — `ChassisDetail.tsx` (944 LOC) and `InvoiceLineDetails.tsx` (859 LOC) encode complex UI workflows with multiple data sources
- **Code Quality:** NEEDS-REFACTOR — Several pages over 400 LOC that should be decomposed into smaller components
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Keep key pages (`Dashboard.tsx`, `ChassisDetail.tsx`, `ChassisLocator.tsx`). Consolidate vendor pages into generic wrappers.
- **Key Files to Save:**
  - `ChassisDetail.tsx` — Complex detail view with tabs, maps, and utilization (944 LOC)
  - `Dashboard.tsx` — Fleet overview with KPIs and charts (316 LOC)
  - `ChassisLocator.tsx` — Responsive GPS tracking UI with mobile layout (204 LOC)

### src/integrations/supabase/ — Supabase Integration Layer
- **Purpose:** Client initialization, auto-generated TypeScript types
- **LOC:** 8,610 (mostly auto-generated `types.ts` at 8,594 lines)
- **Salvage Value:** MEDIUM (types encode full schema knowledge)
- **Logic Complexity:** LOW — Client init is boilerplate; types are auto-generated by Supabase CLI
- **Code Quality:** REUSABLE
- **Coupling:** LOCKED-IN to Supabase
- **Test Coverage:** NONE
- **Recommendation:** Keep `types.ts` as schema documentation (regenerable via `supabase gen types`). Rewrite `client.ts` to use environment variables instead of hardcoded keys.

### src/lib/ — Library Utilities
- **Purpose:** Invoice upload orchestration, file storage management, Google Maps script loading
- **LOC:** 381 across 4 files
- **Salvage Value:** HIGH
- **Logic Complexity:** MEDIUM — `invoiceStorage.ts` (275 LOC) has comprehensive file lifecycle management (upload, folder management, attachment tracking)
- **Code Quality:** REUSABLE
- **Coupling:** LOCKED-IN to Supabase Storage
- **Test Coverage:** NONE
- **Recommendation:** Keep and add tests. These encode important upload/storage patterns.
- **Key Files to Save:**
  - `invoiceStorage.ts` — Invoice file lifecycle management (275 LOC)
  - `invoiceClient.ts` — Upload orchestration

### src/utils/ — Utility Functions
- **Purpose:** Date conversion, Excel serial date handling, navigation helpers
- **LOC:** 211 across 3 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** LOW — `dateUtils.ts` handles Excel-to-JS date conversion, `navigationHelpers.ts` maps routes to titles
- **Code Quality:** REUSABLE
- **Coupling:** PORTABLE
- **Test Coverage:** NONE
- **Recommendation:** Keep. `excelParser.ts` generates mock data and should be replaced.

### src/components/tms/ — TMS Integration UI
- **Purpose:** MercuryGate TMS data visualization, CSV upload, detail views
- **LOC:** ~700 across 5 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — `TMSDetailView.tsx` (337 LOC) shows TMS record details with invoice cross-referencing
- **Code Quality:** REUSABLE
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Keep for TMS workflow patterns.

---

## Security Findings

| # | Finding | Severity | Location | Action |
|---|---------|----------|----------|--------|
| 1 | All 18 edge functions have JWT verification disabled (10 explicit in config.toml, 8 not listed at all) | CRITICAL | `supabase/config.toml` | Enable `verify_jwt = true` on all functions; add missing functions to config |
| 2 | All database tables have permissive RLS: `USING (true)` on every policy | CRITICAL | Multiple migration files (e.g., `20250922205823_*.sql`) | Rewrite all RLS policies with org/user scoping |
| 3 | `get-maps-key` endpoint exposes Google Maps API key to anonymous callers | CRITICAL | `supabase/functions/get-maps-key/index.ts:22` | Remove endpoint or require JWT auth |
| 4 | `xlsx` npm package has unpatched CVEs (CVE-2023-30533, CVE-2024-22363) | CRITICAL | `package.json:66` | Replace with ExcelJS or SheetJS CDN |
| 5 | Wildcard CORS (`Access-Control-Allow-Origin: *`) on all 18 edge functions | HIGH | All `supabase/functions/*/index.ts` | Restrict to deployment domain(s) |
| 6 | 14 of 18 edge functions use service role key without JWT gate | HIGH | Multiple edge functions (e.g., `chat-vendors/index.ts:25`) | Validate caller JWT before using service role |
| 7 | Public storage buckets with permissive policies (invoices, ccm-invoices, gps-blackberry-radar) | HIGH | Multiple migration files | Set `public = false`, restrict to authenticated users |
| 8 | No authentication guards on any of 40+ frontend routes | HIGH | `src/App.tsx` | Add `PrivateRoute` wrapper |
| 9 | Hardcoded Supabase URL and anon key in client source code | MEDIUM | `src/integrations/supabase/client.ts:5-6` | Move to `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars |
| 10 | Fake auth check in `refreshLocation` (only checks header format, not JWT validity) | MEDIUM | `supabase/functions/refreshLocation/index.ts:17-20` | Use `supabase.auth.getUser()` or enable `verify_jwt` |
| 11 | TypeScript strict mode completely disabled (no strictNullChecks, no noImplicitAny) | MEDIUM | `tsconfig.json`, `tsconfig.app.json` | Enable `strict: true` incrementally |
| 12 | Stack traces exposed in error responses to clients | MEDIUM | `supabase/functions/extract_invoice_data/index.ts:285-293` | Return generic error messages |
| 13 | No rate limiting on any edge functions | MEDIUM | All edge functions | Implement per-user rate limiting |
| 14 | `dangerouslySetInnerHTML` usage in chart component | LOW | `src/components/ui/chart.tsx:79` | Verify input is developer-controlled only |
| 15 | 169 console.log statements in production code | LOW | Throughout `src/` and `supabase/functions/` | Remove or replace with structured logging |
| 16 | `.gitignore` missing coverage for `.env.production`, `.env.staging`, `.npmrc` | LOW | `.gitignore` | Add `.env*` and `.npmrc` patterns |

**No .env files were found committed in git history** (verified via `git log --all --full-history -- "*.env"`).

**Combined risk assessment:** The combination of disabled JWT + universally permissive RLS + service role key in edge functions + wildcard CORS means the **entire database is effectively publicly readable and writable** by anyone who knows the Supabase project URL (which is hardcoded in the client bundle). This represents an **existential security risk** requiring immediate remediation.

---

## Revival Roadmap

### Phase 1: Critical Security (Week 1)
- [ ] Enable `verify_jwt = true` on all 18 edge functions in `config.toml`
- [ ] Rewrite all RLS policies with proper org/user scoping (replace `USING(true)`)
- [ ] Remove or auth-gate `get-maps-key` endpoint
- [ ] Replace `xlsx` npm package with ExcelJS or SheetJS CDN version
- [ ] Restrict CORS to specific deployment domain(s)
- [ ] Move Supabase credentials to environment variables
- [ ] Set storage buckets to `public = false`
- [ ] Add frontend `PrivateRoute` authentication wrapper

### Phase 2: Code Quality (Weeks 2-3)
- [ ] Create generic `VendorInvoice` abstraction consolidating 6 vendor implementations
- [ ] Complete stub hooks (useFLEXIVANData, useTRACData, useWCCPData)
- [ ] Create shared edge function base handler (auth + CORS + error handling)
- [ ] Remove 169 console.log statements
- [ ] Fix 124 `any` type usages
- [ ] Enable TypeScript strict mode incrementally
- [ ] Add error boundaries to React component tree
- [ ] Squash 60 migration files into single baseline
- [ ] Add input validation to all edge functions
- [ ] Decompose large files (ChassisDetail 944 LOC, InvoiceLineDetails 859 LOC)

### Phase 3: Infrastructure & Testing (Weeks 3-4)
- [ ] Set up Vitest + React Testing Library
- [ ] Add unit tests for core hooks (useUnifiedGpsData, useInvoiceUpload)
- [ ] Add integration tests for edge functions
- [ ] Set up CI/CD pipeline (GitHub Actions: lint, type-check, test, build)
- [ ] Add Docker configuration for local development
- [ ] Create `.env.example` documenting required environment variables
- [ ] Implement structured logging (replace console.log)

### Phase 4: Dependency Upgrades (Weeks 5+)
- [ ] Upgrade Vite 5 → 7 (requires Node 20.19+)
- [ ] Upgrade Tailwind 3 → 4 (CSS-first config overhaul)
- [ ] Upgrade React 18 → 19 (Activity API, concurrent features)
- [ ] Migrate react-router-dom v6 → react-router v7
- [ ] Replace next-themes with custom ThemeProvider
- [ ] Add monitoring/error tracking (Sentry or similar)

---

## Files Worth Saving (Priority List)

1. `supabase/functions/_shared/blackberry.ts` — ES256 JWT signing + OAuth token caching for BlackBerry Radar API (195 LOC of crypto); extremely hard to recreate
2. `src/hooks/useUnifiedGpsData.ts` — Multi-provider GPS aggregation with dedup and enrichment; core business logic
3. `supabase/functions/extract-dcli-invoice/index.ts` — Most complete invoice extractor with XLSX column mapping (274 LOC); template for all vendors
4. `src/components/chassis/UtilizationTab.tsx` — Full utilization analytics engine with KPI derivation (699 LOC)
5. SQL migration with `validate_dcli_invoice()` — PL/pgSQL confidence-scored TMS matching algorithm
6. SQL migration with `match_invoice_lines()` — pgvector semantic search function
7. `supabase/functions/chat-vendors/index.ts` — Semantic search over invoice data with pgvector embeddings
8. `src/hooks/useInvoiceUpload.ts` — Multi-step upload orchestration with error recovery
9. `src/lib/invoiceStorage.ts` — Comprehensive invoice file lifecycle management (275 LOC)
10. `supabase/functions/_shared/db.ts` — Haversine distance calculation, asset CRUD, location management
11. `supabase/functions/extract_invoice_data/index.ts` — AI-based invoice extraction using Gemini 2.5 Flash (426 LOC)
12. `supabase/functions/extract-csv/index.ts` — TMS CSV ingestion with 40+ typed column mapping
13. `src/hooks/useDCLIData.ts` — Most complete vendor data hook with dashboard metrics calculation
14. `src/components/chassis/ChassisMapView.tsx` — Map visualization with colored pins and clustering (334 LOC)
15. `src/pages/ChassisDetail.tsx` — Complex detail view with tabs, maps, utilization (944 LOC)
16. `src/components/dcli/invoice/InvoiceUploadStep.tsx` — Most complete upload UI workflow (465 LOC)
17. `supabase/functions/_shared/geocode.ts` — Google Maps reverse geocoding abstraction
18. `supabase/functions/syncAllAssets/index.ts` — Background sync pattern for external APIs
19. `src/integrations/supabase/types.ts` — Auto-generated but encodes full database schema (8,594 LOC)
20. `src/utils/dateUtils.ts` — Excel serial date conversion handling

## Files to Discard

1. `src/components/{trac,wccp,scspa,flexivan}/` — Incomplete vendor implementations; rebuild from generic abstraction
2. `src/hooks/useFLEXIVANData.ts` — Stub with no real data fetching logic
3. `src/hooks/useTRACData.ts` — Stub with no real data fetching logic
4. `src/hooks/useWCCPData.ts` — Stub with no real data fetching logic
5. `src/utils/excelParser.ts` — Generates mock/synthetic data, not a real parser
6. `src/components/ui/visual-editor.tsx` — Custom visual editor (343 LOC) of unclear utility
7. `supabase/functions/get-maps-key/index.ts` — Security risk; API key should never be exposed this way
8. `src/components/advanced/ModularBlocks.tsx` — UI experiment with no integration (370 LOC)
9. Individual vendor page wrappers (`src/pages/vendors/*.tsx`) — Thin wrappers that should be a single generic page
10. 60 separate migration files — Squash into single baseline before revival

---

## Appendix: Key Metrics

| Metric | Value |
|--------|-------|
| Total files (excl. node_modules, .git) | 376 |
| Total LOC (TS/TSX/JS/SQL/CSS) | ~50,609 |
| TypeScript/TSX files | 291 |
| SQL migration files | 60 |
| Edge functions | 18 (+ 6 shared utilities) |
| React components | ~187 |
| Custom hooks | 15 |
| Pages/routes | 51 |
| UI library components (shadcn/ui) | 50 |
| Vendor implementations | 6 (DCLI, CCM, TRAC, FLEXIVAN, WCCP, SCSPA) |
| GPS providers | 3 (Fleetlocate, Anytrek, Fleetview) + BlackBerry Radar |
| Test files | 0 |
| TODO/FIXME/HACK comments | 3 |
| console.log statements | 169 |
| `any` type usages (excl. types.ts) | 124 |
| Files over 500 LOC | 6 |
| try/catch blocks | 93 |
| Security findings — CRITICAL | 4 |
| Security findings — HIGH | 4 |
| Security findings — MEDIUM | 5 |
| Security findings — LOW | 3 |
| Dependencies needing major updates | 5 |
| Dependencies with known CVEs | 1 (xlsx) |
| Stub/incomplete implementations | 3 hooks + 4 vendor modules |
| Development timespan | 14 days (Nov 4-18, 2025) |
| Total git commits | ~43 |
| First commit | 2025-11-04 |
| Last development commit | 2025-11-18 |
