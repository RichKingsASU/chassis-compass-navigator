-- Run after applying 20260428130000_schema_fixes_session.sql
-- Expected: see comments at end of file.

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'mg_data' AND column_name IN (
      'carrier_total_rate_other',
      'carrier_total_invoice_linehaul',
      'carrier_total_invoice_other'
    ))
    OR
    (table_name = 'ytd_loads' AND column_name IN (
      'row_id',
      'carrier_total_rate_other',
      'carrier_total_invoice_linehaul',
      'carrier_total_invoice_other'
    ))
    OR
    (table_name = 'dcli_activity' AND column_name IN (
      'date_out', 'date_in', 'created_date'
    ))
    OR
    (table_name = 'data_refresh_log')
  )
ORDER BY table_name, column_name;

-- Spot-check converted dcli_activity rows:
SELECT chassis, date_out, date_in, created_date
FROM dcli_activity
WHERE date_in IS NOT NULL
LIMIT 5;

-- Expected results:
--   data_refresh_log id           bigint
--   data_refresh_log loaded_at    timestamp with time zone
--   data_refresh_log loaded_by    text
--   data_refresh_log notes        text
--   data_refresh_log row_count    bigint
--   data_refresh_log source_file  text
--   data_refresh_log table_name   text
--   dcli_activity    created_date timestamp with time zone
--   dcli_activity    date_in      timestamp with time zone
--   dcli_activity    date_out     timestamp with time zone
--   mg_data          carrier_total_invoice_linehaul  numeric
--   mg_data          carrier_total_invoice_other     numeric
--   mg_data          carrier_total_rate_other        numeric
--   ytd_loads        carrier_total_invoice_linehaul  numeric
--   ytd_loads        carrier_total_invoice_other     numeric
--   ytd_loads        carrier_total_rate_other        numeric
--   ytd_loads        row_id                          bigint
