-- 04_keys_constraints.sql
-- READ-ONLY: All primary keys, unique constraints, foreign keys, and check constraints
-- across user schemas. Useful for spotting tables WITHOUT primary keys and orphan FKs.

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
)
SELECT
    n.nspname                                          AS schema_name,
    c.relname                                          AS table_name,
    con.conname                                        AS constraint_name,
    CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        WHEN 'x' THEN 'EXCLUSION'
        WHEN 't' THEN 'TRIGGER'
        ELSE con.contype::text
    END                                                AS constraint_type,
    pg_get_constraintdef(con.oid, true)                AS definition,
    -- Local (constrained) columns
    (
        SELECT string_agg(att.attname, ', ' ORDER BY u.ord)
        FROM unnest(con.conkey) WITH ORDINALITY u(attnum, ord)
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = u.attnum
    )                                                  AS columns,
    -- For FKs: referenced table + columns
    fn.nspname                                         AS referenced_schema,
    fc.relname                                         AS referenced_table,
    (
        SELECT string_agg(att.attname, ', ' ORDER BY u.ord)
        FROM unnest(con.confkey) WITH ORDINALITY u(attnum, ord)
        JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = u.attnum
    )                                                  AS referenced_columns,
    CASE con.confupdtype
        WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT' ELSE con.confupdtype::text
    END                                                AS on_update,
    CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT' ELSE con.confdeltype::text
    END                                                AS on_delete,
    con.condeferrable                                  AS deferrable,
    con.convalidated                                   AS validated
FROM pg_constraint con
JOIN pg_class      c  ON c.oid = con.conrelid
JOIN user_schemas  n  ON n.oid = c.relnamespace
LEFT JOIN pg_class     fc ON fc.oid = con.confrelid
LEFT JOIN pg_namespace fn ON fn.oid = fc.relnamespace
ORDER BY n.nspname, c.relname, con.contype, con.conname;
