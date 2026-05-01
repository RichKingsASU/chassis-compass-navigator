-- 07_duplicate_candidates.sql
-- READ-ONLY: Finds tables that look like duplicates / near-duplicates of one another
-- based on shared column signatures. Does NOT read row data; only inspects schema.
--
-- Two heuristics:
--   A) Tables that share an identical column-name signature (likely true duplicates,
--      e.g. backups, _bk, _old, _copy, staging vs prod).
--   B) Tables in different schemas with the same name (likely staging vs prod copies).
--
-- The output is a list of *candidates* for human review. Nothing is changed.

WITH user_schemas AS (
    SELECT n.oid, n.nspname
    FROM pg_namespace n
    WHERE n.nspname NOT IN (
            'pg_catalog', 'information_schema', 'pg_toast',
            'auth', 'storage', 'realtime', 'supabase_functions',
            'extensions', 'graphql', 'graphql_public', 'pgsodium',
            'pgsodium_masks', 'vault', 'net', '_realtime', '_analytics',
            'supabase_migrations'
        )
),
table_cols AS (
    SELECT
        ns.nspname                                                    AS schema_name,
        c.relname                                                     AS table_name,
        c.oid                                                         AS rel_oid,
        c.reltuples::bigint                                           AS approx_rows,
        count(*) FILTER (WHERE a.attnum > 0 AND NOT a.attisdropped)   AS column_count,
        string_agg(
            lower(a.attname), ',' ORDER BY a.attname
        ) FILTER (WHERE a.attnum > 0 AND NOT a.attisdropped)          AS column_signature,
        md5(
            string_agg(
                lower(a.attname) || ':' || format_type(a.atttypid, a.atttypmod),
                ',' ORDER BY a.attname
            ) FILTER (WHERE a.attnum > 0 AND NOT a.attisdropped)
        )                                                             AS columns_with_types_hash
    FROM pg_class c
    JOIN user_schemas ns ON ns.oid = c.relnamespace
    JOIN pg_attribute a  ON a.attrelid = c.oid
    WHERE c.relkind IN ('r', 'p')
    GROUP BY ns.nspname, c.relname, c.oid, c.reltuples
),
-- A) Identical column signature across multiple tables
sig_groups AS (
    SELECT
        column_signature,
        columns_with_types_hash,
        column_count,
        count(*)                                              AS table_count,
        string_agg(schema_name || '.' || table_name, ' | '
                   ORDER BY schema_name, table_name)          AS tables
    FROM table_cols
    WHERE column_signature IS NOT NULL
    GROUP BY column_signature, columns_with_types_hash, column_count
    HAVING count(*) > 1
)
SELECT
    'identical_column_signature'::text                        AS reason,
    table_count,
    column_count,
    tables,
    column_signature,
    columns_with_types_hash
FROM sig_groups

UNION ALL

-- B) Same table name appears in multiple schemas (regardless of column signature)
SELECT
    'same_name_multiple_schemas'::text                        AS reason,
    count(*)                                                  AS table_count,
    NULL::bigint                                              AS column_count,
    string_agg(schema_name || '.' || table_name, ' | '
               ORDER BY schema_name)                          AS tables,
    NULL::text                                                AS column_signature,
    NULL::text                                                AS columns_with_types_hash
FROM table_cols
GROUP BY table_name
HAVING count(*) > 1

ORDER BY reason, table_count DESC;
