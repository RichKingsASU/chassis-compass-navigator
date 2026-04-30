-- 05_indexes.sql
-- READ-ONLY: All indexes across user schemas with size, uniqueness, and usage stats.
-- Highlights potentially unused indexes and tables that have NO indexes at all.

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
idx AS (
    SELECT
        ns.nspname                              AS schema_name,
        t.relname                               AS table_name,
        i.relname                               AS index_name,
        ix.indisprimary                         AS is_primary,
        ix.indisunique                          AS is_unique,
        ix.indisvalid                           AS is_valid,
        am.amname                               AS index_method,
        pg_get_indexdef(ix.indexrelid)          AS definition,
        pg_relation_size(i.oid)                 AS index_bytes,
        pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
        s.idx_scan                              AS index_scans,
        s.idx_tup_read                          AS index_tuples_read,
        s.idx_tup_fetch                         AS index_tuples_fetched,
        ix.indnatts                             AS num_columns,
        (
            SELECT string_agg(a.attname, ', ' ORDER BY k.ord)
            FROM unnest(ix.indkey::int[]) WITH ORDINALITY k(attnum, ord)
            LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        )                                       AS columns
    FROM pg_index ix
    JOIN pg_class      i  ON i.oid = ix.indexrelid
    JOIN pg_class      t  ON t.oid = ix.indrelid
    JOIN user_schemas  ns ON ns.oid = t.relnamespace
    JOIN pg_am         am ON am.oid = i.relam
    LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = ix.indexrelid
)
SELECT * FROM idx
ORDER BY schema_name, table_name, is_primary DESC, is_unique DESC, index_name;
