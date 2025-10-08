-- Temporarily allow public access to invoice-files bucket for testing
-- IMPORTANT: Replace with proper authentication in production

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Allow authenticated uploads to invoice-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from invoice-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to invoice-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from invoice-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete invoice files" ON storage.objects;

-- Create public access policies for testing
CREATE POLICY "Public can upload to invoice-files"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Public can read from invoice-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoice-files');

CREATE POLICY "Public can update invoice-files"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'invoice-files')
WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Public can delete from invoice-files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'invoice-files');