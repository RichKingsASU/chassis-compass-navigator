-- Create storage buckets for all equipment vendors
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('ccm-invoices', 'ccm-invoices', true),
  ('trac-invoices', 'trac-invoices', true),
  ('flexivan-invoices', 'flexivan-invoices', true),
  ('scspa-invoices', 'scspa-invoices', true),
  ('wccp-invoices', 'wccp-invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for CCM bucket
CREATE POLICY "Anyone can upload CCM invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'ccm-invoices');

CREATE POLICY "Anyone can read CCM invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ccm-invoices');

CREATE POLICY "Anyone can update CCM invoices"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'ccm-invoices');

CREATE POLICY "Anyone can delete CCM invoices"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'ccm-invoices');

-- Create RLS policies for TRAC bucket
CREATE POLICY "Anyone can upload TRAC invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'trac-invoices');

CREATE POLICY "Anyone can read TRAC invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trac-invoices');

CREATE POLICY "Anyone can update TRAC invoices"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'trac-invoices');

CREATE POLICY "Anyone can delete TRAC invoices"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'trac-invoices');

-- Create RLS policies for FLEXIVAN bucket
CREATE POLICY "Anyone can upload FLEXIVAN invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'flexivan-invoices');

CREATE POLICY "Anyone can read FLEXIVAN invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'flexivan-invoices');

CREATE POLICY "Anyone can update FLEXIVAN invoices"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'flexivan-invoices');

CREATE POLICY "Anyone can delete FLEXIVAN invoices"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'flexivan-invoices');

-- Create RLS policies for SCSPA bucket
CREATE POLICY "Anyone can upload SCSPA invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'scspa-invoices');

CREATE POLICY "Anyone can read SCSPA invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'scspa-invoices');

CREATE POLICY "Anyone can update SCSPA invoices"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'scspa-invoices');

CREATE POLICY "Anyone can delete SCSPA invoices"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'scspa-invoices');

-- Create RLS policies for WCCP bucket
CREATE POLICY "Anyone can upload WCCP invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'wccp-invoices');

CREATE POLICY "Anyone can read WCCP invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wccp-invoices');

CREATE POLICY "Anyone can update WCCP invoices"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'wccp-invoices');

CREATE POLICY "Anyone can delete WCCP invoices"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'wccp-invoices');