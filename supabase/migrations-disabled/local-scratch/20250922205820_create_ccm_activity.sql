CREATE TABLE IF NOT EXISTS public.ccm_activity (
  id         bigserial PRIMARY KEY,
  invoice_id uuid,
  action     text        NOT NULL,
  details    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  actor      uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.ccm_activity_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_ccm_activity_updated_at') THEN
    CREATE TRIGGER set_ccm_activity_updated_at
    BEFORE UPDATE ON public.ccm_activity
    FOR EACH ROW EXECUTE FUNCTION public.ccm_activity_set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ccm_activity_created_at ON public.ccm_activity (created_at);
CREATE INDEX IF NOT EXISTS idx_ccm_activity_invoice_id ON public.ccm_activity (invoice_id);

DO $$
BEGIN
  IF to_regclass('public.ccm_invoice') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ccm_activity_invoice_id_fkey') THEN
    ALTER TABLE public.ccm_activity
      ADD CONSTRAINT ccm_activity_invoice_id_fkey
      FOREIGN KEY (invoice_id)
      REFERENCES public.ccm_invoice(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ccm_activity_actor_fkey') THEN
    ALTER TABLE public.ccm_activity
      ADD CONSTRAINT ccm_activity_actor_fkey
      FOREIGN KEY (actor)
      REFERENCES auth.users(id);
  END IF;
END $$;

ALTER TABLE public.ccm_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ccm_activity' AND policyname = 'ccm_activity_all'
  ) THEN
    CREATE POLICY "ccm_activity_all"
    ON public.ccm_activity
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
