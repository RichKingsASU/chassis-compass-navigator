CREATE SCHEMA IF NOT EXISTS fleet;

CREATE TABLE fleet.provider_config (
    org_id UUID NOT NULL,
    provider_key TEXT NOT NULL,
    options JSONB,
    PRIMARY KEY (org_id, provider_key)
);

CREATE TABLE fleet.staging_blackberry_locations (
    org_id UUID NOT NULL,
    external_device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
