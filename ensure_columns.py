import sys, csv, subprocess, pandas as pd
db, table, path = sys.argv[1], sys.argv[2], sys.argv[3]
df = pd.read_excel(path, sheet_name=0, dtype=str).fillna("")
header = ",".join(df.columns)
cols = next(csv.reader([header]))
for c in cols:
    c = (c or "").strip().strip('"').strip("'")
    if not c:
        continue
    ident = '"' + c.replace('"','""') + '"'
    sql = f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {ident} text;'
    subprocess.run(['psql', db, '-X', '-q', '-v','ON_ERROR_STOP=1','-c', sql], check=True)
print("columns ensured")
