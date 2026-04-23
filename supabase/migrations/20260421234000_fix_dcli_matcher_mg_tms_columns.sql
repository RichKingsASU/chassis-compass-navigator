-- ============================================================================
-- Second fix for match_dcli_line_items: mg_tms does not expose pickup_city /
-- delivery_city on this local DB either. Drop them from the SELECT and the
-- tms_match jsonb payload. Keep only the columns the validator has already
-- proven exist: ld_num, so_num, chassis_number, pickup_actual_date,
-- actual_rc_date.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_dcli_line_items(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_total   int := 0;
  v_matched int := 0;
  v_fuzzy   int := 0;
  v_none    int := 0;
  v_line    record;
  v_act     record;
  v_tms     record;
  v_cc      text;
  v_dout    date;
  v_din     date;
BEGIN
  FOR v_line IN
    SELECT id, chassis, date_out, date_in
    FROM public.dcli_invoice_line_item
    WHERE invoice_id = p_invoice_id::text
  LOOP
    v_total := v_total + 1;
    v_cc   := UPPER(REGEXP_REPLACE(COALESCE(v_line.chassis,''), '\s+','','g'));
    v_dout := NULLIF(v_line.date_out,'')::date;
    v_din  := NULLIF(v_line.date_in, '')::date;

    IF v_cc = '' THEN
      UPDATE public.dcli_invoice_line_item
         SET match_type='none', match_confidence=0, tms_match=NULL,
             matched_at=now(), updated_at=now()
       WHERE id = v_line.id;
      v_none := v_none + 1;
      CONTINUE;
    END IF;

    SELECT id,
           chassis,
           container,
           NULLIF(date_out,'')::date AS act_out,
           NULLIF(date_in, '')::date AS act_in
      INTO v_act
      FROM public.dcli_activity
     WHERE UPPER(REGEXP_REPLACE(COALESCE(chassis,''),'\s+','','g')) = v_cc
       AND (v_dout IS NULL OR NULLIF(date_in, '')::date IS NULL OR NULLIF(date_in, '')::date >= v_dout)
       AND (v_din  IS NULL OR NULLIF(date_out,'')::date IS NULL OR NULLIF(date_out,'')::date <= v_din)
     ORDER BY ABS(EXTRACT(EPOCH FROM (
                COALESCE(NULLIF(date_out,'')::timestamptz, now())
              - COALESCE(v_dout::timestamptz, now()))))
     LIMIT 1;

    IF FOUND THEN
      UPDATE public.dcli_invoice_line_item
         SET match_type='activity', match_confidence=1.0,
             tms_match=jsonb_build_object(
               'source','dcli_activity',
               'activity_id', v_act.id,
               'chassis', v_act.chassis,
               'container', v_act.container,
               'date_out', v_act.act_out,
               'date_in',  v_act.act_in),
             matched_at=now(), updated_at=now()
       WHERE id = v_line.id;
      v_matched := v_matched + 1;
      CONTINUE;
    END IF;

    -- mg_tms: only reference columns we know exist on the local view
    SELECT ld_num, so_num, chassis_number, pickup_actual_date, actual_rc_date
      INTO v_tms
      FROM public.mg_tms
     WHERE UPPER(REGEXP_REPLACE(COALESCE(chassis_number,''),'\s+','','g')) = v_cc
       AND (v_dout IS NULL OR actual_rc_date      IS NULL OR actual_rc_date::date      >= v_dout)
       AND (v_din  IS NULL OR pickup_actual_date  IS NULL OR pickup_actual_date::date  <= v_din)
     ORDER BY pickup_actual_date DESC
     LIMIT 1;

    IF FOUND THEN
      UPDATE public.dcli_invoice_line_item
         SET match_type='tms', match_confidence=0.6,
             tms_match=jsonb_build_object(
               'source','mg_tms',
               'ld_num', v_tms.ld_num,
               'so_num', v_tms.so_num,
               'chassis_number', v_tms.chassis_number,
               'pickup_actual_date', v_tms.pickup_actual_date,
               'actual_rc_date',    v_tms.actual_rc_date),
             matched_at=now(), updated_at=now()
       WHERE id = v_line.id;
      v_fuzzy := v_fuzzy + 1;
      CONTINUE;
    END IF;

    UPDATE public.dcli_invoice_line_item
       SET match_type='none', match_confidence=0, tms_match=NULL,
           matched_at=now(), updated_at=now()
     WHERE id = v_line.id;
    v_none := v_none + 1;
  END LOOP;

  RETURN jsonb_build_object('total',v_total,'matched',v_matched,'fuzzy',v_fuzzy,'none',v_none);
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_dcli_line_items(uuid) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
