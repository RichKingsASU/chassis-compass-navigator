CREATE OR REPLACE FUNCTION public.get_distinct_external_device_ids(p_org_id uuid)
RETURNS TABLE(external_device_id text) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT s.external_device_id
    FROM fleet.staging_blackberry_locations s
    WHERE s.org_id = p_org_id;
END;
$$ LANGUAGE plpgsql;