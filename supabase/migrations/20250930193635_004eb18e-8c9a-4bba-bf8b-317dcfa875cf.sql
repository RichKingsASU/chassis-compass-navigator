-- Create staging table for DCLI invoice data before validation
CREATE TABLE IF NOT EXISTS public.dcli_invoice_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Invoice header data
  summary_invoice_id text NOT NULL,
  invoice_date date,
  due_date date,
  billing_date date,
  account_code text,
  vendor text,
  total_amount numeric,
  status text DEFAULT 'staged',
  currency text DEFAULT 'USD',
  
  -- Attachments
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Line items as JSONB array
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Excel headers
  excel_headers jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.dcli_invoice_staging ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (matching other tables)
CREATE POLICY "Public access to dcli_invoice_staging"
ON public.dcli_invoice_staging
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_dcli_invoice_staging_updated_at
  BEFORE UPDATE ON public.dcli_invoice_staging
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();