-- Add indexes to tms_mg table for faster chassis lookups
CREATE INDEX IF NOT EXISTS idx_tms_mg_chassis_number ON tms_mg(chassis_number);
CREATE INDEX IF NOT EXISTS idx_tms_mg_chassis_number_format ON tms_mg(chassis_number_format);
CREATE INDEX IF NOT EXISTS idx_tms_mg_created_date ON tms_mg(created_date);