-- 06_row_counts.sql
-- READ-ONLY: Exact row counts for every base table in user schemas.
-- Uses a DO block that runs read-only SELECT count(*) statements and writes the
-- results into a temporary table that we return at the end. No data is modified.

DO $$
DECLARE
    r            record;
    n_rows       bigint;
    sql_text     text;
BEGIN
    -- Temp table is session-scoped and disappears on disconnect.
    CREATE TEMP TABLE IF NOT EXISTS _audit_row_counts (
        schema_name   text,
        table_name    text,
        exact_rows    bigint,
        approx_rows   bigint,
        total_bytes   bigint,
        total_size    text,
        counted_at    timestamptz DEFAULT now()
    ) ON COMMIT PRESERVE ROWS;

    -- Clear any prior run within the same session
    DELETE FROM _audit_row_counts;

    FOR r IN
        SELECT n.nspname AS schema_name,
               c.relname AS table_name,
               c.oid     AS rel_oid,
               c.reltuples::bigint AS approx_rows,
               pg_total_relation_size(c.oid) AS total_bytes,
               pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'p')
          AND n.nspname NOT IN (
                'pg_catalog', 'information_schema', 'pg_toast',
                'auth', 'storage', 'realtime', 'supabase_functions',
                'extensions', 'graphql', 'graphql_public', 'pgsodium',
                'pgsodium_masks', 'vault', 'net', '_realtime', '_analytics',
                'supabase_migrations'
            )
        ORDER BY n.nspname, c.relname
    LOOP
        sql_text := format('SELECT count(*) FROM %I.%I', r.schema_name, r.table_name);
        BEGIN
            EXECUTE sql_text INTO n_rows;
        EXCEPTION WHEN OTHERS THEN
            n_rows := NULL;
        END;

        INSERT INTO _audit_row_counts(schema_name, table_name, exact_rows, approx_rows, total_bytes, total_size)
        VALUES (r.schema_name, r.table_name, n_rows, r.approx_rows, r.total_bytes, r.total_size);
    END LOOP;
END
$$ LANGUAGE plpgsql;

SELECT
    schema_name,
    table_name,
    exact_rows,
    approx_rows,
    total_bytes,
    total_size,
    CASE
        WHEN exact_rows IS NULL          THEN 'unknown'
        WHEN exact_rows = 0              THEN 'empty'
        WHEN exact_rows < 100            THEN 'tiny'
        WHEN exact_rows < 10000          THEN 'small'
        WHEN exact_rows < 1000000        THEN 'medium'
        ELSE 'large'
    END AS size_bucket
FROM _audit_row_counts
ORDER BY schema_name, table_name;
