// supabase/functions/_shared/env.ts
export const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
  SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY")!,
  PROJECT_ORG_ID: Deno.env.get("PROJECT_ORG_ID")!,
  RADAR_API_KEY: Deno.env.get("RADAR_API_KEY")!,
  GOOGLE_MAPS_API_KEY: Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "",
  CRON_SHARED_SECRET: Deno.env.get("CRON_SHARED_SECRET") ?? "",
};
