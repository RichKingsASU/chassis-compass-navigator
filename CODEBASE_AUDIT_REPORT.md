# CODEBASE AUDIT REPORT

**Project:** Chassis Compass Navigator (vite_react_shadcn_ts)
**Last Active:** 2025-11-18
**First Commit:** 2025-11-04
**Primary Stack:** TypeScript, React 18, Vite 5, Supabase (PostgreSQL + Edge Functions), Tailwind CSS 3, shadcn/ui
**Total Files:** 406 | **Total LOC:** ~50,949 (42,443 src + 3,637 edge functions + 4,869 SQL migrations)
**Origin:** Lovable.dev AI-generated project

---

## Executive Summary

Chassis Compass Navigator is a **fleet management and vendor invoice processing platform** built over a 2-week sprint (Nov 4-18, 2025) using the Lovable.dev AI code generation platform. The application aggregates real-time GPS data from multiple tracking providers (Fleetlocate, Anytrek, Fleetview, BlackBerry Radar), manages chassis inventory, and handles multi-vendor invoice ingestion and validation for 6 chassis leasing vendors (DCLI, CCM, TRAC, FLEXIVAN, WCCP, SCSPA). It also integrates TMS (Transportation Management System) data for invoice-to-shipment matching with confidence scoring, and provides AI-powered semantic search over invoice data via pgvector embeddings.

The codebase is in a **prototype/MVP state** with significant domain logic worth preserving, but it suffers from critical security gaps (disabled JWT verification on all edge functions, wildcard CORS, overly permissive RLS policies), zero test coverage, heavy code duplication across vendor implementations, and several outdated or vulnerable dependencies. The architecture is sound (React Query + Supabase + Edge Functions), but the code quality reflects rapid AI-assisted generation rather than production-grade engineering.

Revival is feasible. The core business logic — GPS data unification, invoice extraction pipelines, TMS matching algorithms, and BlackBerry Radar integration — encodes substantial domain knowledge that would be expensive to recreate. However, the security posture requires immediate remediation before any production deployment, and the vendor-specific code duplication should be consolidated.

**Overall Revival Verdict:** PARTIAL — Core business logic is salvageable; security, testing, and vendor abstraction need significant work.

---

## Dependency Health

**Rating:** YELLOW — Needs Updates (major version gaps in React, Vite, Tailwind, React Router; critical vulnerability in xlsx)

| Dependency | Pinned Version | Latest Known | Status |
|-----------|---------------|-------------|--------|
| react | ^18.3.1 | 19.2.4 | Outdated (1 major) |
| react-dom | ^18.3.1 | 19.2.4 | Outdated (1 major) |
| react-router-dom | ^6.26.2 | 7.13.1 | Outdated (1 major, package consolidated into `react-router`) |
| vite | ^5.4.1 | 7.3.1 | Outdated (2 major) |
| tailwindcss | ^3.4.11 | 4.2.1 | Outdated (1 major, complete config overhaul in v4) |
| @supabase/supabase-js | ^2.57.4 | 2.97.0 | OK (same major, minor updates) |
| @tanstack/react-query | ^5.56.2 | 5.90.21 | OK (same major) |
| typescript | ^5.5.3 | 5.7+ | OK (minor update) |
| xlsx | ^0.18.5 | 0.18.5 (npm abandoned) | CRITICAL — Known CVEs (CVE-2023-30533 Prototype Pollution, CVE-2024-22363 ReDoS). npm package no longer maintained; fixes only on SheetJS CDN |
| mapbox-gl | ^3.15.0 | 3.18.1 | OK (minor update) |
| @react-google-maps/api | ^2.20.7 | 2.x | OK |
| next-themes | ^0.3.0 | 0.4.6 | Misuse — designed for Next.js, not Vite/SPA. Should use custom ThemeProvider |
| recharts | ^2.12.7 | 2.x | OK |
| lucide-react | ^0.462.0 | 0.470+ | OK (minor) |
| zod | ^3.23.8 | 3.x | OK |
| react-hook-form | ^7.53.0 | 7.x | OK |
| lovable-tagger | ^1.1.7 | N/A | Dev-only, Lovable platform specific |
| eslint | ^9.9.0 | 9.x | OK |

