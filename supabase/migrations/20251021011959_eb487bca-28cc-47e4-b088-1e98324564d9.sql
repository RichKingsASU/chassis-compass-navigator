-- Remove charges requirement from 100% validation, keep only days strict
DROP FUNCTION IF EXISTS public.validate_dcli_invoice(text, text, date, date, jsonb);

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
  v_bill_start_date DATE;
  v_bill_end_date DATE;
  v_grand_total NUMERIC;
  v_tier_1_days INTEGER;
  v_tier_1_free_days INTEGER;
  v_tier_2_days INTEGER;
  v_tier_2_free_days INTEGER;
  v_tier_3_days INTEGER;
  v_tier_3_free_days INTEGER;
  v_invoice_billable_days INTEGER;
  v_tms_days INTEGER;
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
    
    -- Extract billing dates from row_data
    v_bill_start_date := (v_line_item->'row_data'->>'Bill Start Date')::date;
    v_bill_end_date := (v_line_item->'row_data'->>'Bill End Date')::date;
    
    -- Extract charges
    v_grand_total := (v_line_item->'row_data'->>'Grand Total')::numeric;
    
    -- Extract all tier days and free days
    v_tier_1_days := COALESCE((v_line_item->'row_data'->>'Tier 1 Days')::integer, 0);
    v_tier_1_free_days := COALESCE((v_line_item->'row_data'->>'Tier 1 Free Days')::integer, 0);
    v_tier_2_days := COALESCE((v_line_item->'row_data'->>'Tier 2 Days')::integer, 0);
    v_tier_2_free_days := COALESCE((v_line_item->'row_data'->>'Tier 2 Free Days')::integer, 0);
    v_tier_3_days := COALESCE((v_line_item->'row_data'->>'Tier 3 Days')::integer, 0);
    v_tier_3_free_days := COALESCE((v_line_item->'row_data'->>'Tier 3 Free Days')::integer, 0);
    
    -- Calculate invoice billable days using the correct formula
    v_invoice_billable_days := (v_tier_1_days - v_tier_1_free_days) + 
                               (v_tier_2_days - v_tier_2_free_days) + 
                               (v_tier_3_days - v_tier_3_free_days);

    -- Find best match using single optimized query
    SELECT 
      COALESCE(t.invoice_quantity, t.rated_quantity) as tms_days,
      jsonb_build_object(
        'ld_num', t.ld_num,
        'so_num', t.so_num,
        'shipment_number', t.shipment_number,
        'chassis_number', t.chassis_number,
        'container_number', t.container_number,
        'pickup_actual_date', t.pickup_actual_date::date,
        'actual_rc_date', t.actual_rc_date::date,
        'delivery_actual_date', t.delivery_actual_date,
        'carrier_name', t.carrier_name,
        'customer_name', t.customer_name,
        'rated_amount', t.rated_amount,
        'rated_quantity', COALESCE(t.invoice_quantity, t.rated_quantity),
        'confidence', CASE
          -- 100% match requires: equipment, dates, and DAYS to match (charges can differ)
          WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
           AND LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
           AND (v_bill_start_date IS NULL OR t.pickup_actual_date IS NULL OR v_bill_start_date::date = t.pickup_actual_date::date)
           AND (v_bill_end_date IS NULL OR t.actual_rc_date IS NULL OR v_bill_end_date::date = t.actual_rc_date::date)
           AND (v_invoice_billable_days IS NULL OR COALESCE(t.invoice_quantity, t.rated_quantity) IS NULL 
                OR v_invoice_billable_days = COALESCE(t.invoice_quantity, t.rated_quantity))
          THEN 100
          -- Otherwise start with equipment match and deduct for issues
          ELSE
            CASE
              WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
               AND LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
              THEN 100
              WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
              THEN 80
              WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
              THEN 60
              ELSE 40
            END
            -- Apply penalties for date mismatches
            - CASE 
                WHEN v_bill_start_date IS NOT NULL AND t.pickup_actual_date IS NOT NULL 
                     AND v_bill_start_date::date != t.pickup_actual_date::date 
                THEN 20 
                ELSE 0 
              END
            - CASE 
                WHEN v_bill_end_date IS NOT NULL AND t.actual_rc_date IS NOT NULL 
                     AND v_bill_end_date::date != t.actual_rc_date::date 
                THEN 20 
                ELSE 0 
              END
            -- Apply penalty for days mismatch (critical requirement)
            - CASE 
                WHEN v_invoice_billable_days IS NOT NULL 
                     AND COALESCE(t.invoice_quantity, t.rated_quantity) IS NOT NULL 
                     AND v_invoice_billable_days != COALESCE(t.invoice_quantity, t.rated_quantity)
                THEN 20 
                ELSE 0 
              END
            -- Apply smaller penalty for charges mismatch (informational only)
            - CASE 
                WHEN v_grand_total IS NOT NULL AND t.rated_amount IS NOT NULL 
                     AND ABS(v_grand_total - t.rated_amount) > 0.01 
                THEN 5
                ELSE 0 
              END
        END,
        'match_reasons', ARRAY[
          CASE WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis)) 
            THEN 'Chassis match' ELSE NULL END,
          CASE WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container)) 
            THEN 'Container match' ELSE NULL END,
          CASE WHEN v_bill_start_date IS NOT NULL AND t.pickup_actual_date IS NOT NULL 
                    AND v_bill_start_date::date = t.pickup_actual_date::date 
            THEN 'Bill Start matches TMS Pickup' ELSE NULL END,
          CASE WHEN v_bill_end_date IS NOT NULL AND t.actual_rc_date IS NOT NULL 
                    AND v_bill_end_date::date = t.actual_rc_date::date 
            THEN 'Bill End matches TMS Return' ELSE NULL END,
          CASE WHEN v_grand_total IS NOT NULL AND t.rated_amount IS NOT NULL 
                    AND ABS(v_grand_total - t.rated_amount) <= 0.01 
            THEN 'Charges match' ELSE NULL END,
          CASE WHEN v_invoice_billable_days IS NOT NULL 
                    AND COALESCE(t.invoice_quantity, t.rated_quantity) IS NOT NULL 
                    AND v_invoice_billable_days = COALESCE(t.invoice_quantity, t.rated_quantity)
            THEN 'Days match' ELSE NULL END
        ]
      ) as match_obj
    INTO v_tms_days, v_tms_match
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
      
      -- Ensure confidence doesn't go negative
      IF v_confidence < 0 THEN
        v_confidence := 0;
      END IF;
      
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