-- Add indexes to mg_tms for faster validation lookups
CREATE INDEX IF NOT EXISTS idx_mg_tms_chassis_lower 
ON mg_tms (LOWER(TRIM(chassis_number)));

CREATE INDEX IF NOT EXISTS idx_mg_tms_container_lower 
ON mg_tms (LOWER(TRIM(container_number)));

CREATE INDEX IF NOT EXISTS idx_mg_tms_pickup_date 
ON mg_tms (pickup_actual_date);

-- Optimized validation function that's much faster
CREATE OR REPLACE FUNCTION public.validate_dcli_invoice(
  p_summary_invoice_id text,
  p_account_code text,
  p_billing_date date,
  p_due_date date,
  p_line_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '30s'
AS $function$
DECLARE
  v_result JSONB;
  v_summary JSONB;
  v_rows JSONB := '[]'::JSONB;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_exact_count INTEGER := 0;
  v_fuzzy_count INTEGER := 0;
  v_mismatch_count INTEGER := 0;
  v_line_item JSONB;
  v_tms_match JSONB;
  v_match_type TEXT;
  v_confidence INTEGER;
  v_chassis TEXT;
  v_container TEXT;
  v_date_out DATE;
BEGIN
  -- Check for duplicate invoice
  IF EXISTS (SELECT 1 FROM dcli_invoice WHERE invoice_id = p_summary_invoice_id) THEN
    v_errors := array_append(v_errors, 'Invoice ID already exists');
  END IF;

  -- Process each line item with optimized query
  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    -- Extract values once
    v_chassis := COALESCE(
      v_line_item->'row_data'->>'Chassis',
      v_line_item->>'chassis_out'
    );
    
    v_container := COALESCE(
      v_line_item->'row_data'->>'On-Hire Container',
      v_line_item->>'container_out'
    );
    
    v_date_out := (v_line_item->>'date_out')::date;

    -- Find best match using single optimized query
    SELECT jsonb_build_object(
      'ld_num', t.ld_num,
      'so_num', t.so_num,
      'shipment_number', t.shipment_number,
      'chassis_number', t.chassis_number,
      'container_number', t.container_number,
      'pickup_actual_date', t.pickup_actual_date,
      'delivery_actual_date', t.delivery_actual_date,
      'carrier_name', t.carrier_name,
      'customer_name', t.customer_name,
      'confidence', CASE
        WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
         AND LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
        THEN 100
        WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
        THEN 80
        WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
        THEN 60
        ELSE 40
      END,
      'match_reasons', ARRAY[
        CASE WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis)) 
          THEN 'Chassis match' ELSE NULL END,
        CASE WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container)) 
          THEN 'Container match' ELSE NULL END
      ]
    ) INTO v_tms_match
    FROM mg_tms t
    WHERE 
      (
        LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
        OR LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
      )
      AND (
        v_date_out IS NULL
        OR t.pickup_actual_date IS NULL
        OR t.pickup_actual_date::date BETWEEN v_date_out - INTERVAL '30 days' 
                                          AND v_date_out + INTERVAL '30 days'
      )
    ORDER BY 
      CASE
        WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
         AND LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
        THEN 1
        WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
        THEN 2
        WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
        THEN 3
        ELSE 4
      END
    LIMIT 1;

    -- Determine match type
    IF v_tms_match IS NOT NULL THEN
      v_confidence := (v_tms_match->>'confidence')::integer;
      
      IF v_confidence >= 90 THEN
        v_match_type := 'exact';
        v_exact_count := v_exact_count + 1;
      ELSIF v_confidence >= 60 THEN
        v_match_type := 'fuzzy';
        v_fuzzy_count := v_fuzzy_count + 1;
      ELSE
        v_match_type := 'mismatch';
        v_mismatch_count := v_mismatch_count + 1;
      END IF;
    ELSE
      v_match_type := 'mismatch';
      v_mismatch_count := v_mismatch_count + 1;
      v_confidence := 0;
      v_tms_match := 'null'::jsonb;
    END IF;

    -- Build row result with single best match
    v_rows := v_rows || jsonb_build_object(
      'line_invoice_number', v_line_item->>'line_invoice_number',
      'chassis', v_chassis,
      'container', v_container,
      'match_confidence', v_confidence,
      'match_type', v_match_type,
      'tms_match', v_tms_match
    );
  END LOOP;

  -- Build summary
  v_summary := jsonb_build_object(
    'exact_matches', v_exact_count,
    'fuzzy_matches', v_fuzzy_count,
    'mismatches', v_mismatch_count,
    'total_rows', jsonb_array_length(p_line_items)
  );

  -- Build final result
  v_result := jsonb_build_object(
    'summary', v_summary,
    'rows', v_rows,
    'errors', v_errors
  );

  RETURN v_result;
END;
$function$;