**Action Items:**
1. **CRITICAL:** Replace `xlsx` (npm) with ExcelJS or install SheetJS from CDN (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) to fix CVE-2023-30533 and CVE-2024-22363
2. **HIGH:** Upgrade Vite 5 → 7 (breaking changes in config, requires Node 20.19+)
3. **HIGH:** Upgrade Tailwind 3 → 4 (complete configuration overhaul, CSS-first config)
4. **MEDIUM:** Upgrade React 18 → 19 (concurrent features, Server Components support)
5. **MEDIUM:** Migrate react-router-dom v6 → react-router v7 (package consolidation)
6. **LOW:** Replace `next-themes` with a custom ThemeProvider for Vite/SPA apps
7. **LOW:** Update @supabase/supabase-js to latest 2.97.x for bug fixes

---

## Architecture Assessment

**Pattern:** Single-Page Application (SPA) with serverless backend functions (BaaS pattern via Supabase)

**Diagram:**
```
                        ┌─────────────────────────────────────────────────────────────┐
                        │                    FRONTEND (React SPA)                      │
                        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
                        │  │Dashboard │  │ Chassis  │  │  Vendor  │  │   GPS    │    │
                        │  │  Page    │  │ Mgmt/Map │  │ Invoices │  │ Overview │    │
                        │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
                        │       │              │              │              │          │
                        │  ┌────┴──────────────┴──────────────┴──────────────┴────┐    │
                        │  │          React Query (TanStack) + Custom Hooks       │    │
                        │  │  useDCLIData | useUnifiedGpsData | useInvoiceUpload  │    │
                        │  └────────────────────────┬────────────────────────────┘    │
                        └───────────────────────────┼──────────────────────────────────┘
                                                    │ HTTPS
                        ┌───────────────────────────┼──────────────────────────────────┐
                        │                    SUPABASE PLATFORM                          │
                        │                           │                                   │
                        │  ┌────────────────────────┴────────────────────────────┐     │
                        │  │              Supabase JS Client SDK                  │     │
                        │  │         (Auth, Realtime, Storage, PostgREST)         │     │
                        │  └───┬──────────┬──────────────┬───────────────────────┘     │
                        │      │          │              │                              │
                        │  ┌───┴───┐  ┌───┴────┐  ┌─────┴──────────────────────┐      │
                        │  │ Auth  │  │Storage │  │    PostgreSQL Database      │      │
                        │  │(anon) │  │Buckets │  │  ┌─────────────────────┐    │      │
                        │  └───────┘  │invoices│  │  │ chassis_master      │    │      │
                        │             │wccp-inv│  │  │ dcli_invoice_staging│    │      │
                        │             └────────┘  │  │ anytrek_data        │    │      │
                        │                         │  │ fleetlocate_stg     │    │      │
                        │  ┌──────────────────┐   │  │ mg_tms              │    │      │
                        │  │  Edge Functions   │   │  │ asset_locations     │    │      │
                        │  │  (Deno Runtime)   │   │  │ pgvector embeddings│    │      │
                        │  │                   │   │  └─────────────────────┘    │      │
                        │  │ extract-dcli-inv  │   └────────────────────────────┘      │
                        │  │ extract-ccm-inv   │                                       │
                        │  │ syncAllAssets     │──── BlackBerry Radar API               │
                        │  │ chat-vendors      │──── Lovable AI (Embeddings)            │
                        │  │ getDistance        │──── Google Maps API                    │
                        │  │ standardize-gps   │──── Google Maps Geocoding              │
                        │  └──────────────────┘                                        │
                        └──────────────────────────────────────────────────────────────┘
```

