-- Create staging table for DCLI invoice validation
CREATE TABLE IF NOT EXISTS public.dcli_invoice_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_invoice_id text,
  billing_date date,
  due_date date,
  billing_terms text,
  vendor text DEFAULT 'DCLI',
  currency_code text DEFAULT 'USD',
  amount_due numeric,
  status text DEFAULT 'pending_validation',
  account_code text,
  pool text,
  pdf_path text,
  excel_path text,
  source_hash text,
  validation_status text DEFAULT 'pending',
  validation_results jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  processed_at timestamp with time zone
);

-- Create staging line items table
CREATE TABLE IF NOT EXISTS public.dcli_invoice_line_staging (
  id bigserial PRIMARY KEY,
  staging_invoice_id uuid REFERENCES public.dcli_invoice_staging(id) ON DELETE CASCADE,
  line_index integer,
  invoice_type text,
  line_invoice_number text,
  invoice_status text,
  invoice_total numeric,
  remaining_balance numeric,
  dispute_status text,
  attachment_count integer,
  chassis_out text,
  container_out text,
  date_out timestamp with time zone,
  container_in text,
  date_in timestamp with time zone,
  tms_match_id text,
  tms_match_type text,
  tms_match_confidence numeric,
  validation_issues jsonb,
  raw jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dcli_invoice_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcli_invoice_line_staging ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "auth read staging" ON public.dcli_invoice_staging FOR SELECT USING (true);
CREATE POLICY "auth write staging" ON public.dcli_invoice_staging FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update staging" ON public.dcli_invoice_staging FOR UPDATE USING (true);
CREATE POLICY "auth delete staging" ON public.dcli_invoice_staging FOR DELETE USING (true);

CREATE POLICY "auth read line staging" ON public.dcli_invoice_line_staging FOR SELECT USING (true);
CREATE POLICY "auth write line staging" ON public.dcli_invoice_line_staging FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update line staging" ON public.dcli_invoice_line_staging FOR UPDATE USING (true);
CREATE POLICY "auth delete line staging" ON public.dcli_invoice_line_staging FOR DELETE USING (true);

-- Function to validate DCLI invoice against TMS
CREATE OR REPLACE FUNCTION public.validate_dcli_invoice_staging(
  p_staging_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
  v_summary jsonb;
  v_line record;
  v_tms_matches jsonb;
  v_best_match record;
  v_match_type text;
  v_match_confidence numeric;
BEGIN
  -- Initialize results
  v_results := '[]'::jsonb;
  
  -- Loop through staging line items
  FOR v_line IN 
    SELECT * FROM dcli_invoice_line_staging 
    WHERE staging_invoice_id = p_staging_id
  LOOP
    -- Find TMS matches by chassis
    SELECT jsonb_agg(row_to_json(t.*))
    INTO v_tms_matches
    FROM tms_mg t
    WHERE t.chassis_number = v_line.chassis_out
       OR t.chassis_number = v_line.chassis_out;
    
    -- Determine best match (simplified logic)
    IF v_tms_matches IS NOT NULL AND jsonb_array_length(v_tms_matches) > 0 THEN
      v_match_type := 'exact';
      v_match_confidence := 80;
    ELSE
      v_match_type := 'mismatch';
      v_match_confidence := 0;
    END IF;
    
    -- Update line item with validation results
    UPDATE dcli_invoice_line_staging
    SET 
      tms_match_type = v_match_type,
      tms_match_confidence = v_match_confidence,
      validation_issues = CASE 
        WHEN v_match_type = 'mismatch' THEN '["No matching TMS record found"]'::jsonb
        ELSE '[]'::jsonb
      END
    WHERE id = v_line.id;
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'line_id', v_line.id,
      'match_type', v_match_type,
      'match_confidence', v_match_confidence
    );
  END LOOP;
  
  -- Calculate summary
  SELECT jsonb_build_object(
    'total_rows', COUNT(*),
    'exact_matches', COUNT(*) FILTER (WHERE tms_match_type = 'exact'),
    'fuzzy_matches', COUNT(*) FILTER (WHERE tms_match_type = 'fuzzy'),
    'mismatches', COUNT(*) FILTER (WHERE tms_match_type = 'mismatch')
  )
  INTO v_summary
  FROM dcli_invoice_line_staging
  WHERE staging_invoice_id = p_staging_id;
  
  -- Update staging invoice
  UPDATE dcli_invoice_staging
  SET 
    validation_status = 'completed',
    validation_results = jsonb_build_object(
      'summary', v_summary,
      'results', v_results
    )
  WHERE id = p_staging_id;
  
  RETURN jsonb_build_object(
    'ok', true,
    'summary', v_summary,
    'results', v_results
  );
END;
$$;

-- Function to move staging data to raw table after validation
CREATE OR REPLACE FUNCTION public.approve_dcli_invoice_staging(
  p_staging_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staging record;
  v_line record;
  v_raw_id bigint;
BEGIN
  -- Get staging invoice
  SELECT * INTO v_staging
  FROM dcli_invoice_staging
  WHERE id = p_staging_id;
  
  IF v_staging IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staging invoice not found');
  END IF;
  
  -- Insert line items into raw table
  FOR v_line IN 
    SELECT * FROM dcli_invoice_line_staging 
    WHERE staging_invoice_id = p_staging_id
  LOOP
    INSERT INTO dcli_invoice_raw (
      invoice_id,
      line_index,
      chassis,
      on_hire_container,
      off_hire_container,
      on_hire_date,
      off_hire_date,
      invoice_number,
      summary_invoice_number,
      billing_date,
      due_date,
      billing_terms,
      grand_total,
      raw
    ) VALUES (
      p_staging_id,
      v_line.line_index,
      v_line.chassis_out,
      v_line.container_out,
      v_line.container_in,
      v_line.date_out,
      v_line.date_in,
      v_line.line_invoice_number,
      v_staging.summary_invoice_id,
      v_staging.billing_date,
      v_staging.due_date,
      v_staging.billing_terms,
      v_line.invoice_total,
      v_line.raw
    );
  END LOOP;
  
  -- Update staging status
  UPDATE dcli_invoice_staging
  SET 
    status = 'approved',
    processed_at = now()
  WHERE id = p_staging_id;
  
  RETURN jsonb_build_object('ok', true, 'message', 'Invoice approved and moved to raw table');
END;
$$;