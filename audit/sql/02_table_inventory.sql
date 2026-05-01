-- 02_table_inventory.sql
-- READ-ONLY: Inventory of all tables (and views/matviews) in user schemas.
-- Includes size, approximate row count, and flags likely staging/temp/upload tables.

SELECT
    n.nspname                                       AS schema_name,
    c.relname                                       AS table_name,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
        WHEN 'f' THEN 'foreign_table'
        WHEN 'p' THEN 'partitioned_table'
        ELSE c.relkind::text
    END                                             AS object_type,
    pg_catalog.pg_get_userbyid(c.relowner)          AS owner,
    c.reltuples::bigint                             AS approx_row_count,
    pg_total_relation_size(c.oid)                   AS total_bytes,
    pg_size_pretty(pg_total_relation_size(c.oid))   AS total_size,
    pg_size_pretty(pg_relation_size(c.oid))         AS table_size,
    pg_size_pretty(pg_indexes_size(c.oid))          AS indexes_size,
    obj_description(c.oid, 'pg_class')              AS description,
    -- Heuristic flag for staging/temp/upload candidates by name pattern
    (
        c.relname ~* '(^|_)(stg|stage|staging|temp|tmp|tempo|upload|uploads|raw|import|imports|backup|bak|bk|old|new|copy|test|scratch)(_|$)'
        OR c.relname ~* '_(stg|stage|staging|temp|tmp|upload|raw|import|backup|bak|bk|old|new|copy|test|scratch)$'
    )                                               AS looks_like_staging
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'v', 'm', 'f', 'p')
  AND n.nspname NOT IN (
        'pg_catalog', 'information_schema', 'pg_toast',
        'auth', 'storage', 'realtime', 'supabase_functions',
        'extensions', 'graphql', 'graphql_public', 'pgsodium',
        'pgsodium_masks', 'vault', 'net', '_realtime', '_analytics',
        'supabase_migrations'
    )
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
ORDER BY n.nspname, c.relname;