**Strengths:**
- Clean separation between frontend (React Query hooks) and backend (Supabase Edge Functions)
- Multi-provider GPS unification is well-architected (3 providers → unified interface)
- Invoice extraction pipeline is modular (one function per vendor)
- React Query provides excellent caching, auto-refresh, and loading states
- shadcn/ui provides consistent, accessible component library
- pgvector for semantic search is a modern, scalable choice

**Weaknesses:**
- No authentication enforcement on frontend routes or backend functions
- Heavy vendor-specific code duplication (6 near-identical invoice pipelines)
- 3 out of 6 vendor data hooks are stubs (FLEXIVAN, TRAC, WCCP)
- Tight coupling to Supabase (switching BaaS would require rewriting all hooks)
- No error boundaries or global error handling strategy
- No CI/CD pipeline, no Docker configuration, no deployment automation
- TypeScript strictness is low (noImplicitAny: false, strictNullChecks: false)

---

## Module-by-Module Salvage Assessment

### src/hooks/ — Custom React Hooks
- **Purpose:** Data fetching, search, uploads, GPS unification
- **LOC:** 1,339 across 15 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — useUnifiedGpsData (multi-provider aggregation), useInvoiceUpload (multi-step orchestration), useDCLIData (metrics calculation)
- **Code Quality:** NEEDS-REFACTOR — 3 hooks are stubs (useFLEXIVANData, useTRACData, useWCCPData), remainder is functional
- **Coupling:** LOCKED-IN to Supabase (all hooks use Supabase client directly)
- **Test Coverage:** NONE
- **Recommendation:** Keep and refactor. Extract Supabase queries into a data access layer so hooks contain only business logic. Complete the stub implementations. Add unit tests for useUnifiedGpsData and useInvoiceUpload.
- **Key Files to Save:**
  - `useUnifiedGpsData.ts` — Core GPS aggregation logic
  - `useInvoiceUpload.ts` — Multi-step upload orchestration
  - `useDCLIData.ts` — Most complete vendor data hook with metrics
  - `useChassisSearch.ts` — Reusable search/filter pattern

### supabase/functions/ — Edge Functions
- **Purpose:** Invoice extraction, GPS sync, asset management, AI search
- **LOC:** 3,637 across 24 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — BlackBerry JWT/OAuth (blackberry.ts), invoice parsing with column mapping, TMS CSV ingestion, semantic search with embeddings
- **Code Quality:** NEEDS-REFACTOR — Duplicated patterns across 6 invoice extractors, wildcard CORS, disabled JWT verification
- **Coupling:** LOCKED-IN to Deno runtime + Supabase SDK + external APIs (BlackBerry, Google Maps, Lovable AI)
- **Test Coverage:** NONE
- **Recommendation:** Keep all functions. Create a shared invoice extraction base function. Fix CORS and JWT verification. Add input validation. Abstract the _shared/ utilities.
- **Key Files to Save:**
  - `_shared/blackberry.ts` — Complex OAuth + ES256 JWT signing (195 lines of crypto)
  - `_shared/db.ts` — Haversine distance, asset CRUD, location management
  - `_shared/geocode.ts` — Google Maps reverse geocoding abstraction
  - `extract-dcli-invoice/index.ts` — Most complete invoice extractor (template for others)
  - `chat-vendors/index.ts` — Semantic search with pgvector
  - `syncAllAssets/index.ts` — Background sync pattern for external APIs

### supabase/migrations/ — Database Schema
- **Purpose:** PostgreSQL schema, RLS policies, PL/pgSQL functions
- **LOC:** 4,869 across 60 files
- **Salvage Value:** HIGH
- **Logic Complexity:** HIGH — validate_dcli_invoice() confidence scoring, match_invoice_lines() pgvector search, complex table relationships
- **Code Quality:** NEEDS-REFACTOR — RLS policies are all permissive (USING(true)), some migrations are incremental patches
- **Coupling:** LOCKED-IN to PostgreSQL + Supabase
- **Test Coverage:** NONE
- **Recommendation:** Keep and consolidate. Squash 60 migration files into a single baseline migration. Rewrite RLS policies with proper org/user scoping. The validate_dcli_invoice() function encodes critical business logic.
- **Key Files to Save:**
  - Migration with `validate_dcli_invoice()` PL/pgSQL function
  - Migration with `match_invoice_lines()` pgvector function
  - Migration creating `chassis_master`, `dcli_invoice_staging`, `mg_tms` tables
  - Migration creating storage bucket policies (need rewriting)

