"""
Data Preprocessing Module for Energy Transition Analytics Dashboard

This module provides functions to clean and transform raw energy dataset into
analysis-ready format. It handles missing values, filters date ranges, creates
derived metrics, and outputs clean CSV for dashboard consumption.

Author: Energy Analytics Team
Date: 2026
"""

import pandas as pd
import numpy as np
import re
import sys


def load_raw_data(filepath):
    """
    Load raw CSV dataset with proper encoding handling.
    
    Args:
        filepath (str): Path to raw CSV file
        
    Returns:
        pd.DataFrame: Loaded dataframe
        
    Raises:
        FileNotFoundError: If CSV file doesn't exist
        pd.errors.EmptyDataError: If CSV is empty
    """
    try:
        df = pd.read_csv(filepath, encoding='utf-8')
        print(f"✓ Loaded {len(df)} records from {filepath}")
        return df
    except UnicodeDecodeError:
        # Try alternative encoding if UTF-8 fails
        df = pd.read_csv(filepath, encoding='latin-1')
        print(f"✓ Loaded {len(df)} records from {filepath} (latin-1 encoding)")
        return df
    except FileNotFoundError:
        print(f"✗ Error: File not found - {filepath}")
        raise
    except pd.errors.EmptyDataError:
        print(f"✗ Error: CSV file is empty - {filepath}")
        raise


def handle_missing_values(df):
    """
    Handle missing values using strategic approaches.
    
    Strategy:
    - Remove rows with >50% missing values
    - Interpolate numeric columns for time series continuity
    - Remove columns with >30% missing data
    
    Args:
        df (pd.DataFrame): Input dataframe
        
    Returns:
        pd.DataFrame: Dataframe with missing values handled
    """
    initial_rows = len(df)
    initial_cols = len(df.columns)
    
    # Remove rows with >50% missing values
    threshold = len(df.columns) * 0.5
    df = df.dropna(thresh=threshold)
    rows_removed = initial_rows - len(df)
    
    if rows_removed > 0:
        print(f"✓ Removed {rows_removed} rows with >50% missing values")
    
    # Store column names before removal
    cols_before = set(df.columns)
    
    # Remove columns with >30% missing data
    missing_pct = df.isnull().sum() / len(df)
    sparse_cols = missing_pct[missing_pct > 0.3].index.tolist()
    df = df.drop(columns=sparse_cols)
    
    if sparse_cols:
        print(f"✓ Removed {len(sparse_cols)} sparse columns: {', '.join(sparse_cols)}")
    
    # Interpolate remaining numeric columns (for time series continuity)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            df[col] = df[col].interpolate(method='linear', limit_direction='both')
    
    print(f"✓ Interpolated missing values in numeric columns")
    
    return df


def convert_numeric_columns(df):
    """
    Convert specified columns to numeric types, coercing errors to NaN.
    
    Args:
        df (pd.DataFrame): Input dataframe
        
    Returns:
        pd.DataFrame: Dataframe with properly typed numeric columns
    """
    # List of columns that should be numeric
    numeric_column_patterns = [
        'population', 'gdp', 'consumption', 'emissions', 'demand', 
        'generation', 'intensity', 'per_capita', 'energy', 'share'
    ]
    
    converted_count = 0
    for col in df.columns:
        # Check if column name contains any numeric pattern
        if any(pattern in col.lower() for pattern in numeric_column_patterns):
            if df[col].dtype == 'object':
                df[col] = pd.to_numeric(df[col], errors='coerce')
                converted_count += 1
    
    print(f"✓ Converted {converted_count} columns to numeric type")
    return df


def filter_year_range(df, start_year=2000, end_year=2019):
    """
    Filter dataset to specified year range.
    
    Args:
        df (pd.DataFrame): Input dataframe
        start_year (int): Start year (inclusive)
        end_year (int): End year (inclusive)
        
    Returns:
        pd.DataFrame: Filtered dataframe
    """
    initial_rows = len(df)
    
    # Ensure year column exists
    if 'year' not in df.columns:
        print("✗ Warning: 'year' column not found, skipping year filter")
        return df
    
    # Convert year to int if not already
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    
    # Filter to range
    df = df[(df['year'] >= start_year) & (df['year'] <= end_year)]
    
    rows_filtered = initial_rows - len(df)
    print(f"✓ Filtered to {start_year}-{end_year}: {len(df)} records ({rows_filtered} removed)")
    
    return df


def remove_sparse_columns(df, threshold=0.7):
    """
    Remove columns with more than threshold% missing data.
    
    Args:
        df (pd.DataFrame): Input dataframe
        threshold (float): Minimum completeness required (0.7 = 70% non-null)
        
    Returns:
        pd.DataFrame: Dataframe with sparse columns removed
    """
    min_count = int(threshold * len(df))
    df = df.dropna(axis=1, thresh=min_count)
    
    print(f"✓ Removed columns with <{int(threshold*100)}% completeness")
    return df


