#!/bin/bash
export DB_URL="postgresql://postgres.fucvkmsaappphsvuabos:aGG3blX506SCJpmd@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
export API="https://fucvkmsaappphsvuabos.supabase.co"
export BUCKET="tms"
export PREFIX="mg"
export TABLE="public.tms_mg"

for i in $(printf "%02d\n" {1..40}); do
  f="mg_tms_2p5k_part_${i}.csv"
  url="$API/storage/v1/object/public/$BUCKET/$PREFIX/$f"
  echo "→ $f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -X -q <<EOF
SET statement_timeout='15min';
\copy $TABLE FROM PROGRAM 'curl -Lsf --retry 5 --retry-all-errors --retry-delay 2 "$url"' WITH (FORMAT csv, HEADER true, DELIMITER ',');
EOF
  sleep 2
done