### src/components/chassis/ — Chassis Management UI
- **Purpose:** GPS map visualization, utilization analytics, reservation management
- **LOC:** ~3,200 across 11 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — Map rendering with clustering, data freshness indicators, reservation dialogs
- **Code Quality:** REUSABLE — Well-structured components with clear responsibilities
- **Coupling:** MIXED — Uses Google Maps API and Mapbox, could be adapted
- **Test Coverage:** NONE
- **Recommendation:** Keep as-is. The ChassisMapView and UtilizationTab contain useful visualization patterns.
- **Key Files to Save:**
  - `ChassisMapView.tsx` — Map with colored pins and clustering (334 LOC)
  - `UtilizationTab.tsx` — Analytics dashboard (699 LOC)
  - `ChassisReservationDialog.tsx` — Reservation workflow (316 LOC)

### src/components/dcli/ — DCLI Vendor (Most Complete)
- **Purpose:** DCLI invoice management — upload, review, tracking, auditing
- **LOC:** ~1,500 across 16 files
- **Salvage Value:** HIGH (template for all vendors)
- **Logic Complexity:** HIGH — Multi-step invoice upload, line-item review, dispute workflow
- **Code Quality:** NEEDS-REFACTOR — Good logic but should be generalized
- **Coupling:** MIXED — Business logic is portable, Supabase queries are locked-in
- **Test Coverage:** NONE
- **Recommendation:** Extract as the template for a generic vendor invoice system. The DCLI implementation is the most complete and should serve as the base for abstracting all 6 vendors into a single configurable component.
- **Key Files to Save:**
  - `invoice/InvoiceUploadStep.tsx` — Most complete upload flow (465 LOC)
  - `DCLIInvoiceTracker.tsx` — Invoice tracking with filtering (431 LOC)
  - `invoice/InvoiceReviewStep.tsx` — Review workflow (296 LOC)

### src/components/ccm/ — CCM Vendor
- **Purpose:** CCM invoice management with Excel import and document upload
- **LOC:** ~2,500 across 42 files (includes sub-components)
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — Similar to DCLI but with Excel-specific parsing
- **Code Quality:** NEEDS-REFACTOR — Heavily duplicated from DCLI pattern
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Merge unique CCM logic into the generic vendor abstraction. The DocumentUpload.tsx (375 LOC) has unique file handling worth preserving.

### src/components/{trac,wccp,scspa,flexivan}/ — Other Vendors
- **Purpose:** Vendor-specific invoice management
- **LOC:** ~700-900 each, 7-9 files per vendor
- **Salvage Value:** LOW-MEDIUM
- **Logic Complexity:** LOW — Many are minimal implementations or stubs (TRAC InvoiceTracker is 41 LOC)
- **Code Quality:** REWRITE — Incomplete implementations that should be generated from the generic vendor abstraction
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Discard vendor-specific implementations. Build generic `<VendorDashboard>`, `<VendorInvoiceTracker>`, `<VendorInvoiceUpload>` components configured per vendor.

### src/components/ui/ — shadcn/ui Component Library
- **Purpose:** Reusable UI primitives (buttons, dialogs, forms, tables, etc.)
- **LOC:** 5,096 across 50 files
- **Salvage Value:** LOW (regenerable)
- **Logic Complexity:** LOW — Standard shadcn/ui components, mostly unchanged from generation
- **Code Quality:** REUSABLE — Well-maintained community components
- **Coupling:** PORTABLE — Works with any React project using Tailwind
- **Test Coverage:** NONE (upstream components are tested)
- **Recommendation:** Keep as-is. These are standard shadcn/ui components that can be regenerated with `npx shadcn@latest add`. The custom `visual-editor.tsx` (343 LOC) and `chart.tsx` (363 LOC) have custom logic worth reviewing.

