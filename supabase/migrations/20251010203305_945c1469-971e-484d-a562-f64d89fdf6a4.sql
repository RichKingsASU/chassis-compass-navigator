-- Update BlackBerry Radar bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'gps-blackberry-radar';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to view BlackBerry Radar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload BlackBerry Radar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update BlackBerry Radar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete BlackBerry Radar files" ON storage.objects;

-- Create permissive policies for anonymous access
CREATE POLICY "Anyone can upload to BlackBerry Radar bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Anyone can view BlackBerry Radar files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Anyone can update BlackBerry Radar files"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Anyone can delete BlackBerry Radar files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'gps-blackberry-radar');