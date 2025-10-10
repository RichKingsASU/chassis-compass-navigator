-- Create storage buckets for vendor invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('dcli-invoices', 'dcli-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('ccm-invoices', 'ccm-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('trac-invoices', 'trac-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('flexivan-invoices', 'flexivan-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('wccp-invoices', 'wccp-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('scspa-invoices', 'scspa-invoices', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for DCLI invoices bucket
CREATE POLICY "Allow authenticated uploads to dcli-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dcli-invoices');

CREATE POLICY "Allow authenticated reads from dcli-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'dcli-invoices');

CREATE POLICY "Allow authenticated deletes from dcli-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dcli-invoices');

-- Create RLS policies for CCM invoices bucket
CREATE POLICY "Allow authenticated uploads to ccm-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ccm-invoices');

CREATE POLICY "Allow authenticated reads from ccm-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ccm-invoices');

CREATE POLICY "Allow authenticated deletes from ccm-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ccm-invoices');

-- Create RLS policies for TRAC invoices bucket
CREATE POLICY "Allow authenticated uploads to trac-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trac-invoices');

CREATE POLICY "Allow authenticated reads from trac-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trac-invoices');

CREATE POLICY "Allow authenticated deletes from trac-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trac-invoices');

-- Create RLS policies for FLEXIVAN invoices bucket
CREATE POLICY "Allow authenticated uploads to flexivan-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'flexivan-invoices');

CREATE POLICY "Allow authenticated reads from flexivan-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'flexivan-invoices');

CREATE POLICY "Allow authenticated deletes from flexivan-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'flexivan-invoices');

-- Create RLS policies for WCCP invoices bucket
CREATE POLICY "Allow authenticated uploads to wccp-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wccp-invoices');

CREATE POLICY "Allow authenticated reads from wccp-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'wccp-invoices');

CREATE POLICY "Allow authenticated deletes from wccp-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wccp-invoices');

-- Create RLS policies for SCSPA invoices bucket
CREATE POLICY "Allow authenticated uploads to scspa-invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scspa-invoices');

CREATE POLICY "Allow authenticated reads from scspa-invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scspa-invoices');

CREATE POLICY "Allow authenticated deletes from scspa-invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scspa-invoices');