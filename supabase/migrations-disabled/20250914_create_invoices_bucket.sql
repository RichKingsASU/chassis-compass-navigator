-- Create a new storage bucket named 'invoices'
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to all files in the invoices bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR ALL USING (bucket_id = 'invoices');

-- Update ccm_invoice table to include file information
ALTER TABLE public.ccm_invoice ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.ccm_invoice ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.ccm_invoice ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.ccm_invoice ADD COLUMN IF NOT EXISTS status TEXT;