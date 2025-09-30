-- Fix validate_dcli_invoice to read chassis from row_data
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
  v_tms_matches JSONB;
  v_match_type TEXT;
  v_confidence INTEGER;
  v_max_confidence INTEGER;
  v_chassis TEXT;
  v_container TEXT;
BEGIN
  -- Check for duplicate invoice
  IF EXISTS (SELECT 1 FROM dcli_invoice WHERE invoice_id = p_summary_invoice_id) THEN
    v_errors := array_append(v_errors, 'Invoice ID already exists');
  END IF;

  -- Process each line item
  FOR v_line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    -- Extract chassis and container from row_data if available, otherwise fall back to direct fields
    v_chassis := COALESCE(
      v_line_item->'row_data'->>'Chassis',
      v_line_item->>'chassis_out',
      v_line_item->>'chassis'
    );
    
    v_container := COALESCE(
      v_line_item->'row_data'->>'On-Hire Container',
      v_line_item->>'container_out',
      v_line_item->>'on_hire_container',
      v_line_item->>'container'
    );

    -- Find matching TMS records based on chassis and container
    SELECT jsonb_agg(
      jsonb_build_object(
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
          -- Exact match: chassis and container both match
          WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
           AND LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
          THEN 100
          -- High confidence: chassis matches and container is close
          WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
          THEN 80
          -- Medium confidence: container matches but chassis differs
          WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
          THEN 60
          -- Low confidence: partial matches
          ELSE 40
        END,
        'match_reasons', ARRAY[
          CASE WHEN LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis)) 
            THEN 'Chassis match' ELSE NULL END,
          CASE WHEN LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container)) 
            THEN 'Container match' ELSE NULL END,
          'LD: ' || COALESCE(t.ld_num, 'N/A'),
          'SO: ' || COALESCE(t.so_num, 'N/A')
        ]
      )
    ) INTO v_tms_matches
    FROM mg_tms t
    WHERE 
      -- Match on chassis or container
      (
        LOWER(TRIM(t.chassis_number)) = LOWER(TRIM(v_chassis))
        OR LOWER(TRIM(t.container_number)) = LOWER(TRIM(v_container))
      )
      -- Date range filter (optional, to narrow down results)
      AND (
        t.pickup_actual_date IS NULL
        OR (v_line_item->>'date_out')::date IS NULL
        OR t.pickup_actual_date::date BETWEEN (v_line_item->>'date_out')::date - INTERVAL '30 days' 
                                          AND (v_line_item->>'date_out')::date + INTERVAL '30 days'
      )
    LIMIT 10; -- Limit to top 10 matches per line item

    -- Determine overall match type based on best confidence score
    IF v_tms_matches IS NOT NULL AND jsonb_array_length(v_tms_matches) > 0 THEN
      -- Get the maximum confidence from all matches
      SELECT MAX((match->>'confidence')::integer)
      INTO v_max_confidence
      FROM jsonb_array_elements(v_tms_matches) AS match;
      
      v_confidence := v_max_confidence;
      
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
      -- No matches found
      v_match_type := 'mismatch';
      v_mismatch_count := v_mismatch_count + 1;
      v_confidence := 0;
      v_tms_matches := '[]'::jsonb;
    END IF;

    -- Build row result with all matched TMS records
    v_rows := v_rows || jsonb_build_object(
      'line_invoice_number', v_line_item->>'line_invoice_number',
      'chassis', v_chassis,
      'container', v_container,
      'match_confidence', v_confidence,
      'match_type', v_match_type,
      'tms_matches', v_tms_matches,
      'match_count', COALESCE(jsonb_array_length(v_tms_matches), 0)
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