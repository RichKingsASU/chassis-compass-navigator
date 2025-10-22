import sys, pandas as pd
p=sys.argv[1]
df=pd.read_excel(p, sheet_name=0, dtype=str)
df.to_csv(sys.stdout, index=False)
