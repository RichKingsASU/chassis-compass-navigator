-- Enable RLS on mg_tms table
ALTER TABLE mg_tms ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to mg_tms
CREATE POLICY "Allow public read access to mg_tms"
ON mg_tms
FOR SELECT
TO public
USING (true);