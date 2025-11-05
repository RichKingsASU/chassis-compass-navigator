-- Import Fleetlocate chassis into chassis_master
-- Only insert chassis that don't already exist in chassis_master

INSERT INTO chassis_master (
  forrest_chz_id,
  serial_number,
  forrest_chassis_type,
  chassis_status,
  chassis_category,
  region,
  manufacturer,
  description,
  notes
)
SELECT DISTINCT
  fl."Asset ID" as forrest_chz_id,
  fl."Serial Number" as serial_number,
  CASE 
    WHEN fl."Asset ID" LIKE 'FRQZ%' THEN '40HC'
    WHEN fl."Asset ID" LIKE 'FRHC%' THEN '45HC'
    ELSE 'Unknown'
  END as forrest_chassis_type,
  'Available' as chassis_status,
  'Pool' as chassis_category,
  'West' as region,
  COALESCE(fl."Device", 'Fleetlocate') as manufacturer,
  'Imported from Fleetlocate GPS data' as description,
  'Auto-imported from fleetlocate_stg table on ' || CURRENT_DATE::text as notes
FROM fleetlocate_stg fl
WHERE fl."Asset ID" IS NOT NULL
  AND fl."Asset ID" != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM chassis_master cm 
    WHERE cm.forrest_chz_id = fl."Asset ID"
  )
ORDER BY fl."Asset ID";