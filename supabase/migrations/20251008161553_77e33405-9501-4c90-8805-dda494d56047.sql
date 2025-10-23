-- Create TRAC invoice table
CREATE TABLE public.trac_invoice (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount_usd NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'TRAC',
  file_name TEXT,
  file_type TEXT,
  file_path TEXT,
  reason_for_dispute TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create TRAC invoice data table (for Excel line items)
CREATE TABLE public.trac_invoice_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.trac_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create TRAC invoice staging table
CREATE TABLE public.trac_invoice_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_invoice_id TEXT NOT NULL,
  vendor TEXT DEFAULT 'TRAC',
  account_code TEXT,
  status TEXT DEFAULT 'staged',
  currency TEXT DEFAULT 'USD',
  total_amount NUMERIC,
  billing_date DATE,
  due_date DATE,
  invoice_date DATE,
  excel_headers JSONB DEFAULT '[]'::jsonb,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create TRAC activity table
CREATE TABLE public.trac_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number TEXT,
  invoice_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  invoice_amount NUMERIC,
  amount_paid NUMERIC,
  amount_due NUMERIC,
  invoice_status TEXT,
  invoice_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trac_invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trac_invoice_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trac_invoice_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trac_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access for now, similar to other vendor tables)
CREATE POLICY "Allow all operations on trac_invoice" ON public.trac_invoice FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trac_invoice_data" ON public.trac_invoice_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trac_invoice_staging" ON public.trac_invoice_staging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trac_activity" ON public.trac_activity FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_trac_invoice_updated_at
  BEFORE UPDATE ON public.trac_invoice
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trac_invoice_data_updated_at
  BEFORE UPDATE ON public.trac_invoice_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trac_invoice_staging_updated_at
  BEFORE UPDATE ON public.trac_invoice_staging
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();