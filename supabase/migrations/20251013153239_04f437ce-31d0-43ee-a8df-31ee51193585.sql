-- WARNING: These policies are PERMISSIVE for testing only
-- DO NOT use in production without proper authentication checks

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create permissive storage policies for gps-uploads bucket
CREATE POLICY "Allow all uploads to gps-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gps-uploads');

CREATE POLICY "Allow all reads from gps-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gps-uploads');

CREATE POLICY "Allow all updates to gps-uploads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gps-uploads');

CREATE POLICY "Allow all deletes from gps-uploads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gps-uploads');

-- Make gps_uploads table permissive for testing
DROP POLICY IF EXISTS "Users can insert their own uploads" ON public.gps_uploads;
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.gps_uploads;

CREATE POLICY "Allow all inserts to gps_uploads"
ON public.gps_uploads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all reads from gps_uploads"
ON public.gps_uploads
FOR SELECT
USING (true);

CREATE POLICY "Allow all updates to gps_uploads"
ON public.gps_uploads
FOR UPDATE
USING (true);

CREATE POLICY "Allow all deletes from gps_uploads"
ON public.gps_uploads
FOR DELETE
USING (true);