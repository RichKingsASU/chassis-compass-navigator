-- ============================================================================
-- DCLI matcher + validator
--   * match_dcli_line_items(p_invoice_id uuid) — activity/TMS matching
--   * validate_dcli_line_items(p_invoice_id uuid) — day variance + LD/SO coverage
--   * Adds day_variance, validation_status, validation_findings, validated_at,
--     matched_at columns to dcli_invoice_line_item.
--
-- Facts (from live DB inspection):
--   - dcli_invoice.id is uuid, unique.
--   - dcli_invoice_line_item.invoice_id is text (stores the uuid as text);
--     joins use `invoice_id = p_invoice_id::text`.
--   - dcli_invoice_line_item.chassis/date_out/date_in are text; cast via
--     NULLIF(value,'')::date.
--   - dcli_activity exists already with chassis/date_out/date_in/invoice_number.
--   - mg_tms is a view over mg_data; chassis_number contains spaces and must
--     be normalised with UPPER(REGEXP_REPLACE(chassis_number,'\s+','','g')).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Ensure required columns exist on dcli_invoice_line_item
-- --------------------------------------------------------------------------
ALTER TABLE public.dcli_invoice_line_item
  ADD COLUMN IF NOT EXISTS day_variance        integer,
  ADD COLUMN IF NOT EXISTS validation_status   text,
  ADD COLUMN IF NOT EXISTS validation_findings jsonb,
  ADD COLUMN IF NOT EXISTS validated_at        timestamptz,
  ADD COLUMN IF NOT EXISTS matched_at          timestamptz;

CREATE INDEX IF NOT EXISTS ix_dcli_invoice_line_item_validation_status
  ON public.dcli_invoice_line_item (validation_status);

-- --------------------------------------------------------------------------
-- match_dcli_line_items
--   Strong match: dcli_activity exact chassis + overlapping window (conf 1.0)
--   Fuzzy match:  mg_tms exact chassis + overlapping window         (conf 0.6)
--   Else:         match_type='none', confidence 0
-- --------------------------------------------------------------------------
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

    SELECT id, chassis, container, date_out AS act_out, date_in AS act_in, invoice_number
      INTO v_act
      FROM public.dcli_activity
     WHERE UPPER(REGEXP_REPLACE(COALESCE(chassis,''),'\s+','','g')) = v_cc
       AND (v_dout IS NULL OR date_in  IS NULL OR date_in::date  >= v_dout)
       AND (v_din  IS NULL OR date_out IS NULL OR date_out::date <= v_din)
     ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(date_out, now()) - COALESCE(v_dout::timestamptz, now()))))
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
               'date_in',  v_act.act_in,
               'invoice_number', v_act.invoice_number),
             matched_at=now(), updated_at=now()
       WHERE id = v_line.id;
      v_matched := v_matched + 1;
      CONTINUE;
    END IF;

    SELECT ld_num, so_num, chassis_number, pickup_actual_date, actual_rc_date, pickup_city, delivery_city
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
               'actual_rc_date',    v_tms.actual_rc_date,
               'pickup_city',   v_tms.pickup_city,
               'delivery_city', v_tms.delivery_city),
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

