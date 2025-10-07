CREATE SCHEMA IF NOT EXISTS fleet;
CREATE TABLE fleet.provider_config (
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    provider_key TEXT NOT NULL,
    options JSONB,
    PRIMARY KEY (org_id, provider_key)
);