def standardize_column_names(df):
    """
    Standardize column names to snake_case and remove special characters.
    
    Args:
        df (pd.DataFrame): Input dataframe
        
    Returns:
        pd.DataFrame: Dataframe with standardized column names
    """
    def to_snake_case(name):
        # Remove special characters
        name = re.sub(r'[^\w\s]', '', name)
        # Replace spaces with underscores
        name = re.sub(r'\s+', '_', name)
        # Convert to lowercase
        name = name.lower()
        # Remove multiple consecutive underscores
        name = re.sub(r'_+', '_', name)
        # Remove leading/trailing underscores
        name = name.strip('_')
        return name
    
    old_names = df.columns.tolist()
    df.columns = [to_snake_case(col) for col in df.columns]
    
    renamed_count = sum(1 for old, new in zip(old_names, df.columns) if old != new)
    print(f"✓ Standardized {renamed_count} column names to snake_case")
    
    return df


def create_derived_metrics(df):
    """
    Create calculated fields for dashboard analytics.
    
    Derived metrics:
    - total_energy = coal + oil + gas + renewables + nuclear
    - fossil_share = (fossil_fuel / total_energy) * 100
    - renewable_share = (renewables / total_energy) * 100
    - low_carbon_energy = renewables + nuclear
    
    Args:
        df (pd.DataFrame): Input dataframe
        
    Returns:
        pd.DataFrame: Dataframe with derived metrics added
    """
    # Map possible column name variations
    col_mapping = {}
    for col in df.columns:
        col_lower = col.lower()
        if 'coal' in col_lower and 'consumption' in col_lower:
            col_mapping['coal'] = col
        elif 'oil' in col_lower and 'consumption' in col_lower:
            col_mapping['oil'] = col
        elif ('gas' in col_lower or 'natural_gas' in col_lower) and 'consumption' in col_lower:
            col_mapping['gas'] = col
        elif 'renewable' in col_lower and 'consumption' in col_lower:
            col_mapping['renewables'] = col
        elif 'nuclear' in col_lower and 'consumption' in col_lower:
            col_mapping['nuclear'] = col
        elif 'fossil' in col_lower and 'consumption' in col_lower:
            col_mapping['fossil'] = col
    
    # Calculate total_energy if component columns exist
    energy_components = ['coal', 'oil', 'gas', 'renewables']
    if all(k in col_mapping for k in energy_components):
        df['total_energy'] = sum(df[col_mapping[k]].fillna(0) for k in energy_components)
        if 'nuclear' in col_mapping:
            df['total_energy'] += df[col_mapping['nuclear']].fillna(0)
        print("✓ Created total_energy metric")
    
    # Calculate fossil_share
    if 'fossil' in col_mapping and 'total_energy' in df.columns:
        df['fossil_share'] = (df[col_mapping['fossil']] / df['total_energy'] * 100).fillna(0)
        df['fossil_share'] = df['fossil_share'].replace([np.inf, -np.inf], 0)
        print("✓ Created fossil_share metric")
    
    # Calculate renewable_share
    if 'renewables' in col_mapping and 'total_energy' in df.columns:
        df['renewable_share'] = (df[col_mapping['renewables']] / df['total_energy'] * 100).fillna(0)
        df['renewable_share'] = df['renewable_share'].replace([np.inf, -np.inf], 0)
        print("✓ Created renewable_share metric")
    
    # Calculate low_carbon_energy
    if 'renewables' in col_mapping:
        df['low_carbon_energy'] = df[col_mapping['renewables']].fillna(0)
        if 'nuclear' in col_mapping:
            df['low_carbon_energy'] += df[col_mapping['nuclear']].fillna(0)
        print("✓ Created low_carbon_energy metric")
    
    return df


def save_clean_data(df, output_path):
    """
    Save processed dataset as clean CSV.
    
    Args:
        df (pd.DataFrame): Processed dataframe
        output_path (str): Output file path
    """
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"✓ Saved clean dataset to {output_path}")
    print(f"  Final dataset: {len(df)} rows × {len(df.columns)} columns")


def main():
    """
    Execute the complete preprocessing pipeline.
    """
    print("=" * 60)
    print("ENERGY DATA PREPROCESSING PIPELINE")
    print("=" * 60)
    
    # Configuration
    input_file = 'data/raw_energy_data.csv'
    output_file = 'data/clean_energy.csv'
    
    try:
        # Step 1: Load raw data
        print("\n[1/7] Loading raw data...")
        df = load_raw_data(input_file)
        
        # Step 2: Standardize column names (do this early)
        print("\n[2/7] Standardizing column names...")
        df = standardize_column_names(df)
        
        # Step 3: Convert numeric columns
        print("\n[3/7] Converting numeric columns...")
        df = convert_numeric_columns(df)
        
        # Step 4: Handle missing values
        print("\n[4/7] Handling missing values...")
        df = handle_missing_values(df)
        
        # Step 5: Filter year range
        print("\n[5/7] Filtering year range (2000-2019)...")
        df = filter_year_range(df, 2000, 2019)
        
        # Step 6: Create derived metrics
        print("\n[6/7] Creating derived metrics...")
        df = create_derived_metrics(df)
        
        # Step 7: Save clean data
        print("\n[7/7] Saving clean dataset...")
        save_clean_data(df, output_file)
        
        print("\n" + "=" * 60)
        print("✓ PREPROCESSING COMPLETE")
        print("=" * 60)
        
        # Display summary
        print("\nDataset Summary:")
        print(f"  Columns: {', '.join(df.columns.tolist()[:10])}...")
        print(f"  Date range: {df['year'].min()}-{df['year'].max()}")
        if 'country' in df.columns:
            print(f"  Countries: {df['country'].nunique()}")
        
    except Exception as e:
        print(f"\n✗ Preprocessing failed: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