-- --------------------------------------------------------------------------
-- validate_dcli_line_items
--   Per line: sum Forrest-load days (mg_tms) for this chassis whose
--   [pickup_actual_date, actual_rc_date] overlaps [line.date_out, line.date_in].
--   Days counted are the TRIMMED overlap days inside the billed window.
--   day_variance = billed_days - tms_days_in_window.
--   Always populates covering LD/SO list when any loads overlap.
--   If chassis not found in mg_tms at all in the window → variance NULL,
--   status='skipped', findings record the reason.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_dcli_line_items(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_total    int := 0;
  v_pass     int := 0;
  v_fail     int := 0;
  v_warn     int := 0;
  v_skipped  int := 0;
  v_line     record;
  v_cc       text;
  v_dout     date;
  v_din      date;
  v_billed   int;
  v_tms_days int;
  v_variance int;
  v_lds      text[];
  v_sos      text[];
  v_status   text;
  v_findings jsonb;
BEGIN
  FOR v_line IN
    SELECT id, chassis, date_out, date_in, days_used, line_total
    FROM public.dcli_invoice_line_item
    WHERE invoice_id = p_invoice_id::text
  LOOP
    v_total    := v_total + 1;
    v_findings := '[]'::jsonb;
    v_cc       := UPPER(REGEXP_REPLACE(COALESCE(v_line.chassis,''), '\s+','','g'));
    v_dout     := NULLIF(v_line.date_out,'')::date;
    v_din      := NULLIF(v_line.date_in, '')::date;
    v_billed   := COALESCE(v_line.days_used, 0)::int;
    v_variance := NULL;
    v_lds      := NULL;
    v_sos      := NULL;

    IF v_cc = '' OR v_dout IS NULL OR v_din IS NULL THEN
      v_status   := 'skipped';
      v_findings := v_findings || jsonb_build_array(jsonb_build_object(
        'code','INSUFFICIENT_DATA',
        'severity','info',
        'message','Line missing chassis or billed date range'));
      UPDATE public.dcli_invoice_line_item
         SET day_variance=NULL,
             validation_status=v_status,
             validation_findings=v_findings,
             validated_at=now(),
             updated_at=now()
       WHERE id = v_line.id;
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Sum TMS days where the load window overlaps the billed window,
    -- clipped to the billed window so partial-month days count correctly.
    -- Also collect the LDs/SOs covering those days.
    WITH overlapping AS (
      SELECT
        t.ld_num,
        t.so_num,
        GREATEST(v_dout, t.pickup_actual_date::date) AS ov_start,
        LEAST   (v_din,  t.actual_rc_date::date)     AS ov_end
      FROM public.mg_tms t
      WHERE UPPER(REGEXP_REPLACE(COALESCE(t.chassis_number,''),'\s+','','g')) = v_cc
        AND t.pickup_actual_date IS NOT NULL
        AND t.actual_rc_date     IS NOT NULL
        AND t.pickup_actual_date::date <= v_din
        AND t.actual_rc_date::date     >= v_dout
    )
    SELECT
      COALESCE(SUM(GREATEST(0, (ov_end - ov_start) + 1)),0)::int,
      ARRAY_AGG(DISTINCT ld_num) FILTER (WHERE ld_num IS NOT NULL),
      ARRAY_AGG(DISTINCT so_num) FILTER (WHERE so_num IS NOT NULL)
    INTO v_tms_days, v_lds, v_sos
    FROM overlapping;

    IF v_tms_days IS NULL OR v_tms_days = 0 THEN
      -- chassis absent from mg_tms during this window
      v_status   := 'skipped';
      v_variance := NULL;
      v_findings := v_findings || jsonb_build_array(jsonb_build_object(
        'code','CHASSIS_NOT_IN_TMS',
        'severity','info',
        'message','Chassis not present in mg_tms during billed window',
        'billed_days', v_billed));
    ELSE
      v_variance := v_billed - v_tms_days;

      IF v_variance = 0 THEN
        v_status := 'pass';
        v_findings := v_findings || jsonb_build_array(jsonb_build_object(
          'code','DAYS_MATCH',
          'severity','info',
          'message','Billed days match TMS coverage within window',
          'billed_days', v_billed,
          'tms_days',    v_tms_days));
      ELSIF v_variance > 0 THEN
        v_status := 'fail';
        v_findings := v_findings || jsonb_build_array(jsonb_build_object(
          'code','OVERBILL_DAYS',
          'severity','fail',
          'message','Vendor billed more days than TMS shows in window',
          'billed_days', v_billed,
          'tms_days',    v_tms_days,
          'variance',    v_variance));
      ELSE
        v_status := 'warn';
        v_findings := v_findings || jsonb_build_array(jsonb_build_object(
          'code','UNDERBILL_OR_SPLIT',
          'severity','warn',
          'message','Vendor billed fewer days than TMS shows (may be a month split with adjacent invoice)',
          'billed_days', v_billed,
          'tms_days',    v_tms_days,
          'variance',    v_variance));
      END IF;

      -- Always include coverage detail when TMS overlap exists
      v_findings := v_findings || jsonb_build_array(jsonb_build_object(
        'code','TMS_COVERAGE',
        'severity','info',
        'message','TMS loads covering this chassis in window',
        'lds', COALESCE(v_lds, '{}'::text[]),
        'sos', COALESCE(v_sos, '{}'::text[]),
        'ld_count',  COALESCE(array_length(v_lds,1),0),
        'so_count',  COALESCE(array_length(v_sos,1),0)));

      IF COALESCE(array_length(v_lds,1),0) > 1 OR COALESCE(array_length(v_sos,1),0) > 1 THEN
        v_findings := v_findings || jsonb_build_array(jsonb_build_object(
          'code','MULTI_LD_SO',
          'severity','info',
          'message','Multiple LDs or SOs covered this chassis during the billed window',
          'lds', COALESCE(v_lds, '{}'::text[]),
          'sos', COALESCE(v_sos, '{}'::text[])));
      END IF;
    END IF;

    UPDATE public.dcli_invoice_line_item
       SET day_variance       = v_variance,
           validation_status  = v_status,
           validation_findings= v_findings,
           validated_at       = now(),
           updated_at         = now()
     WHERE id = v_line.id;

    IF    v_status = 'pass'    THEN v_pass    := v_pass    + 1;
    ELSIF v_status = 'fail'    THEN v_fail    := v_fail    + 1;
    ELSIF v_status = 'warn'    THEN v_warn    := v_warn    + 1;
    ELSE                            v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'total',   v_total,
    'pass',    v_pass,
    'fail',    v_fail,
    'warn',    v_warn,
    'skipped', v_skipped
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_dcli_line_items(uuid) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
