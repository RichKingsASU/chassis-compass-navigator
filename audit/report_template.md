# Database Audit Report

> Fill in this template after running `.\audit\run_audit.ps1` and reviewing
> the CSVs in `audit/output/`. Nothing in this file changes the database;
> it is the human-readable plan that comes _out_ of the audit.

- **Database:** `<from 01_schema_inventory.csv / connection probe>`
- **Audited at:** `<YYYY-MM-DD HH:MM>`
- **Audited by:** `<name>`
- **DATABASE_URL host:** `<e.g. 127.0.0.1:54322 (local Supabase)>`

---

## 1. Headline summary

> 3-5 bullets. What's the overall shape of the database? Anything alarming?

- Total user schemas: `<n>`
- Total user tables: `<n>` (of which `<n>` flagged `looks_like_staging`)
- Total rows (sum of `06_row_counts.csv`): `<n>`
- Tables without a primary key: `<n>`
- Foreign keys declared: `<n>` &nbsp;|&nbsp; Strong join candidates without an FK: `<n>`
- Indexes never used (`idx_scan = 0`): `<n>`

---

## 2. Schema inventory (`01_schema_inventory.csv`)

| Schema | Owner | Tables | Views | Matviews | Sequences | Routines | Notes |
|--------|-------|--------|-------|----------|-----------|----------|-------|
|        |       |        |       |          |           |          |       |

---

## 3. Tables — keep / modify / remove

> Walk `02_table_inventory.csv` and `06_row_counts.csv` together.
> Mark every table with one of: **KEEP**, **MODIFY**, **REMOVE**, **MERGE**, **STAGING (cleanup)**.

| Schema.Table | Approx rows | Exact rows | Size | Decision | Reason / next action |
|--------------|------------:|-----------:|------|----------|----------------------|
| `public.foo` |             |            |      | KEEP     |                      |
| `public.bar_tmp` |         |            |      | STAGING  | drop after migration |
| `public.bar_old` |         |            |      | REMOVE   | superseded by `bar`  |

### 3a. Staging / temp / upload tables to retire

> From `02_table_inventory.csv` filtered by `looks_like_staging = true`,
> plus anything you've decided is one-shot import scaffolding.

- [ ] `<schema.table>` — purpose: `<…>` — safe to drop after: `<date / event>`
- [ ] `<schema.table>` — purpose: `<…>` — safe to drop after: `<date / event>`

### 3b. Tables to merge

> From `07_duplicate_candidates.csv` plus your own judgement.

| Source tables | Target table | Strategy (UNION ALL / incremental / replace) | Notes |
|---------------|--------------|----------------------------------------------|-------|
|               |              |                                              |       |

---

## 4. Column-level findings (`03_column_quality.csv`)

### 4a. Columns to drop (almost always NULL or single-valued)

| Schema.Table.Column | Null % | n_distinct | Reason to drop |
|---------------------|-------:|-----------:|----------------|
|                     |        |            |                |

### 4b. Columns that should be `NOT NULL`

| Schema.Table.Column | Current default | Observed null % | Why it should be NOT NULL |
|---------------------|-----------------|----------------:|---------------------------|
|                     |                 |                 |                           |

### 4c. Columns with the wrong type / shape

| Schema.Table.Column | Current type | Proposed type | Why |
|---------------------|--------------|---------------|-----|
|                     |              |               |     |

---

## 5. Keys & constraints (`04_keys_constraints.csv`)

### 5a. Tables WITHOUT a primary key

> A table appears here if it has no row of `constraint_type = PRIMARY KEY`.

- [ ] `<schema.table>` — proposed PK: `<column(s)>`
- [ ] `<schema.table>` — proposed PK: `<column(s)>`

### 5b. Missing foreign keys (from `08_join_candidates.csv`, `strength = strong`)

| Child table.column | Parent table.column | Why FK is needed | `ON DELETE` |
|--------------------|---------------------|------------------|-------------|
|                    |                     |                  |             |

### 5c. Missing unique / check constraints

| Schema.Table | Proposed constraint | Reason |
|--------------|---------------------|--------|
|              |                     |        |

---

## 6. Indexes (`05_indexes.csv`)

### 6a. Likely-unused indexes (`index_scans = 0`)

| Schema.Table | Index | Size | Recommendation |
|--------------|-------|------|----------------|
|              |       |      | drop / keep    |

### 6b. Tables with no indexes (and how they're queried)

| Schema.Table | Common predicates | Proposed index |
|--------------|-------------------|----------------|
|              |                   |                |

### 6c. New indexes to add (to support FKs from §5b)

| Schema.Table | Columns | Reason |
|--------------|---------|--------|
|              |         |        |

---

## 7. Joins (`08_join_candidates.csv`)

### 7a. Already-declared joins

> Quick sanity check: do all `declared_fk` rows make business sense?

- [ ] Reviewed — no surprises
- [ ] Found unexpected FKs: `<list>`

### 7b. Candidate joins to formalise

| Left side | Right side | Shared col | Type | Strength | Action |
|-----------|------------|------------|------|----------|--------|
|           |            |            |      | strong   | add FK |

---

## 8. Duplicates (`07_duplicate_candidates.csv`)

| Reason                      | Tables                          | Decision |
|-----------------------------|---------------------------------|----------|
| identical_column_signature  | `public.x`, `public.x_bk`       | drop `_bk` after backup |
| same_name_multiple_schemas  | `public.x`, `staging.x`         | merge into `public.x`   |

---

## 9. Schema improvements (recommended)

> Catch-all for changes that don't fit a single table — naming, partitioning,
> moving things between schemas, RLS policies, comments, etc.

- [ ] Standardise table naming (e.g. `mg_*` vs `radar_*`).
- [ ] Move staging/import tables out of `public` into a `staging` schema.
- [ ] Add `created_at` / `updated_at` triggers where appropriate.
- [ ] Add table & column `COMMENT ON …` for the survivors.
- [ ] Review RLS policies on tables exposed to `anon` / `authenticated`.
- [ ] …

---

## 10. Proposed cleanup plan (do NOT execute yet)

> Order matters. Pseudocode only — turn into an actual migration once approved.

1. **Backup** the database (snapshot or `pg_dump`).
2. Drop empty / unused indexes from §6a.
3. Add missing primary keys from §5a.
4. Add indexes required for FKs (§6c).
5. Add foreign keys from §5b.
6. Drop staging / temp / upload tables from §3a.
7. Merge duplicate tables from §3b / §8.
8. Drop dead columns from §4a; tighten nullability (§4b) and types (§4c).
9. Add comments / RLS / naming fixes from §9.
10. Re-run the audit and confirm the deltas.

---

## 11. Open questions / blockers

- [ ]
- [ ]
