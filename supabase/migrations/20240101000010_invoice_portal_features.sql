ALTER TABLE public.dcli_invoice
  ADD COLUMN IF NOT EXISTS portal_status   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.dcli_invoice_line_item
  ADD COLUMN IF NOT EXISTS portal_status   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dispute_reason  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dispute_notes   TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.dcli_invoice_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID        NOT NULL REFERENCES public.dcli_invoice(id) ON DELETE CASCADE,
  line_item_id     UUID        REFERENCES public.dcli_invoice_line_item(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL,
  from_status      TEXT        DEFAULT NULL,
  to_status        TEXT        DEFAULT NULL,
  note             TEXT        DEFAULT NULL,
  metadata         JSONB       NOT NULL DEFAULT '{}',
  created_by_email TEXT        DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dcli_invoice_documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID        NOT NULL REFERENCES public.dcli_invoice(id) ON DELETE CASCADE,
  line_item_id     UUID        REFERENCES public.dcli_invoice_line_item(id) ON DELETE CASCADE,
  storage_path     TEXT        NOT NULL,
  original_name    TEXT        NOT NULL,
  file_type        TEXT        NOT NULL DEFAULT 'other',
  file_size_bytes  BIGINT      DEFAULT NULL,
  document_role    TEXT        NOT NULL DEFAULT 'supporting',
  uploaded_by_email TEXT       DEFAULT NULL,
  note             TEXT        DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dcli_invoice_events_invoice_id
  ON public.dcli_invoice_events(invoice_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dcli_invoice_events_line_item_id
  ON public.dcli_invoice_events(line_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dcli_invoice_documents_invoice_id
  ON public.dcli_invoice_documents(invoice_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.dcli_invoice_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcli_invoice_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON public.dcli_invoice_events;
CREATE POLICY "events_select" ON public.dcli_invoice_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "events_insert" ON public.dcli_invoice_events;
CREATE POLICY "events_insert" ON public.dcli_invoice_events
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "documents_select" ON public.dcli_invoice_documents;
CREATE POLICY "documents_select" ON public.dcli_invoice_documents
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "documents_insert" ON public.dcli_invoice_documents;
CREATE POLICY "documents_insert" ON public.dcli_invoice_documents
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "documents_update" ON public.dcli_invoice_documents;
CREATE POLICY "documents_update" ON public.dcli_invoice_documents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
