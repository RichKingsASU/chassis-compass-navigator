import sys, pandas as pd
df = pd.read_excel(sys.argv[1], sheet_name=0, dtype=str)
df = df.fillna("")  # avoid NaNs
print(",".join(df.columns))
