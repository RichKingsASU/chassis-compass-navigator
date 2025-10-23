-- Create the invoice-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-files',
  'invoice-files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload invoice files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-files'
);

-- Allow authenticated users to read their own files
CREATE POLICY "Authenticated users can read invoice files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-files'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update invoice files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-files'
)
WITH CHECK (
  bucket_id = 'invoice-files'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete invoice files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-files'
);