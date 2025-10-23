-- WARNING: This completely disables storage security for testing
-- DO NOT use in production

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Allow all uploads to gps-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from gps-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to gps-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from gps-uploads" ON storage.objects;

-- Create completely permissive policies for ALL storage buckets
CREATE POLICY "Allow all storage uploads for testing"
ON storage.objects
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all storage reads for testing"
ON storage.objects
FOR SELECT
USING (true);

CREATE POLICY "Allow all storage updates for testing"
ON storage.objects
FOR UPDATE
USING (true);

CREATE POLICY "Allow all storage deletes for testing"
ON storage.objects
FOR DELETE
USING (true);