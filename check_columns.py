import pandas as pd

df = pd.read_csv('data/raw_energy_data.csv')
missing_pct = df.isnull().sum() / len(df)

print('greenhouse_gas_emissions missing:', f'{missing_pct.get("greenhouse_gas_emissions", 0) * 100:.1f}%')
print('carbon_intensity_elec missing:', f'{missing_pct.get("carbon_intensity_elec", 0) * 100:.1f}%')
print('nuclear_consumption missing:', f'{missing_pct.get("nuclear_consumption", 0) * 100:.1f}%')
