import sys, csv, pandas as pd
df = pd.read_excel(sys.argv[1], sheet_name=0, dtype=str).fillna("")
hdr = ",".join(df.columns)
cols = next(csv.reader([hdr]))
print(",".join(['"' + c.replace('"', '""') + '"' for c in cols]))
