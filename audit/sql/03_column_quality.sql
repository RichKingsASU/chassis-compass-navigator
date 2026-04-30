-- 03_column_quality.sql
-- READ-ONLY: Column-level metadata + null rate via dynamic SQL against pg_stats.
-- Uses planner statistics (null_frac, n_distinct, avg_width) so it does NOT scan
-- row data and does NOT expose any actual values.

SELECT
    s.schemaname                                AS schema_name,
    s.tablename                                 AS table_name,
    a.attnum                                    AS ordinal_position,
    s.attname                                   AS column_name,
    format_type(a.atttypid, a.atttypmod)        AS data_type,
    a.attnotnull                                AS is_not_null,
    pg_get_expr(ad.adbin, ad.adrelid)           AS default_expr,
    s.null_frac                                 AS null_fraction_estimate,
    ROUND((s.null_frac * 100)::numeric, 2)      AS null_pct_estimate,
    s.n_distinct                                AS n_distinct_estimate,
    s.avg_width                                 AS avg_width_bytes,
    s.correlation                               AS physical_correlation,
    col_description(c.oid, a.attnum)            AS column_description
FROM pg_stats s
JOIN pg_class      c   ON c.relname = s.tablename
JOIN pg_namespace  n   ON n.oid = c.relnamespace AND n.nspname = s.schemaname
JOIN pg_attribute  a   ON a.attrelid = c.oid AND a.attname = s.attname AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
WHERE s.schemaname NOT IN (
        'pg_catalog', 'information_schema', 'pg_toast',
        'auth', 'storage', 'realtime', 'supabase_functions',
        'extensions', 'graphql', 'graphql_public', 'pgsodium',
        'pgsodium_masks', 'vault', 'net', '_realtime', '_analytics',
        'supabase_migrations'
    )
ORDER BY s.schemaname, s.tablename, a.attnum;
