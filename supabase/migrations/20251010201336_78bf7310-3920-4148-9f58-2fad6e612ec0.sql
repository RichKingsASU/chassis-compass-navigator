-- Create storage buckets for Yard Reports
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('yard-jed', 'yard-jed', false),
  ('yard-pola', 'yard-pola', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for Yard Report buckets
-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view Yard files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id IN ('yard-jed', 'yard-pola'));

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload Yard files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('yard-jed', 'yard-pola'));

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update Yard files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id IN ('yard-jed', 'yard-pola'));

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete Yard files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id IN ('yard-jed', 'yard-pola'));