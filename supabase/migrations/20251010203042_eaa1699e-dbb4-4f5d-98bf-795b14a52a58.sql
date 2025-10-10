-- Create missing storage bucket for BlackBerry Radar
INSERT INTO storage.buckets (id, name, public)
VALUES ('gps-blackberry-radar', 'gps-blackberry-radar', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for BlackBerry Radar bucket
CREATE POLICY "Allow authenticated users to view BlackBerry Radar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Allow authenticated users to upload BlackBerry Radar files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Allow authenticated users to update BlackBerry Radar files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gps-blackberry-radar');

CREATE POLICY "Allow authenticated users to delete BlackBerry Radar files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gps-blackberry-radar');