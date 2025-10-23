-- Fix storage bucket RLS policies for invoice-files
-- Allow authenticated users to upload and manage files

CREATE POLICY "Allow authenticated uploads to invoice-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Allow authenticated reads from invoice-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-files');

CREATE POLICY "Allow authenticated updates to invoice-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoice-files')
WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Allow authenticated deletes from invoice-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-files');