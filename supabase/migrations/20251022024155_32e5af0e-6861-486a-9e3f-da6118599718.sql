-- Update RLS policy for fleetlocate_daily_asset_report to allow public read access
DROP POLICY IF EXISTS "read_authed" ON fleetlocate_daily_asset_report;

CREATE POLICY "allow_public_read" 
ON fleetlocate_daily_asset_report 
FOR SELECT 
USING (true);