#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Project / Known values
# ──────────────────────────────────────────────────────────────────────────────
PROJECT_REF="fucvkmsaappphsvuabos"

# Public anon key (for function invoke / smoke tests)
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y3ZrbXNhYXBwcGhzdnVhYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mzg1OTcsImV4cCI6MjA3MzExNDU5N30.zGnrRCzrWbFY-tvXjsb6nf9nVmRhqlEAcdtilRaJPxQ"

# Make Logistics the single-tenant “default”
LOGISTICS_APP_ID="786ea4a0-4ad4-49e6-a52a-7c33057f3c7c"
read -r -d '' LOGISTICS_PRIVATE_KEY <<'PEM'
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgBSTZRQtt2ARCKCrm
vaoutTJ1mrYssnciURUkcYvowX2hRANCAATE50e5SuoQzutVopHXzOg8f+UN48HI
DwLAN5psPMhNw/TDi97jCHVUeW33Ey9UdaNpI9NqxXUGRTzhDRxLtMy7
-----END PRIVATE KEY-----
PEM

# Keep Transportation around for later expansion (not used by single-tenant flow)
TRANSPORT_APP_ID="92805e24-cf6b-4be0-9944-cd7d4c2bbdaa"
read -r -d '' TRANSPORT_PRIVATE_KEY <<'PEM'
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgAGBtWFzD7U/VJ55+
9xz5j77K588at1dP3miiPxUVBPmhRANCAAT/8MHA+ISrDSZ2E2q8CJfUQe9Ofpw2
X5vYuh48SQZkEwfwkSvmT5vOb4G1Up/3Z4rX/YGzy+VsZgZTt3911s3B
-----END PRIVATE KEY-----
PEM

# OAuth / API config
TOKEN_URL="https://oauth2.radar.blackberry.com/1/token"
JWT_AUD="$TOKEN_URL"                               # Radar expects aud === token URL
SCOPE="modules:read assets:read assets:write"      # safe set for read + CRUD
API_BASE="https://api.radar.blackberry.com"

echo "== Setting single-tenant (Logistics) secrets =="
supabase secrets set --project-ref "$PROJECT_REF" \
  BLACKBERRY_APP_ID="$LOGISTICS_APP_ID" \
  BLACKBERRY_JWT_PRIVATE_KEY="$LOGISTICS_PRIVATE_KEY" \
  BLACKBERRY_OAUTH_TOKEN_URL="$TOKEN_URL" \
  BLACKBERRY_JWT_AUD="$JWT_AUD" \
  BLACKBERRY_SCOPE="$SCOPE" \
  BLACKBERRY_API_BASE="$API_BASE"

echo "== (Optional) Stashing per-org keys for later multi-tenant use =="
supabase secrets set --project-ref "$PROJECT_REF" \
  BLACKBERRY_LOGISTICS_APP_ID="$LOGISTICS_APP_ID" \
  BLACKBERRY_LOGISTICS_JWT_PRIVATE_KEY="$LOGISTICS_PRIVATE_KEY" \
  BLACKBERRY_TRANSPORTATION_APP_ID="$TRANSPORT_APP_ID" \
  BLACKBERRY_TRANSPORTATION_JWT_PRIVATE_KEY="$TRANSPORT_PRIVATE_KEY"

echo "== Deploying functions =="
supabase functions deploy radar-token assetsCrud refreshLocation syncAllAssets geofencesCrud \
  --project-ref "$PROJECT_REF" --no-verify-jwt

echo "== Smoke test: token (no auth header) =="
curl -s -X POST \
  "https://$PROJECT_REF.supabase.co/functions/v1/radar-token" \
  -H 'content-type: application/json' \
  -d '{}' | sed -e 's/{"access_token":.*/{ "access_token": "...redacted...", "ok": true }/'

echo "== Smoke test: CRUD BJ3001 =="
echo "-- create"
curl -sS -X POST \
  "https://$PROJECT_REF.supabase.co/functions/v1/assetsCrud" \
  -H "Authorization: Bearer $ANON" \
  -H "content-type: application/json" \
  -d '{ 
        "identifier":"BJ3001",
        "type":"trailer",
        "asset_class":"dry_van",
        "door_type":"swing",
        "length":680,"width":250,"height":250
      }' ; echo

echo "-- update"
curl -sS -X PUT \
  "https://$PROJECT_REF.supabase.co/functions/v1/assetsCrud" \
  -H "Authorization: Bearer $ANON" \
  -H "content-type: application/json" \
  -d '{ 
        "identifier":"BJ3001",
        "type":"trailer-updated"
      }' ; echo

echo "-- delete"
curl -sS -X DELETE \
  "https://$PROJECT_REF.supabase.co/functions/v1/assetsCrud" \
  -H "Authorization: Bearer $ANON" \
  -H "content-type: application/json" \
  -d '{"identifier":"BJ3001"}' ; echo

echo "All done."
