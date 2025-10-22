#!/usr/bin/env bash
# Be resilient: don't exit on first failure; still treat unset vars & pipefail as strict
set -uo pipefail

# --- EDIT THESE ---
DB_URL="postgresql://postgres.fucvkmsaappphsvuabos:aGG3blX506SCJpmd@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
API="https://fucvkmsaappphsvuabos.supabase.co"     # e.g. https://abcd1234.supabase.co
SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y3ZrbXNhYXBwcGhzdnVhYm9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczODU5NywiZXhwIjoyMDczMzE0NTk3fQ.A6M1xckJhTS-5rb0RelNzQyV65ZLwEDmLBvWBJ2SE6M"
BUCKET="tms"                                # e.g. your bucket
PREFIX="mg"                 # e.g. folder; or "" for whole bucket
TABLE="public.tms_mg"                       # target table
# -------------------

# Summary counters
total_files=0
imported_files=0
skipped_files=0
start_rows=0
end_rows=0

# Clean summary on exit / Ctrl-C
cleanup() { echo; echo "— Summary —"; echo "Files seen:      $total_files"; echo "Files imported:  $imported_files"; echo "Files skipped:   $skipped_files"; echo "Rows before:     $start_rows"; echo "Rows after:      $end_rows"; }
trap cleanup EXIT

# Helper: list all objects (paginated) under BUCKET/PREFIX
list_objects () {
  local token=""
  while :; do
    body=$(jq -n --arg p "$PREFIX" --arg t "$token" \
      '({prefix:$p, limit:1000} + (if $t | length > 0 then {token:$t} else {} end))'
)

    resp=$(curl -s -X POST "$API/storage/v1/object/list/$BUCKET" \
      -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
      -H "Content-Type: application/json" -d "$body")

    # break if empty or error
    [[ "$(echo "$resp" | jq 'length')" == "0" ]] && break

    # yield names
    echo "$resp" | jq -r '.[].name'

    # check if <1000 => no more pages (Supabase returns no next token in this API)
    if [[ "$(echo "$resp" | jq 'length')" -lt 1000 ]]; then
      break
    fi
  done
}

# Helper: construct a public URL for a single object
public_url () {
  local key="$1"                 # e.g. mg_tms_2p5k_part_01.csv (relative to PREFIX)
  local full_key="${PREFIX%/}/$key"   # => mg/mg_tms_2p5k_part_01.csv
  echo "$API/storage/v1/object/public/$BUCKET/$full_key"
}

# Optional: quick sanity check target table exists and capture starting row count
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "select 1 from $TABLE limit 1;" >/dev/null || {
  echo "ERROR: Target table $TABLE does not exist. Create it first."; exit 1;
}
start_rows=$(psql "$DB_URL" -t -A -c "select count(*) from $TABLE" 2>/dev/null || echo 0)

# Iterate files and import those ending with .csv / .CSV
count=0
while IFS= read -r key; do
  ((total_files++))
  case "$key" in
    *.csv|*.CSV) : ;;
    *) continue ;;
  esac

  url=$(public_url "$key")
  echo "→ Importing $key ..."

  # Capture rows before file
  before=$(psql "$DB_URL" -t -A -c "select count(*) from $TABLE" 2>/dev/null || echo 0)

  # Stream the file to Postgres with generous timeout
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
    "SET statement_timeout = '15min';
     \copy $TABLE FROM PROGRAM 'curl -Lsf \"$url\"' WITH (FORMAT csv, HEADER true, DELIMITER ',')" ; then
    echo "⚠️  Skipped $key (COPY failed)"
    ((skipped_files++))
    continue
  fi

  after=$(psql "$DB_URL" -t -A -c "select count(*) from $TABLE" 2>/dev/null || echo 0)
  delta=$((after - before))
  echo "   ✓ $delta rows"
  ((imported_files++))
  ((count++))
done < <(list_objects)

end_rows=$(psql "$DB_URL" -t -A -c "select count(*) from $TABLE" 2>/dev/null || echo 0)
echo "✅ Imported $count CSV file(s) into $TABLE (rows +$((end_rows-start_rows)))"