-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload invoice files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow authenticated users to read invoice files
CREATE POLICY "Users can read invoice files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Users can update invoice files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Allow authenticated users to delete their uploaded files
CREATE POLICY "Users can delete invoice files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');