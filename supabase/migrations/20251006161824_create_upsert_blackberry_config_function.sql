CREATE OR REPLACE FUNCTION public.upsert_blackberry_config(p_org_id uuid, p_options jsonb)
RETURNS void AS $$
BEGIN
    INSERT INTO fleet.provider_config (org_id, provider_key, options)
    VALUES (p_org_id, 'blackberry', p_options)
    ON CONFLICT (org_id, provider_key)
    DO UPDATE SET options = p_options;
END;
$$ LANGUAGE plpgsql;