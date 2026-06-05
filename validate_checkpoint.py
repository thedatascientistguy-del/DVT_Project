"""
Checkpoint validation script for Task 6
Validates core infrastructure components
"""
import pandas as pd
import os

print("=" * 60)
print("CHECKPOINT 6: Core Infrastructure Validation")
print("=" * 60)

# Test 1: Validate clean_energy.csv
print("\n1. Validating clean_energy.csv...")
try:
    df = pd.read_csv('data/clean_energy.csv')
    print(f"   ✓ File loaded successfully")
    print(f"   ✓ Rows: {len(df):,}")
    print(f"   ✓ Columns: {len(df.columns)}")
    print(f"   ✓ Years: {df['year'].min()}-{df['year'].max()}")
    print(f"   ✓ Countries: {df['country'].nunique()}")
    
    # Check required columns
    required_cols = ['country', 'year', 'total_energy', 'renewables_consumption', 
                     'fossil_fuel_consumption', 'greenhouse_gas_emissions']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        print(f"   ✗ Missing columns: {', '.join(missing_cols)}")
    else:
        print(f"   ✓ All required columns present")
        
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Check JS files exist
print("\n2. Checking JavaScript core files...")
js_files = {
    'config.js': 'Configuration module',
    'dataLoader.js': 'Data loading module',
    'utils.js': 'Utility functions',
    'tooltip.js': 'Tooltip system',
    'filters.js': 'Filter manager'
}

for filename, description in js_files.items():
    filepath = f'js/{filename}'
    if os.path.exists(filepath):
        size_kb = os.path.getsize(filepath) / 1024
        print(f"   ✓ {filename:20s} ({size_kb:.1f} KB) - {description}")
    else:
        print(f"   ✗ {filename:20s} MISSING - {description}")

# Test 3: Check test files exist
print("\n3. Checking test files...")
test_files = ['test_utils.html', 'test_filters.html', 'test_dataloader.html']

for filename in test_files:
    if os.path.exists(filename):
        print(f"   ✓ {filename}")
    else:
        print(f"   ✗ {filename} MISSING")

# Test 4: Validate CSV data quality
print("\n4. Data Quality Checks...")
try:
    df = pd.read_csv('data/clean_energy.csv')
    
    # Check year range filtering
    invalid_years = df[(df['year'] < 2000) | (df['year'] > 2019)]
    if len(invalid_years) == 0:
        print(f"   ✓ Year range filtering: All records within 2000-2019")
    else:
        print(f"   ✗ Found {len(invalid_years)} records outside 2000-2019")
    
    # Check for numeric columns
    numeric_cols = ['total_energy', 'coal_consumption', 'oil_consumption', 
                    'gas_consumption', 'renewables_consumption']
    
    for col in numeric_cols:
        if col in df.columns:
            non_null = df[col].notna().sum()
            pct = (non_null / len(df)) * 100
            print(f"   ✓ {col:30s}: {pct:5.1f}% non-null ({non_null:,}/{len(df):,})")
        else:
            print(f"   ✗ {col:30s}: MISSING")
            
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("CHECKPOINT VALIDATION COMPLETE")
print("=" * 60)
print("\nNext Steps:")
print("1. Open test_utils.html in a browser and run tests")
print("2. Open test_filters.html in a browser and run tests")
print("3. Open test_dataloader.html in a browser and run tests")
print("4. Verify all tests pass before proceeding to chart implementation")
