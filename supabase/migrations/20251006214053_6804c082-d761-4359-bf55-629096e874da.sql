-- Create invoice_lines table for invoice validation
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  match_score NUMERIC(5,2) DEFAULT 0,
  exact_match BOOLEAN DEFAULT false,
  mismatch_reasons JSONB DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  dispute_status TEXT,
  dispute_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on invoice_lines"
  ON public.invoice_lines
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_invoice_lines_invoice_number ON public.invoice_lines(invoice_number);
CREATE INDEX idx_invoice_lines_status ON public.invoice_lines(status);

-- RPC function: validate_invoice_line
CREATE OR REPLACE FUNCTION public.validate_invoice_line(line_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invoice_lines
  SET 
    status = 'validated',
    validated_at = now(),
    validated_by = auth.uid()::text
  WHERE id = line_id;
END;
$$;

-- RPC function: open_dispute
CREATE OR REPLACE FUNCTION public.open_dispute(
  line_id UUID,
  reason TEXT,
  note TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_entry JSONB;
BEGIN
  new_entry := jsonb_build_object(
    'timestamp', now(),
    'action', 'opened',
    'reason', reason,
    'note', note,
    'user', auth.uid()::text
  );
  
  UPDATE public.invoice_lines
  SET 
    dispute_status = 'in_dispute',
    dispute_history = dispute_history || new_entry,
    updated_at = now()
  WHERE id = line_id;
END;
$$;

-- RPC function: close_dispute
CREATE OR REPLACE FUNCTION public.close_dispute(
  line_id UUID,
  note TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_entry JSONB;
BEGIN
  new_entry := jsonb_build_object(
    'timestamp', now(),
    'action', 'closed',
    'note', note,
    'user', auth.uid()::text
  );
  
  UPDATE public.invoice_lines
  SET 
    dispute_status = 'resolved',
    dispute_history = dispute_history || new_entry,
    updated_at = now()
  WHERE id = line_id;
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_invoice_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_lines_updated_at
  BEFORE UPDATE ON public.invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_lines_updated_at();