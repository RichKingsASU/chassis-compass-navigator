-- Create CCM invoice table
CREATE TABLE IF NOT EXISTS public.ccm_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT DEFAULT 'CCM',
  total_amount_usd NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CCM invoice data table for line items
CREATE TABLE IF NOT EXISTS public.ccm_invoice_data (
  id BIGSERIAL PRIMARY KEY,
  invoice_id UUID REFERENCES public.ccm_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT,
  row_data JSONB,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.ccm_invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccm_invoice_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ccm_invoice
CREATE POLICY "Allow authenticated users to read ccm_invoice"
  ON public.ccm_invoice
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert ccm_invoice"
  ON public.ccm_invoice
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ccm_invoice"
  ON public.ccm_invoice
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete ccm_invoice"
  ON public.ccm_invoice
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for ccm_invoice_data
CREATE POLICY "Allow authenticated users to read ccm_invoice_data"
  ON public.ccm_invoice_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert ccm_invoice_data"
  ON public.ccm_invoice_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ccm_invoice_data"
  ON public.ccm_invoice_data
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete ccm_invoice_data"
  ON public.ccm_invoice_data
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_number ON public.ccm_invoice(invoice_number);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_date ON public.ccm_invoice(invoice_date);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_status ON public.ccm_invoice(status);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_data_invoice_id ON public.ccm_invoice_data(invoice_id);