# 0) Edit if needed
export DB_URL='postgresql://postgres.fucvkmsaappphsvuabos:aGG3blX506SCJpmd@aws-1-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require'
SRC_DIR="/home/richkingsasu/Data/anytrek"
TABLE="public.anytrek_status"
export PGOPTIONS='-c statement_timeout=15min'

set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO: $BASH_COMMAND" >&2' ERR

# ensure basic tools
pip3 install --user pandas openpyxl >/dev/null

# quick sanity check
psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c "select 1 from $TABLE limit 1;" >/dev/null

total=0; imported=0; skipped=0
for f in "$SRC_DIR"/*.xlsx; do
  [[ -e "$f" ]] || continue
  ((total++))
  echo "→ $(basename "$f")"

  # 1) columns
  COLS="$(python3 /home/richkingsasu/chassis-compass-navigator/get_quoted_cols.py "$f")" || { echo "  ! header read failed"; ((skipped++)); continue; }

  # 2) make sure columns exist (adds TEXT if missing)
  python3 - "$DB_URL" "$TABLE" "$f" <<'PY' || { echo "  ! ensure columns failed"; ((skipped++)); continue; }
import sys, csv, subprocess, pandas as pd
db, table, path = sys.argv[1], sys.argv[2], sys.argv[3]
df = pd.read_excel(path, sheet_name=0, dtype=str).fillna("")
cols = list(df.columns)
for c in cols:
    c = (c or "").strip()
    if not c: 
        continue
    ident = '"' + c.replace('"','""') + '"'
    sql = f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {ident} text;'
    subprocess.run(['psql', db, '-X', '-q', '-v','ON_ERROR_STOP=1','-c', sql], check=True)
PY

  # 3) convert to temp CSV
  CSV="$(mktemp /tmp/anytrek_XXXX.csv)"
  if ! python3 /home/richkingsasu/chassis-compass-navigator/convert_to_csv.py "$f" > "$CSV"; then
    echo "  ! xlsx→csv conversion failed"
    ((skipped++)); rm -f "$CSV"; continue
  fi

  # 4) copy
  if psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
        -v table="$TABLE" -v cols="$COLS" -v csv="$CSV" \
        -c '\copy :table (:cols) FROM :'csv' WITH (FORMAT csv, HEADER true, DELIMITER ",")' ; then
    echo "   ✓ imported"
    ((imported++))
  else
    echo "  ! COPY failed"
    ((skipped++))
  fi
  rm -f "$CSV"

  # 5) light pacing to avoid resource spikes
  sleep 1
done

echo "— Summary —"
echo "Files seen:     $total"
echo "Files imported: $imported"
echo "Files skipped:  $skipped"
psql "$DB_URL" -X -q -t -A -c "select count(*) from $TABLE;" | awk '{print "Row count:    " $0}'