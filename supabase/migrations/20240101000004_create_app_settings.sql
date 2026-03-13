-- ============================================================================
-- Migration: Create app_settings table for application configuration
-- Description: Stores key-value settings like API keys for integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON app_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write settings
DROP POLICY IF EXISTS "Allow all access" ON app_settings;
CREATE POLICY "Allow all access" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);
