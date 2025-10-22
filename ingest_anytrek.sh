#!/usr/bin/env bash
set -euo pipefail

# === EDIT THESE ===
DB_URL="postgresql://postgres.fucvkmsaappphsvuabos:aGG3blX506SCJpmd@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
TABLE="public.gps_anytrek_log"                 # change if you want a different table
DATA_DIR="/home/richkingsasu/Data/anytrek"      # your Anytrek folder
GLOB_PATTERN="*.csv *.CSV *.xlsx *.XLSX"       # which files to ingest
# ===================

command -v psql >/dev/null || { echo "psql not found. Install: sudo apt-get update && sudo apt-get install -y postgresql-client"; exit 1; }
command -v python3 >/dev/null || { echo "python3 not found. Install it (apt)"; exit 1; }

# make sure pandas + openpyxl for XLSX support
python3 - <<'PY' || pip3 install --user pandas openpyxl
try:
    import pandas, openpyxl  # noqa
except Exception:
    raise SystemExit(1)
PY

# check table exists
psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c "select 1 from $TABLE limit 1;" >/dev/null || {
  echo "ERROR: target table $TABLE does not exist. Create it first (or change TABLE)."; exit 1;
}

# increase timeout
psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c "SET statement_timeout = '15min';" >/dev/null

# helpers -------------
pg_cols() {
  psql "$DB_URL" -X -q -t -A -F $'	' \
    -c "select column_name
        from information_schema.columns
        where table_schema=split_part('$TABLE','. ',1)
          and table_name=split_part('$TABLE','. ',2)
        order by ordinal_position"
}

ensure_columns_exist() {
  local header_line="$1"
  IFS=',' read -r -a hdr <<< "$header_line"

  mapfile -t existing < <(pg_cols)
  declare -A have=()
  for c in "${existing[@]}"; do have["$c"]=1; done

  for raw in "${hdr[@]}"; do
    col="$(echo "$raw" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -z "$col" ]] && continue
    [[ -n "${have[$col]:-}" ]] && continue
    echo "↳ adding missing column: $col (text)"
    psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
      -c "alter table $TABLE add column if not exists \"${col}\" text;"
    have["$col"]=1
  done
}

get_header() {
  # prints the comma-separated header for a CSV/XLSX
  local path="$1"
  case "${path##*.}" in
    csv|CSV)
      head -n 1 "$path"
      ;; 
    xlsx|XLSX)
      python3 - "$path" <<'PY'
import sys, pandas as pd
p=sys.argv[1]
cols=pd.read_excel(p, sheet_name=0, nrows=0).columns
print(",".join(str(c) for c in cols))
PY
      ;; 
    *)
      echo ""
      ;; 
  esac
}

stream_csv() {
  # writes CSV (with header) to stdout regardless of input type
  local path="$1"
  case "${path##*.}" in
    csv|CSV)
      cat "$path"
      ;; 
    xlsx|XLSX)
      python3 - "$path" <<'PY'
import sys, pandas as pd
p=sys.argv[1]
# read as strings to avoid implicit dtype casts
df=pd.read_excel(p, sheet_name=0, dtype=str)
df.to_csv(sys.stdout, index=False)
PY
      ;; 
    *)
      return 1
      ;; 
  esac
}

quote_cols_for_copy() {
  local header_line="$1"
  IFS=',' read -r -a hdr <<< "$header_line"
  local out=()
  for c in "${hdr[@]}"; do
    col="$(echo "$c" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -z "$col" ]] && continue
    out+=("\"$col\"")
  done
  (IFS=','; echo "${out[*]}")
}

# gather files
shopt -s nullglob
files=($DATA_DIR/*.csv $DATA_DIR/*.CSV $DATA_DIR/*.xlsx $DATA_DIR/*.XLSX)
shopt -u nullglob

[[ ${#files[@]} -gt 0 ]] || { echo "No files found in $DATA_DIR for patterns: $GLOB_PATTERN"; exit 1; }

# summary
start_rows=$(psql "$DB_URL" -X -q -t -A -c "select count(*) from $TABLE" || echo 0)
total=0; imported=0; skipped=0

for path in "${files[@]}"; do
  ((total++))
  fname="$(basename "$path")"
  echo "→ $fname"

  header="$(get_header "$path" || true)"
  if [[ -z "$header" ]]; then
    echo "  ! could not read header — skipping"
    ((skipped++)); continue
  fi

  ensure_columns_exist "$header"
  col_list="$(quote_cols_for_copy "$header")"

  before=$(psql "$DB_URL" -X -q -t -A -c "select count(*) from $TABLE" || echo 0)

  if ! stream_csv "$path" | psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
      -c "\copy $TABLE ($col_list) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')"; then
    echo "  ⚠️  COPY failed — skipping"
    ((skipped++)); continue
  fi

  after=$(psql "$DB_URL" -X -q -t -A -c "select count(*) from $TABLE" || echo 0)
  echo "   ✓ +$((after - before)) rows"
  ((imported++))
  sleep 1
done

end_rows=$(psql "$DB_URL" -X -q -t -A -c "select count(*) from $TABLE" || echo 0)

echo

echo "— Summary —"
echo "Files found:     $total"
echo "Files imported:  $imported"
echo "Files skipped:   $skipped"
echo "Rows before:     $start_rows"
echo "Rows after:      $end_rows"
echo "Total new rows:  $((end_rows - start_rows))"