### src/integrations/supabase/ — Supabase Integration Layer
- **Purpose:** Client initialization, auto-generated types
- **LOC:** ~8,700 (mostly auto-generated types.ts at 8,594 lines)
- **Salvage Value:** MEDIUM (types encode schema knowledge)
- **Logic Complexity:** LOW — Client init is boilerplate; types are auto-generated
- **Code Quality:** REUSABLE — Standard Supabase pattern
- **Coupling:** LOCKED-IN to Supabase
- **Test Coverage:** NONE
- **Recommendation:** Keep types.ts as schema documentation. Regenerate client.ts to use environment variables instead of hardcoded keys.

### src/lib/ — Library Utilities
- **Purpose:** Invoice upload orchestration, file storage management, Google Maps loading
- **LOC:** ~500 across 4 files
- **Salvage Value:** HIGH
- **Logic Complexity:** MEDIUM — invoiceStorage.ts (275 LOC) has comprehensive file management
- **Code Quality:** REUSABLE
- **Coupling:** LOCKED-IN to Supabase Storage
- **Test Coverage:** NONE
- **Recommendation:** Keep and add tests. invoiceStorage.ts and invoiceClient.ts encode important upload/storage patterns.
- **Key Files to Save:**
  - `invoiceStorage.ts` — File lifecycle management (275 LOC)
  - `invoiceClient.ts` — Upload orchestration

### src/pages/ — Page Components
- **Purpose:** Route-level components connecting hooks to UI
- **LOC:** ~4,000 across 51 files
- **Salvage Value:** MEDIUM
- **Logic Complexity:** MEDIUM — ChassisDetail.tsx (944 LOC) and InvoiceLineDetails pages encode complex UI workflows
- **Code Quality:** NEEDS-REFACTOR — Several pages over 400 LOC, should be decomposed
- **Coupling:** MIXED
- **Test Coverage:** NONE
- **Recommendation:** Keep Dashboard.tsx, ChassisManagement.tsx, ChassisLocator.tsx. Consolidate vendor pages into generic wrappers.
- **Key Files to Save:**
  - `ChassisDetail.tsx` — Complex detail view (944 LOC)
  - `Dashboard.tsx` — Fleet overview with KPIs (316 LOC)
  - `ChassisLocator.tsx` — GPS tracking UI with responsive layout

---

## Security Findings

| # | Finding | Severity | Location | Action |
|---|---------|----------|----------|--------|
| 1 | All 10 edge functions have JWT verification disabled | CRITICAL | `supabase/config.toml` | Enable `verify_jwt = true` on all functions |
| 2 | Wildcard CORS (`Access-Control-Allow-Origin: *`) on all edge functions | CRITICAL | All `supabase/functions/*/index.ts` | Restrict to specific domain(s) |
| 3 | Google Maps API key exposed via unauthenticated endpoint | CRITICAL | `supabase/functions/get-maps-key/index.ts` | Remove endpoint or require auth |
| 4 | RLS policies are all permissive (`FOR ALL USING (true)`) | HIGH | `supabase/migrations/20250922205823_*.sql` | Implement org/user-scoped RLS |
| 5 | Public storage bucket with no access control | HIGH | `supabase/migrations/20240409_create_invoices_bucket.sql` | Restrict by user/org |
| 6 | No authentication guards on any frontend routes | HIGH | `src/App.tsx` | Add PrivateRoute wrapper |
| 7 | Hardcoded Supabase anon key in client code | MEDIUM | `src/integrations/supabase/client.ts:5-6` | Move to environment variables (VITE_SUPABASE_KEY) |
| 8 | JWT token in commented SQL migration | MEDIUM | `supabase/migrations/20251022221928_*.sql:41` | Remove from migration file |
| 9 | No input validation on file paths in invoice extraction | MEDIUM | `supabase/functions/extract_invoice_data/index.ts:42-57` | Validate/sanitize paths |
| 10 | Stack traces exposed in error responses | MEDIUM | `supabase/functions/extract_invoice_data/index.ts:285-293` | Return generic errors to client |
| 11 | No rate limiting on any edge functions | MEDIUM | All edge functions | Implement per-user rate limiting |
| 12 | `dangerouslySetInnerHTML` usage | LOW | `src/components/ui/chart.tsx` | Verify input sanitization |
| 13 | 101 console.log statements in production code | LOW | Throughout `src/` | Remove or replace with proper logging |
| 14 | `xlsx` npm package has known CVEs | CRITICAL | `package.json` | Replace with ExcelJS or update via SheetJS CDN |

