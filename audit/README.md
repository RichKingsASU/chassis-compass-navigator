# Supabase / Postgres Audit Package

A **read-only** audit suite for the local Supabase database in this project.
It inspects metadata, row counts, null rates, duplicates, keys, indexes, and
likely join candidates, and writes the results to CSV files in
`audit/output/`. It does **not** modify any data.

> No `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`,
> `GRANT`, `REVOKE`, `VACUUM`, or `COPY ... FROM` statements are issued
> against your data. The runner refuses to execute any SQL file that
> contains those keywords (with one tightly-scoped exception for a
> session-only `TEMP TABLE` used to collect row counts).

---

## Layout

```
audit/
├── README.md                  # this file
├── report_template.md         # fill-in template for the human-written audit report
├── run_audit.ps1              # PowerShell runner (Windows)
├── sql/
│   ├── 01_schema_inventory.sql
│   ├── 02_table_inventory.sql
│   ├── 03_column_quality.sql
│   ├── 04_keys_constraints.sql
│   ├── 05_indexes.sql
│   ├── 06_row_counts.sql
│   ├── 07_duplicate_candidates.sql
│   └── 08_join_candidates.sql
└── output/                    # CSVs written here by run_audit.ps1
```

---

## Prerequisites

1. **Local Supabase running** at `127.0.0.1:54322` (or any reachable Postgres).
2. **`psql` on PATH.** The Postgres client tools or the Supabase CLI bundle
   include it.
   - Verify: `psql --version`
   - If `psql` is not on PATH, pass its full path with `-PsqlPath`.
3. **PowerShell 5.1+** (Windows PowerShell) or PowerShell 7+.

The runner uses `$env:DATABASE_URL`. **Do not hardcode the URL anywhere in
the audit files.**

---

## Running the audit

From the **project root** (`chassis-compass-navigator/`):

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
.\audit\run_audit.ps1
```

You should see something like:

```
Scanning 8 SQL file(s) for write statements...
All SQL files are read-only. Proceeding.
Testing connection...
  -> postgres | postgres | PostgreSQL 15.x ...

Running 01_schema_inventory.sql -> .\audit\output\01_schema_inventory.csv
  OK (12 rows)
Running 02_table_inventory.sql -> .\audit\output\02_table_inventory.csv
  OK (47 rows)
...
==================== AUDIT SUMMARY ====================
File                          Status Output                                      Rows
----                          ------ ------                                      ----
01_schema_inventory.sql       OK     .\audit\output\01_schema_inventory.csv      12
02_table_inventory.sql        OK     .\audit\output\02_table_inventory.csv       47
...
Summary written to .\audit\output\_summary.csv
```

### Optional parameters

| Parameter    | Default                | Purpose                                |
|--------------|------------------------|----------------------------------------|
| `-PsqlPath`  | `psql` (on PATH)       | Full path to `psql.exe`                |
| `-OutputDir` | `.\audit\output`       | Where CSVs are written                 |
| `-SqlDir`    | `.\audit\sql`          | Where the .sql files live              |

Example:

```powershell
.\audit\run_audit.ps1 -PsqlPath "C:\Program Files\PostgreSQL\16\bin\psql.exe"
```

---

## What each query produces

| File                                | Output CSV                          | What you'll see                                                                                                                                       |
|-------------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `01_schema_inventory.sql`           | `01_schema_inventory.csv`           | Every non-system schema, its owner, and counts of tables/views/matviews/sequences/routines.                                                           |
| `02_table_inventory.sql`            | `02_table_inventory.csv`            | Every user table/view: type, owner, approximate rows, total/table/index size, description, and a heuristic `looks_like_staging` flag (stg, tmp, bk…). |
| `03_column_quality.sql`             | `03_column_quality.csv`             | Every column with data type, NOT NULL flag, default expression, **estimated null fraction**, distinct-value estimate, and average width.              |
| `04_keys_constraints.sql`           | `04_keys_constraints.csv`           | Primary keys, unique constraints, foreign keys (with on-update/on-delete), and check constraints.                                                     |
| `05_indexes.sql`                    | `05_indexes.csv`                    | Every index with method, columns, validity, size, and `pg_stat_user_indexes` usage counters.                                                          |
| `06_row_counts.sql`                 | `06_row_counts.csv`                 | **Exact** `count(*)` for every base table, plus a size bucket (`empty / tiny / small / medium / large`).                                              |
| `07_duplicate_candidates.sql`       | `07_duplicate_candidates.csv`       | Tables that share an identical column signature, or share a name across schemas — likely duplicates / backups / staging copies.                       |
| `08_join_candidates.sql`            | `08_join_candidates.csv`            | Existing FK pairs **and** candidate joins (same column name + type, no FK declared) ranked `strong / medium / weak`.                                  |

A `_summary.csv` is also written, listing every file run, its status, and the
row count of its CSV.

---

## Read-only enforcement

The runner enforces read-only mode in three layered ways:

1. **Static scan.** Before connecting, every `.sql` file is scanned for
   forbidden statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`,
   `TRUNCATE`, `CREATE` (other than the controlled temp table in
   `06_row_counts.sql`), `GRANT`, `REVOKE`, `VACUUM`, `REINDEX`,
   `CLUSTER`, `COMMENT ON`, `SECURITY LABEL`, `COPY ... FROM`, `CALL`,
   `pg_terminate_backend`, `pg_cancel_backend`). Any match aborts the run
   before it starts.
