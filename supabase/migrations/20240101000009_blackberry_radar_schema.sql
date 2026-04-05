-- ============================================================================
-- Migration: BlackBerry Radar Incremental Sync Schema
-- Description: Tables for asset locations, events, sensor readings, and sync log
-- ============================================================================

-- ============================================================================
-- 1. radar_assets — Master list of tracked assets from BlackBerry Radar
-- ============================================================================
CREATE TABLE IF NOT EXISTS radar_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  radar_asset_id TEXT NOT NULL UNIQUE,           -- ID from the Radar API
  asset_name TEXT,
  asset_type TEXT,                                -- trailer, chassis, container, etc.
  device_serial TEXT,
  device_type TEXT,
  organization_id TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. radar_asset_locations — Historical location pings
-- ============================================================================
CREATE TABLE IF NOT EXISTS radar_asset_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  radar_asset_id TEXT NOT NULL,                   -- FK to radar_assets.radar_asset_id
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  address TEXT,
  geofence_name TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,               -- Timestamp from Radar
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_radar_location UNIQUE (radar_asset_id, recorded_at)
);

-- ============================================================================
-- 3. radar_asset_events — Asset events (door open/close, movement, geofence, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS radar_asset_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  radar_asset_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                       -- door_open, door_close, movement_start, geofence_enter, etc.
  event_description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_radar_event UNIQUE (radar_asset_id, event_type, recorded_at)
);

-- ============================================================================
-- 4. radar_sensor_readings — Sensor telemetry (temperature, humidity, light, cargo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS radar_sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  radar_asset_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,                      -- temperature, humidity, light, cargo_status, battery
  sensor_value DOUBLE PRECISION,
  unit TEXT,                                      -- celsius, fahrenheit, percent, lux, etc.
  recorded_at TIMESTAMPTZ NOT NULL,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_radar_sensor UNIQUE (radar_asset_id, sensor_type, recorded_at)
);

-- ============================================================================
-- 5. radar_sync_log — Tracks incremental sync progress per table
-- ============================================================================
CREATE TABLE IF NOT EXISTS radar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  radar_asset_id TEXT,                            -- NULL = global, otherwise per-asset
  last_synced_at TIMESTAMPTZ NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',                -- completed, failed, in_progress
  error_message TEXT,
  duration_seconds DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_sync_log UNIQUE (table_name, COALESCE(radar_asset_id, '__global__'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- radar_assets
CREATE INDEX IF NOT EXISTS idx_radar_assets_radar_id ON radar_assets(radar_asset_id);
CREATE INDEX IF NOT EXISTS idx_radar_assets_status ON radar_assets(status);
CREATE INDEX IF NOT EXISTS idx_radar_assets_type ON radar_assets(asset_type);

-- radar_asset_locations
CREATE INDEX IF NOT EXISTS idx_radar_locations_asset_id ON radar_asset_locations(radar_asset_id);
CREATE INDEX IF NOT EXISTS idx_radar_locations_recorded_at ON radar_asset_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_radar_locations_asset_time ON radar_asset_locations(radar_asset_id, recorded_at DESC);

-- radar_asset_events
CREATE INDEX IF NOT EXISTS idx_radar_events_asset_id ON radar_asset_events(radar_asset_id);
CREATE INDEX IF NOT EXISTS idx_radar_events_type ON radar_asset_events(event_type);
CREATE INDEX IF NOT EXISTS idx_radar_events_recorded_at ON radar_asset_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_radar_events_asset_time ON radar_asset_events(radar_asset_id, recorded_at DESC);

-- radar_sensor_readings
CREATE INDEX IF NOT EXISTS idx_radar_sensors_asset_id ON radar_sensor_readings(radar_asset_id);
CREATE INDEX IF NOT EXISTS idx_radar_sensors_type ON radar_sensor_readings(sensor_type);
CREATE INDEX IF NOT EXISTS idx_radar_sensors_recorded_at ON radar_sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_radar_sensors_asset_time ON radar_sensor_readings(radar_asset_id, recorded_at DESC);

-- radar_sync_log
CREATE INDEX IF NOT EXISTS idx_radar_sync_log_table ON radar_sync_log(table_name);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at on radar_assets
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at ON radar_assets;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON radar_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'radar_assets',
      'radar_asset_locations',
      'radar_asset_events',
      'radar_sensor_readings',
      'radar_sync_log'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow all access" ON %I; CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl
    );
  END LOOP;
END;
$$;
