export const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  PROJECT_ORG_ID: Deno.env.get("PROJECT_ORG_ID")!,
  CRON_SHARED_SECRET: Deno.env.get("CRON_SHARED_SECRET")!,
  BB_API_BASE: Deno.env.get("BB_API_BASE") ?? "https://api.radar.blackberry.com",
  BB_API_KEY: Deno.env.get("BB_API_KEY") ?? "",
  BB_OAUTH_TOKEN_URL: Deno.env.get("BB_OAUTH_TOKEN_URL") ?? "",
  BB_CLIENT_ID: Deno.env.get("BB_CLIENT_ID") ?? "",
  BB_CLIENT_SECRET: Deno.env.get("BB_CLIENT_SECRET") ?? "",
  GOOGLE_MAPS_API_KEY: Deno.env.get("GOOGLE_MAPS_API_KEY") ?? ""
} as const;