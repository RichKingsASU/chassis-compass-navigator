-- Create storage buckets for GPS providers
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('gps-samsara', 'gps-samsara', false),
  ('gps-anytrek', 'gps-anytrek', false),
  ('gps-fleetview', 'gps-fleetview', false),
  ('gps-fleetlocate', 'gps-fleetlocate', false),
  ('gps-blackberry', 'gps-blackberry', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for GPS provider buckets
-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view GPS files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id IN ('gps-samsara', 'gps-anytrek', 'gps-fleetview', 'gps-fleetlocate', 'gps-blackberry'));

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload GPS files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('gps-samsara', 'gps-anytrek', 'gps-fleetview', 'gps-fleetlocate', 'gps-blackberry'));

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update GPS files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id IN ('gps-samsara', 'gps-anytrek', 'gps-fleetview', 'gps-fleetlocate', 'gps-blackberry'));

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete GPS files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id IN ('gps-samsara', 'gps-anytrek', 'gps-fleetview', 'gps-fleetlocate', 'gps-blackberry'));