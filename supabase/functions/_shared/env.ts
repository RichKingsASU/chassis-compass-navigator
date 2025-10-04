// Minimal env loader for Edge Functions
export const env = {
  SUPABASE_URL:
    Deno.env.get("SUPABASE_URL") ??
    Deno.env.get("SUPABASE_URL".toUpperCase()) ??
    "",
  SERVICE_ROLE_KEY:
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "",
  GOOGLE_MAPS_API_KEY: Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "",
  PROJECT_ORG_ID: Deno.env.get("PROJECT_ORG_ID") ?? "",
};

export function assertEnv() {
  const missing: string[] = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SERVICE_ROLE_KEY) missing.push("SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
