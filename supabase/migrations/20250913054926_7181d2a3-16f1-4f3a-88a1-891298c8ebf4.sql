-- Create CCM Invoice table
CREATE TABLE public.ccm_invoice (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'CCM',
  total_amount_usd DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CCM Invoice Data table for Excel parsing results
CREATE TABLE public.ccm_invoice_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.ccm_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ccm_invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccm_invoice_data ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (since this appears to be an internal business app)
CREATE POLICY "Allow all operations on ccm_invoice" 
ON public.ccm_invoice 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on ccm_invoice_data" 
ON public.ccm_invoice_data 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ccm_invoice_updated_at
  BEFORE UPDATE ON public.ccm_invoice
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ccm_invoice_provider ON public.ccm_invoice(provider);
CREATE INDEX idx_ccm_invoice_status ON public.ccm_invoice(status);
CREATE INDEX idx_ccm_invoice_date ON public.ccm_invoice(invoice_date);
CREATE INDEX idx_ccm_invoice_data_invoice_id ON public.ccm_invoice_data(invoice_id);
CREATE INDEX idx_ccm_invoice_data_sheet ON public.ccm_invoice_data(sheet_name);