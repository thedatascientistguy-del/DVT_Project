import pandas as pd

df = pd.read_csv('data/clean_energy.csv')
print("All columns:")
for i, col in enumerate(df.columns, 1):
    print(f"{i:3d}. {col}")
