-- ─────────────────────────────────────────────────────────────
-- Replace mg_tms TABLE with a VIEW over mg_data
-- ─────────────────────────────────────────────────────────────
-- The mg_tms table was created empty. The actual MercuryGate data
-- lives in mg_data (synced externally). Multiple components query
-- mg_tms expecting columns like cust_rate_charge, customer_name,
-- unbilledflag, etc. This view maps mg_data columns to those names.
-- ─────────────────────────────────────────────────────────────

-- Drop the empty table so we can create a view with the same name
DROP TABLE IF EXISTS mg_tms CASCADE;

CREATE OR REPLACE VIEW mg_tms AS
SELECT
  -- Identity
  id,
  ld_num,
  so_num,
  shipment_number,
  chassis_number,
  container_number,
  container_description                          AS container_type,
  status,

  -- Parties
  owner                                          AS customer_name,
  carrier_name,
  carrier_scac,
  acct_mgr_name                                  AS acct_mg_name,

  -- Locations
  pickup_loc_name,
  pickup_loc_city,
  pickup_loc_stateprovince                       AS pickup_state,
  drop_loc_name                                  AS delivery_loc_name,
  drop_loc_city                                  AS delivery_city,
  drop_loc_stateprovince                         AS delivery_state,

  -- Dates
  pickup_actual_date,
  drop_actual_date                               AS delivery_actual_date,
  actual_rc_date,
  createdate                                     AS created_date,
  createdate::timestamptz                        AS created_at,

  -- Financials (TEXT → NUMERIC)
  NULLIF(customer_rate_amount, '')::numeric       AS cust_rate_charge,
  NULLIF(customer_inv_amount, '')::numeric        AS cust_invoice_charge,
  NULLIF(carrier_rate_amount, '')::numeric        AS carrier_rate_charge,
  NULLIF(carrier_inv_amount, '')::numeric         AS carrier_invoice_charge,
  NULLIF(margin_rate, '')::numeric                AS margin_rate,

  -- Shipping
  mbl,
  steamshipline,
  service_description                            AS service,
  miles,

  -- Flags
  unbilledflag,

  -- Chassis info
  chassis_description,

  -- Raw
  raw_data

FROM mg_data;

-- ─────────────────────────────────────────────────────────────
-- RLS: Views inherit the RLS policy of the underlying table.
-- If mg_data has public SELECT access, mg_tms inherits it.
-- ─────────────────────────────────────────────────────────────
