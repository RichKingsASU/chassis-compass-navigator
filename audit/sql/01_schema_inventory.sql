-- 01_schema_inventory.sql
-- READ-ONLY: Inventory of all non-system schemas in the database.
-- Helps identify which schemas exist, who owns them, and how many objects each contains.

SELECT
    n.nspname                                  AS schema_name,
    pg_catalog.pg_get_userbyid(n.nspowner)     AS owner,
    obj_description(n.oid, 'pg_namespace')     AS description,
    (SELECT count(*) FROM pg_class c
        WHERE c.relnamespace = n.oid AND c.relkind = 'r')  AS table_count,
    (SELECT count(*) FROM pg_class c
        WHERE c.relnamespace = n.oid AND c.relkind = 'v')  AS view_count,
    (SELECT count(*) FROM pg_class c
        WHERE c.relnamespace = n.oid AND c.relkind = 'm')  AS materialized_view_count,
    (SELECT count(*) FROM pg_class c
        WHERE c.relnamespace = n.oid AND c.relkind = 'S')  AS sequence_count,
    (SELECT count(*) FROM pg_proc p
        WHERE p.pronamespace = n.oid)                      AS routine_count
FROM pg_namespace n
WHERE n.nspname NOT IN (
        'pg_catalog', 'information_schema', 'pg_toast'
    )
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
ORDER BY schema_name;