**No .env files were ever committed to the repository** (verified via git history).

---

## Revival Roadmap

### Phase 1: Quick Wins (Week 1)
- [ ] Fix CRITICAL security: Enable JWT verification on all edge functions
- [ ] Fix CRITICAL security: Replace wildcard CORS with specific domain
- [ ] Fix CRITICAL security: Remove `get-maps-key` endpoint or add auth
- [ ] Replace `xlsx` npm package with ExcelJS or SheetJS CDN version
- [ ] Move hardcoded Supabase keys to environment variables
- [ ] Remove all 101 console.log statements
- [ ] Add frontend authentication guard (PrivateRoute wrapper)
- [ ] Add `.env.example` file documenting required environment variables

### Phase 2: Refactor (Weeks 2-3)
- [ ] Rewrite RLS policies with proper org/user scoping
- [ ] Restrict storage bucket access policies
- [ ] Create generic `VendorInvoice` abstraction consolidating 6 vendor implementations
- [ ] Complete stub hooks (useFLEXIVANData, useTRACData, useWCCPData)
- [ ] Create shared invoice extraction base function for edge functions
- [ ] Add input validation to all edge functions
- [ ] Add error boundaries to React component tree
- [ ] Squash 60 migration files into baseline migration
- [ ] Increase TypeScript strictness (enable strictNullChecks, noImplicitAny)
- [ ] Fix 167 `any` type usages

### Phase 3: Rebuild (Weeks 4+)
- [ ] Upgrade Vite 5 → 7
- [ ] Upgrade Tailwind 3 → 4 (config overhaul)
- [ ] Upgrade React 18 → 19
- [ ] Migrate react-router-dom v6 → react-router v7
- [ ] Replace next-themes with custom ThemeProvider
- [ ] Add comprehensive test suite (Vitest + React Testing Library)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add Docker configuration for local development
- [ ] Implement proper logging (structured JSON logs)
- [ ] Add monitoring and error tracking (Sentry or similar)

### Recommended Modern Stack Upgrades
| Current | Recommended | Reason |
|---------|------------|--------|
| Vite 5 | Vite 7 (or 8 beta with Rolldown) | 5x faster builds, modern tooling |
| Tailwind 3 | Tailwind 4 | CSS-first config, 100x faster incremental builds |
| React 18 | React 19 | Activity API, concurrent features |
| react-router-dom 6 | react-router 7 | Package consolidation, SSR support |
| xlsx 0.18.5 | ExcelJS or SheetJS CDN 0.20.3 | Fix CVEs, actively maintained |
| next-themes | Custom ThemeProvider | Proper Vite/SPA support |
| No testing | Vitest + React Testing Library | Modern, Vite-native testing |
| No CI/CD | GitHub Actions | Automated linting, testing, deployment |

---

## Files Worth Saving (Priority List)

