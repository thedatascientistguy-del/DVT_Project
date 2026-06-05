"""
Exploratory Data Analysis (EDA) Module for Energy Transition Analytics Dashboard

This module performs comprehensive EDA on the cleaned energy dataset, generating
statistical summaries, visualizations, and key insights for CLO-5 documentation.

Author: Energy Analytics Team
Date: 2026
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import warnings
import os

warnings.filterwarnings('ignore')

# Configure plotting style
sns.set_style('darkgrid')
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['font.size'] = 10


def load_clean_data(filepath='data/clean_energy.csv'):
    """
    Load preprocessed energy dataset.
    
    Args:
        filepath (str): Path to clean CSV file
        
    Returns:
        pd.DataFrame: Loaded and validated dataframe
        
    Raises:
        FileNotFoundError: If clean data file doesn't exist
    """
    try:
        df = pd.read_csv(filepath)
        print(f"✓ Loaded {len(df)} records from {filepath}")
        print(f"  Date range: {df['year'].min()}-{df['year'].max()}")
        print(f"  Countries: {df['country'].nunique()}")
        return df
    except FileNotFoundError:
        print(f"✗ Error: Clean data file not found - {filepath}")
        print("  Please run data_preprocessing.py first")
        raise


def descriptive_statistics(df):
    """
    Calculate descriptive statistics for key energy metrics.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        
    Returns:
        dict: Dictionary of statistics per metric
    """
    metrics = [
        'energy_per_capita', 
        'greenhouse_gas_emissions',
        'gdp',
        'renewable_share',
        'fossil_share',
        'total_energy'
    ]
    
    stats_dict = {}
    
    for metric in metrics:
        if metric in df.columns:
            data = df[metric].dropna()
            if len(data) > 0:
                stats_dict[metric] = {
                    'mean': data.mean(),
                    'median': data.median(),
                    'std': data.std(),
                    'min': data.min(),
                    'max': data.max(),
                    'q25': data.quantile(0.25),
                    'q75': data.quantile(0.75)
                }
    
    print(f"✓ Calculated descriptive statistics for {len(stats_dict)} metrics")
    return stats_dict


def trend_analysis(df):
    """
    Analyze global trends in energy consumption and emissions.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        
    Returns:
        dict: Dictionary with trend descriptions and metrics
    """
    trends = {}
    
    # Global energy consumption trend
    if 'total_energy' in df.columns:
        global_energy = df.groupby('year')['total_energy'].sum().reset_index()
        if len(global_energy) > 1:
            start_val = global_energy.iloc[0]['total_energy']
            end_val = global_energy.iloc[-1]['total_energy']
            pct_change = ((end_val - start_val) / start_val) * 100
            
            trends['energy_consumption'] = {
                'start': start_val,
                'end': end_val,
                'change_pct': pct_change,
                'description': f"Global energy consumption {'increased' if pct_change > 0 else 'decreased'} by {abs(pct_change):.1f}% from 2000-2019"
            }
    
    # Renewable energy trend
    if 'renewable_share' in df.columns:
        global_renewable = df.groupby('year')['renewable_share'].mean().reset_index()
        if len(global_renewable) > 1:
            start_val = global_renewable.iloc[0]['renewable_share']
            end_val = global_renewable.iloc[-1]['renewable_share']
            change = end_val - start_val
            
            trends['renewable_share'] = {
                'start': start_val,
                'end': end_val,
                'change': change,
                'description': f"Global renewable share {'increased' if change > 0 else 'decreased'} by {abs(change):.1f} percentage points"
            }
    
    # Emissions trend (if available)
    if 'greenhouse_gas_emissions' in df.columns:
        emissions = df.groupby('year')['greenhouse_gas_emissions'].sum().reset_index()
        if len(emissions) > 1:
            start_val = emissions.iloc[0]['greenhouse_gas_emissions']
            end_val = emissions.iloc[-1]['greenhouse_gas_emissions']
            pct_change = ((end_val - start_val) / start_val) * 100 if start_val > 0 else 0
            
            trends['emissions'] = {
                'start': start_val,
                'end': end_val,
                'change_pct': pct_change,
                'description': f"Global emissions {'increased' if pct_change > 0 else 'decreased'} by {abs(pct_change):.1f}%"
            }
    
    print(f"✓ Analyzed {len(trends)} global trends")
    return trends


def correlation_analysis(df, output_dir='preprocessing/outputs'):
    """
    Compute correlation matrix and generate heatmap visualization.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        output_dir (str): Directory to save heatmap
        
    Returns:
        pd.DataFrame: Correlation matrix
    """
    # Select relevant numeric columns for correlation
    correlation_cols = []
    potential_cols = [
        'energy_per_capita', 'gdp', 'population',
        'renewable_share', 'fossil_share',
        'total_energy', 'low_carbon_energy'
    ]
    
    for col in potential_cols:
        if col in df.columns and df[col].notna().sum() > 100:
            correlation_cols.append(col)
    
    if len(correlation_cols) < 2:
        print("⚠ Insufficient data for correlation analysis")
        return pd.DataFrame()
    
    # Calculate correlation matrix
    corr_data = df[correlation_cols].dropna()
    corr_matrix = corr_data.corr()
    
    # Create heatmap
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        corr_matrix,
        annot=True,
        fmt='.2f',
        cmap='coolwarm',
        center=0,
        square=True,
        linewidths=1,
        cbar_kws={'label': 'Correlation Coefficient'}
    )
    plt.title('Correlation Matrix: Energy Metrics', fontsize=14, fontweight='bold', pad=20)
    plt.xlabel('')
    plt.ylabel('')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'correlation_heatmap.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    
    print(f"✓ Generated correlation heatmap: {output_path}")
    return corr_matrix


def distribution_analysis(df, output_dir='preprocessing/outputs'):
    """
    Generate histogram subplots for key variable distributions.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        output_dir (str): Directory to save plots
    """
    # Select variables for distribution analysis
    dist_vars = []
    potential_vars = [
        ('energy_per_capita', 'Energy per Capita (kWh)'),
        ('gdp', 'GDP ($B)'),
        ('total_energy', 'Total Energy (TWh)'),
        ('renewable_share', 'Renewable Share (%)')
    ]
    
    for var, label in potential_vars:
        if var in df.columns and df[var].notna().sum() > 100:
            dist_vars.append((var, label))
    
    if not dist_vars:
        print("⚠ No suitable variables for distribution analysis")
        return
    
    # Create subplot grid
    n_vars = len(dist_vars)
    n_cols = 2
    n_rows = (n_vars + 1) // 2
    
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(12, 4 * n_rows))
    axes = axes.flatten() if n_vars > 1 else [axes]
    
    for idx, (var, label) in enumerate(dist_vars):
        data = df[var].dropna()
        
        # Plot histogram with KDE
        axes[idx].hist(data, bins=50, alpha=0.7, color='steelblue', edgecolor='black')
        axes[idx].set_xlabel(label, fontweight='bold')
        axes[idx].set_ylabel('Frequency', fontweight='bold')
        axes[idx].set_title(f'Distribution: {label}', fontsize=11, fontweight='bold')
        axes[idx].grid(axis='y', alpha=0.3)
        
        # Add statistics text
        mean_val = data.mean()
        median_val = data.median()
        axes[idx].axvline(mean_val, color='red', linestyle='--', linewidth=1.5, label=f'Mean: {mean_val:.1f}')
        axes[idx].axvline(median_val, color='green', linestyle='--', linewidth=1.5, label=f'Median: {median_val:.1f}')
        axes[idx].legend()
    
    # Hide unused subplots
    for idx in range(n_vars, len(axes)):
        axes[idx].axis('off')
    
    plt.suptitle('Variable Distributions', fontsize=14, fontweight='bold', y=1.00)
    plt.tight_layout()
    
    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'distributions.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    
    print(f"✓ Generated distribution plots: {output_path}")


def plot_energy_trends(df, output_dir='preprocessing/outputs'):
    """
    Plot global trends for fossil vs renewable vs nuclear energy over time.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        output_dir (str): Directory to save plot
    """
    # Aggregate by year
    energy_cols = {
        'fossil_fuel_consumption': 'Fossil Fuels',
        'renewables_consumption': 'Renewables',
        'nuclear_consumption': 'Nuclear'
    }
    
    available_cols = {k: v for k, v in energy_cols.items() if k in df.columns}
    
    if not available_cols:
        print("⚠ Energy consumption columns not found, skipping trend plot")
        return
    
    # Group by year
    yearly_data = df.groupby('year')[list(available_cols.keys())].sum().reset_index()
    
    # Create plot
    plt.figure(figsize=(12, 6))
    
    colors = {
        'fossil_fuel_consumption': '#6b7280',  # Gray
        'renewables_consumption': '#10b981',   # Green
        'nuclear_consumption': '#8b5cf6'       # Purple
    }
    
    for col, label in available_cols.items():
        plt.plot(
            yearly_data['year'],
            yearly_data[col],
            marker='o',
            markersize=4,
            linewidth=2,
            label=label,
            color=colors.get(col, 'blue')
        )
    
    plt.xlabel('Year', fontsize=12, fontweight='bold')
    plt.ylabel('Energy Consumption (TWh)', fontsize=12, fontweight='bold')
    plt.title('Global Energy Consumption Trends by Source (2000-2019)', fontsize=14, fontweight='bold', pad=20)
    plt.legend(loc='best', framealpha=0.9)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    
    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'energy_trends.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    
    print(f"✓ Generated energy trends plot: {output_path}")


def plot_emissions_trend(df, output_dir='preprocessing/outputs'):
    """
    Plot global emissions over time with trend line.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        output_dir (str): Directory to save plot
    """
    if 'greenhouse_gas_emissions' not in df.columns:
        print("⚠ Emissions data not available, skipping emissions trend plot")
        return
    
    # Aggregate global emissions by year
    emissions_data = df.groupby('year')['greenhouse_gas_emissions'].sum().reset_index()
    emissions_data = emissions_data.dropna()
    
    if len(emissions_data) < 2:
        print("⚠ Insufficient emissions data for trend plot")
        return
    
    # Create plot
    plt.figure(figsize=(12, 6))
    
    # Plot actual data
    plt.plot(
        emissions_data['year'],
        emissions_data['greenhouse_gas_emissions'],
        marker='o',
        markersize=6,
        linewidth=2,
        color='#ef4444',
        label='Actual Emissions'
    )
    
    # Add trend line (linear regression)
    x = emissions_data['year'].values
    y = emissions_data['greenhouse_gas_emissions'].values
    
    # Simple linear regression
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)
    plt.plot(x, p(x), linestyle='--', linewidth=2, color='darkred', label=f'Trend Line (slope: {z[0]:.2f})')
    
    plt.xlabel('Year', fontsize=12, fontweight='bold')
    plt.ylabel('Greenhouse Gas Emissions (Mt CO₂eq)', fontsize=12, fontweight='bold')
    plt.title('Global Greenhouse Gas Emissions Trend (2000-2019)', fontsize=14, fontweight='bold', pad=20)
    plt.legend(loc='best', framealpha=0.9)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    
    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'emissions_trend.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    
    print(f"✓ Generated emissions trend plot: {output_path}")


def generate_insights(df, stats, trends, corr_matrix):
    """
    Extract 5-8 key insights from data analysis.
    
    Args:
        df (pd.DataFrame): Clean energy dataset
        stats (dict): Descriptive statistics
        trends (dict): Trend analysis results
        corr_matrix (pd.DataFrame): Correlation matrix
        
    Returns:
        list: List of insight strings
    """
    insights = []
    
    # Insight 1: Energy consumption trend
    if 'energy_consumption' in trends:
        insights.append(trends['energy_consumption']['description'])
    
    # Insight 2: Renewable growth
    if 'renewable_share' in trends:
        insights.append(trends['renewable_share']['description'])
    
    # Insight 3: Emissions trend
    if 'emissions' in trends:
        insights.append(trends['emissions']['description'])
    
    # Insight 4: Top energy consumers
    if 'total_energy' in df.columns and 'country' in df.columns:
        recent_year = df['year'].max()
        top_consumers = df[df['year'] == recent_year].nlargest(10, 'total_energy')
        total_global = df[df['year'] == recent_year]['total_energy'].sum()
        top_10_share = (top_consumers['total_energy'].sum() / total_global * 100) if total_global > 0 else 0
        insights.append(f"Top 10 countries account for {top_10_share:.1f}% of global energy consumption in {recent_year}")
    
    # Insight 5: GDP-Energy correlation
    if not corr_matrix.empty and 'gdp' in corr_matrix.columns and 'total_energy' in corr_matrix.columns:
        corr_val = corr_matrix.loc['gdp', 'total_energy']
        insights.append(f"Strong {'positive' if corr_val > 0 else 'negative'} correlation (r={corr_val:.2f}) between GDP and energy consumption")
    
    # Insight 6: Energy per capita variation
    if 'energy_per_capita' in stats:
        mean_val = stats['energy_per_capita']['mean']
        std_val = stats['energy_per_capita']['std']
        cv = (std_val / mean_val * 100) if mean_val > 0 else 0
        insights.append(f"Energy per capita shows high variation (CV={cv:.1f}%), indicating significant inequality across countries")
    
    # Insight 7: Fossil fuel dominance
    if 'fossil_share' in stats:
        mean_fossil = stats['fossil_share']['mean']
        insights.append(f"Fossil fuels dominate global energy mix, averaging {mean_fossil:.1f}% share")
    
    # Insight 8: Renewable energy growth potential
    if 'renewable_share' in stats and 'renewable_share' in trends:
        current_share = trends['renewable_share']['end']
        insights.append(f"Renewable energy reached {current_share:.1f}% share by 2019, showing positive growth trajectory")
    
    return insights[:8]  # Limit to 8 insights


def main():
    """
    Execute the complete EDA pipeline.
    """
    print("=" * 60)
    print("ENERGY DATA EXPLORATORY ANALYSIS")
    print("=" * 60)
    
    try:
        # Step 1: Load clean data
        print("\n[1/7] Loading clean data...")
        df = load_clean_data('data/clean_energy.csv')
        
        # Step 2: Descriptive statistics
        print("\n[2/7] Computing descriptive statistics...")
        stats = descriptive_statistics(df)
        
        # Step 3: Trend analysis
        print("\n[3/7] Analyzing trends...")
        trends = trend_analysis(df)
        
        # Step 4: Correlation analysis
        print("\n[4/7] Performing correlation analysis...")
        corr_matrix = correlation_analysis(df)
        
        # Step 5: Distribution analysis
        print("\n[5/7] Generating distribution plots...")
        distribution_analysis(df)
        
        # Step 6: Energy trends plot
        print("\n[6/7] Plotting energy trends...")
        plot_energy_trends(df)
        
        # Step 7: Emissions trend plot (if data available)
        print("\n[7/7] Plotting emissions trend...")
        plot_emissions_trend(df)
        
        # Generate insights
        print("\n" + "=" * 60)
        print("KEY INSIGHTS")
        print("=" * 60)
        
        insights = generate_insights(df, stats, trends, corr_matrix)
        for i, insight in enumerate(insights, 1):
            print(f"{i}. {insight}")
        
        print("\n" + "=" * 60)
        print("✓ EDA COMPLETE")
        print("=" * 60)
        print(f"\nOutput files saved to: preprocessing/outputs/")
        print("  - correlation_heatmap.png")
        print("  - distributions.png")
        print("  - energy_trends.png")
        print("  - emissions_trend.png")
        
    except Exception as e:
        print(f"\n✗ EDA failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