2. **Server-level.** `PGOPTIONS` sets `default_transaction_read_only=on`
   for the whole psql session.
3. **Statement-level.** Each file is wrapped in `BEGIN; SET TRANSACTION
   READ ONLY; … COMMIT;` so even a transaction that tried to write would
   be refused by Postgres.

The single, deliberate exception is `06_row_counts.sql`, which uses a
session-scoped `TEMP TABLE` named `_audit_row_counts` purely to gather
`count(*)` results. The temp table:
- exists only in the current session,
- is dropped automatically when the session ends, and
- is whitelisted by name in the static scanner (no other `CREATE`,
  `INSERT`, or `DELETE` is permitted).

---

## Privacy

These queries inspect **metadata only**: schema names, table names, column
names, types, sizes, planner statistics (`pg_stats`), and `count(*)`.
**No row content is read or written to the CSVs.** The two places that
touch row data at all are:
- `06_row_counts.sql` — only counts rows, never reads values.
- `03_column_quality.sql` — uses planner statistics in `pg_stats`
  (`null_frac`, `n_distinct`, `avg_width`, `correlation`); it never
  selects user values.

---

## Reading the results

Open the CSVs in Excel, the Supabase Studio SQL editor, or any text editor.

Suggested review order:

1. **`02_table_inventory.csv`** — get the lay of the land. Scan for
   `looks_like_staging = true` and unusually large/small tables.
2. **`06_row_counts.csv`** — find empty tables (`size_bucket = empty`)
   and outliers.
3. **`07_duplicate_candidates.csv`** — find true duplicates and
   cross-schema copies (often staging vs. prod).
4. **`04_keys_constraints.csv`** — look for tables with **no** primary
   key (a row missing from this CSV indicates a table without one) and
   FKs with `on_delete = NO ACTION` you didn't expect.
5. **`05_indexes.csv`** — check `index_scans = 0` (likely unused) and
   tables with no indexes.
6. **`03_column_quality.csv`** — sort by `null_pct_estimate DESC` to
   spot mostly-empty columns; sort by `n_distinct_estimate = 1` to find
   columns that carry no signal.
7. **`08_join_candidates.csv`** — review `strength = strong` rows to
   propose missing foreign keys.

Then capture findings in `audit/report_template.md`.

---

## Troubleshooting

- **`DATABASE_URL is not set`** — set it in the same shell you run from.
  PowerShell's `$env:` only persists in the current session.
- **`Could not invoke psql`** — install Postgres client tools, or pass
  `-PsqlPath` explicitly.
- **Permission denied / SSL errors** — connect with `psql $env:DATABASE_URL`
  manually first to validate the URL.
- **A file shows 0 rows** — that's fine; the query simply returned no
  rows (e.g. no duplicates found). Check the `.log` next to the CSV for
  details if you suspect a problem.

---

## Doing the cleanup

Cleanup is **out of scope** for this package. After reviewing the CSVs,
fill out `report_template.md`, decide what to keep / modify / remove,
and write a separate change script that you can review before applying.
