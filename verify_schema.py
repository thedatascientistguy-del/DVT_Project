import pandas as pd

df = pd.read_csv('data/clean_energy.csv')
print('Columns:', list(df.columns))
print('\nShape:', df.shape)
print('\nYear range:', df['year'].min(), '-', df['year'].max())
print('\nCountries:', df['country'].nunique())
print('\nDerived columns present:')
for col in ['total_energy', 'fossil_share', 'renewable_share', 'low_carbon_energy']:
    print(f'  {col}: {col in df.columns}')

print('\nSample data for derived columns:')
print(df[['country', 'year', 'total_energy', 'fossil_share', 'renewable_share', 'low_carbon_energy']].head(3))
