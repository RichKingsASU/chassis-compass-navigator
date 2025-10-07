CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ccm_invoice','ccm_invoice_data'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at timestamptz;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz;', tbl);

    EXECUTE format('UPDATE public.%I SET created_at = COALESCE(created_at, now());', tbl);
    EXECUTE format('UPDATE public.%I SET updated_at = COALESCE(updated_at, now());', tbl);

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_at SET DEFAULT now();', tbl);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN updated_at SET DEFAULT now();', tbl);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_at SET NOT NULL;', tbl);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN updated_at SET NOT NULL;', tbl);

    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = format('set_%s_updated_at', tbl)
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
        format('set_'||tbl||'_updated_at'),
        tbl
      );
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.ccm_invoice') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ccm_invoice ENABLE ROW LEVEL SECURITY;';
  END IF;
  IF to_regclass('public.ccm_invoice_data') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ccm_invoice_data ENABLE ROW LEVEL SECURITY;';
  END IF;
END
$$;
