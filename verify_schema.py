import pandas as pd

df = pd.read_csv('data/clean_energy.csv')
required = ['greenhouse_gas_emissions', 'carbon_intensity_elec', 'nuclear_consumption', 'total_energy', 'fossil_share', 'renewable_share', 'low_carbon_energy']

print('Checking required columns:')
for col in required:
    status = 'PRESENT' if col in df.columns else 'MISSING'
    print(f'  {col}: {status}')

print(f'\nTotal columns: {len(df.columns)}')
print(f'Total rows: {len(df)}')
