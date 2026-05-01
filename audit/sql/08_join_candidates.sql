-- 08_join_candidates.sql
-- READ-ONLY: Finds tables that look JOINABLE based on shared column names + types.
-- Two outputs:
--   A) Existing FK relationships (already-declared joins) for reference.
--   B) Candidate joins: pairs of tables that share a column with the same name
--      and compatible type but no FK declared. Strong candidates are columns ending
--      in _id / id / _key / _code / _uuid / _ref or matching a known PK column name.
--
-- Pure metadata; does not read row contents.

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
cols AS (
    SELECT
        ns.nspname                                  AS schema_name,
        c.relname                                   AS table_name,
        c.oid                                       AS rel_oid,
        a.attname                                   AS column_name,
        format_type(a.atttypid, a.atttypmod)        AS data_type,
        a.atttypid                                  AS type_oid,
        a.attnum                                    AS attnum
    FROM pg_class c
    JOIN user_schemas ns ON ns.oid = c.relnamespace
    JOIN pg_attribute a  ON a.attrelid = c.oid
    WHERE c.relkind IN ('r', 'p')
      AND a.attnum > 0
      AND NOT a.attisdropped
),
-- Existing FK pairs (so we can exclude them from "missing FK" suggestions)
fk_pairs AS (
    SELECT
        ns.nspname     AS schema_name,
        c.relname      AS table_name,
        a.attname      AS column_name,
        fns.nspname    AS ref_schema,
        fc.relname     AS ref_table,
        fa.attname     AS ref_column
    FROM pg_constraint con
    JOIN pg_class      c   ON c.oid = con.conrelid
    JOIN user_schemas  ns  ON ns.oid = c.relnamespace
    JOIN pg_class      fc  ON fc.oid = con.confrelid
    JOIN pg_namespace  fns ON fns.oid = fc.relnamespace
    JOIN unnest(con.conkey)  WITH ORDINALITY u(attnum, ord) ON true
    JOIN unnest(con.confkey) WITH ORDINALITY fu(attnum, ord) ON fu.ord = u.ord
    JOIN pg_attribute a  ON a.attrelid  = c.oid  AND a.attnum  = u.attnum
    JOIN pg_attribute fa ON fa.attrelid = fc.oid AND fa.attnum = fu.attnum
    WHERE con.contype = 'f'
),
-- Primary key columns per table (used to score join strength)
pk_cols AS (
    SELECT
        ns.nspname     AS schema_name,
        c.relname      AS table_name,
        a.attname      AS pk_column,
        format_type(a.atttypid, a.atttypmod) AS pk_type
    FROM pg_constraint con
    JOIN pg_class      c   ON c.oid = con.conrelid
    JOIN user_schemas  ns  ON ns.oid = c.relnamespace
    JOIN unnest(con.conkey) AS u(attnum) ON true
    JOIN pg_attribute  a   ON a.attrelid = c.oid AND a.attnum = u.attnum
    WHERE con.contype = 'p'
)
-- A) Already declared foreign-key relationships
SELECT
    'declared_fk'::text                                     AS reason,
    schema_name      || '.' || table_name      || '.' || column_name AS left_side,
    ref_schema       || '.' || ref_table       || '.' || ref_column  AS right_side,
    NULL::text                                              AS shared_column,
    NULL::text                                              AS data_type,
    NULL::text                                              AS strength
FROM fk_pairs

UNION ALL

-- B) Same column name + same type across two different tables, no FK declared
SELECT
    'candidate_join_no_fk'::text                            AS reason,
    l.schema_name || '.' || l.table_name || '.' || l.column_name AS left_side,
    r.schema_name || '.' || r.table_name || '.' || r.column_name AS right_side,
    l.column_name                                           AS shared_column,
    l.data_type                                             AS data_type,
    CASE
        WHEN l.column_name ~* '(^|_)(id|uuid|key|code|ref)$'
          OR EXISTS (SELECT 1 FROM pk_cols p
                     WHERE p.pk_column = l.column_name
                       AND p.pk_type   = l.data_type)
            THEN 'strong'
        WHEN l.column_name ~* '_(id|uuid|key|code|ref|num|number|sku|hash)$'
            THEN 'medium'
        ELSE 'weak'
    END                                                     AS strength
FROM cols l
JOIN cols r
  ON l.column_name = r.column_name
 AND l.type_oid    = r.type_oid
 AND (l.schema_name, l.table_name, l.attnum) <
     (r.schema_name, r.table_name, r.attnum)
WHERE NOT EXISTS (
        SELECT 1 FROM fk_pairs f
        WHERE (f.schema_name = l.schema_name AND f.table_name = l.table_name AND f.column_name = l.column_name
               AND f.ref_schema = r.schema_name AND f.ref_table = r.table_name AND f.ref_column = r.column_name)
           OR (f.schema_name = r.schema_name AND f.table_name = r.table_name AND f.column_name = r.column_name
               AND f.ref_schema = l.schema_name AND f.ref_table = l.table_name AND f.ref_column = l.column_name)
    )
  -- Filter out generic columns that aren't useful join keys
  AND l.column_name NOT IN (
        'created_at', 'updated_at', 'inserted_at', 'deleted_at',
        'created', 'updated', 'modified', 'timestamp', 'ts',
        'name', 'description', 'notes', 'comment', 'comments',
        'status', 'type', 'value', 'amount', 'count',
        'email', 'phone', 'address', 'city', 'state', 'country', 'zip'
    )

ORDER BY reason, strength NULLS LAST, left_side, right_side;