1. **`supabase/functions/_shared/blackberry.ts`** — Complex OAuth + ES256 JWT signing for BlackBerry Radar API (195 LOC of crypto); extremely hard to recreate
2. **`src/hooks/useUnifiedGpsData.ts`** — Multi-provider GPS aggregation with deduplication and enrichment; core business logic
3. **`supabase/functions/extract-dcli-invoice/index.ts`** — Most complete invoice extraction with column mapping; template for all vendors (274 LOC)
4. **`supabase/functions/chat-vendors/index.ts`** — Semantic search over invoice data with pgvector embeddings
5. **`src/hooks/useInvoiceUpload.ts`** — Multi-step upload orchestration with error recovery
6. **`src/lib/invoiceStorage.ts`** — Comprehensive invoice file lifecycle management (275 LOC)
7. **`supabase/functions/_shared/db.ts`** — Haversine distance calculation, asset CRUD, location management
8. **`src/hooks/useDCLIData.ts`** — Most complete vendor data hook with dashboard metrics calculation
9. **`src/integrations/supabase/types.ts`** — Auto-generated but encodes full database schema knowledge (8,594 LOC)
10. **`supabase/functions/syncAllAssets/index.ts`** — Background sync pattern for external APIs
11. **`src/components/chassis/UtilizationTab.tsx`** — Complex analytics dashboard (699 LOC)
12. **`src/components/chassis/ChassisMapView.tsx`** — Map visualization with clustering (334 LOC)
13. **`src/pages/ChassisDetail.tsx`** — Complex detail view with multiple data sources (944 LOC)
14. **`src/components/dcli/invoice/InvoiceUploadStep.tsx`** — Most complete upload UI workflow (465 LOC)
15. **`supabase/functions/_shared/geocode.ts`** — Google Maps reverse geocoding abstraction
16. **SQL migration with `validate_dcli_invoice()`** — PL/pgSQL confidence-scored TMS matching
17. **SQL migration with `match_invoice_lines()`** — pgvector semantic search function
18. **`src/utils/dateUtils.ts`** — Excel serial date conversion handling
19. **`supabase/functions/extract-csv/index.ts`** — TMS CSV ingestion with 40+ column type casting
20. **`src/components/invoices/`** — Shared invoice components (DisputeHistory, LineActions, TroubleshootPanel)

## Files to Discard

1. **`src/components/{trac,wccp,scspa,flexivan}/`** — Incomplete vendor implementations; rebuild from generic abstraction
2. **`src/hooks/useFLEXIVANData.ts`** — Stub with no data fetching logic
3. **`src/hooks/useTRACData.ts`** — Stub with no data fetching logic
4. **`src/hooks/useWCCPData.ts`** — Stub with no data fetching logic
5. **`src/utils/excelParser.ts`** — Generates mock/synthetic data, not a real parser
6. **`src/components/ui/visual-editor.tsx`** — Custom visual editor (343 LOC) of unclear utility
7. **`supabase/functions/get-maps-key/index.ts`** — Security risk; API key should never be exposed this way
8. **`src/components/advanced/ModularBlocks.tsx`** — Appears to be a UI experiment (370 LOC)
9. **Individual vendor page wrappers** (`src/pages/vendors/*.tsx`) — Thin wrappers that should be a single generic page
10. **60 separate migration files** — Squash into single baseline before revival

---

## Appendix: Key Metrics Summary

| Metric | Value |
|--------|-------|
| Total files (excluding .git) | 406 |
| Total LOC | ~50,949 |
| TypeScript/TSX files | 289 |
| SQL migration files | 60 |
| Edge functions | 18 (+ 6 shared utilities) |
| React components | 187 |
| Custom hooks | 15 |
| Pages | 51 |
| UI library components | 50 (shadcn/ui) |
| Vendor implementations | 6 (DCLI, CCM, TRAC, FLEXIVAN, WCCP, SCSPA) |
| GPS providers | 3 (Fleetlocate, Anytrek, Fleetview) + BlackBerry Radar |
| Test files | 0 |
| TODO/FIXME comments | 3 |
| console.log statements | 101 |
| `any` type usages | 167 |
| Files over 300 LOC | 26 |
| Security findings (CRITICAL) | 4 |
| Security findings (HIGH) | 4 |
| Security findings (MEDIUM) | 5 |
| Dependencies needing major updates | 5 |
| Dependencies with known CVEs | 1 (xlsx) |
| Stub/incomplete implementations | 3 hooks + 4 vendor modules |
| Development timespan | 14 days (Nov 4-18, 2025) |
| Total commits | ~40 |
