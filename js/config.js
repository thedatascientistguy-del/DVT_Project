/**
 * Configuration Module for Energy Transition Dashboard
 * 
 * This module provides centralized constants for:
 * - Color schemes for energy sources and metrics
 * - Animation settings
 * - Chart dimensions and margins
 * - Tooltip configuration
 * - Data constants (year range, top N, decimal places)
 * 
 * All visualizations should import and use this CONFIG object
 * to ensure consistent styling and behavior across the dashboard.
 */

/**
 * Centralized configuration object
 * @constant {Object}
 */
export const CONFIG = {
  /**
   * Color palette for energy sources, metrics, and UI elements
   * Uses Tailwind-inspired color values for consistency
   */
  colors: {
    // Energy sources
    coal: '#6b7280',       // Gray
    oil: '#f97316',        // Orange
    gas: '#3b82f6',        // Blue
    renewables: '#10b981', // Green
    nuclear: '#8b5cf6',    // Purple
    solar: '#fbbf24',      // Yellow
    wind: '#38bdf8',       // Light Blue
    hydro: '#059669',      // Dark Green
    biofuel: '#84cc16',    // Lime
    
    // Metrics
    emissions: '#ef4444',  // Red
    demand: '#f59e0b',     // Amber
    generation: '#06b6d4', // Cyan
    lowCarbon: '#10b981',  // Green gradient
    
    // Correlation/intensity gradients
    intensityLow: '#10b981',
    intensityHigh: '#ef4444',
    
    // UI theme colors (dark mode)
    background: '#0b0f1a',
    panel: '#111827',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    border: '#1f2937',
    hover: '#1f2937',
    
    // Additional chart colors for multi-series
    chart1: '#3b82f6',  // Blue
    chart2: '#10b981',  // Green
    chart3: '#f59e0b',  // Amber
    chart4: '#8b5cf6',  // Purple
    chart5: '#ec4899',  // Pink
  },
  
  /**
   * Animation configuration
   * Controls transition timing and easing for smooth visual updates
   */
  animation: {
    duration: 500,                // Transition duration in milliseconds
    easing: d3.easeCubicInOut,    // D3 easing function for smooth animations
    staggerDelay: 30,             // Delay between staggered animations (ms)
    initialDelay: 100             // Delay before starting initial animation (ms)
  },
  
  /**
   * Chart dimensions and spacing
   * Provides consistent margins and sizing across all visualizations
   */
  chart: {
    margin: { 
      top: 40, 
      right: 30, 
      bottom: 60, 
      left: 70 
    },
    minHeight: 300,              // Minimum chart height in pixels
    aspectRatio: 1.5,            // Width/height ratio for responsive charts
    padding: 0.1,                // Padding for band scales (0-1)
    legendHeight: 30,            // Height reserved for legends
    axisPadding: 5               // Padding between axis and chart area
  },
  
  /**
   * Tooltip configuration
   * Controls tooltip positioning and timing
   */
  tooltip: {
    offset: { x: 10, y: -20 },   // Offset from cursor position
    showDelay: 100,              // Delay before showing tooltip (ms)
    hideDelay: 100,              // Delay before hiding tooltip (ms)
    maxWidth: 250,               // Maximum tooltip width (px)
    padding: 10                  // Internal padding (px)
  },
  
  /**
   * Data configuration
   * Constants related to data processing and display
   */
  data: {
    yearRange: [2000, 2019],     // Valid year range for the dataset
    topN: 10,                    // Number of top items to show in rankings
    topNPerCapita: 15,           // Number of countries for per capita charts
    decimalPlaces: 2,            // Default decimal places for formatting
    minDataPoints: 3,            // Minimum data points required to render chart
    nullReplacement: 0,          // Value to use for null/undefined in calculations
    percentPrecision: 1          // Decimal places for percentage values
  },
  
  /**
   * Chart-specific configuration
   * Override settings for specific chart types
   */
  chartTypes: {
    pie: {
      innerRadius: 0,            // 0 for pie chart, >0 for donut chart
      labelThreshold: 5,         // Show labels only for slices >5%
      cornerRadius: 0            // Rounded corners for arcs
    },
    
    donut: {
      innerRadius: 0.5,          // Ratio of inner to outer radius
      labelThreshold: 5,
      cornerRadius: 2
    },
    
    bar: {
      maxBarWidth: 50,           // Maximum bar width in pixels
      minBarWidth: 5,            // Minimum bar width in pixels
      cornerRadius: 2            // Rounded corners for bars
    },
    
    scatter: {
      minRadius: 3,              // Minimum circle radius
      maxRadius: 20,             // Maximum circle radius
      opacity: 0.7               // Circle opacity (0-1)
    },
    
    area: {
      opacity: 0.3,              // Fill opacity for area charts
      strokeWidth: 2             // Line stroke width
    }
  }
};

/**
 * Helper function to get color by energy source name
 * Handles case-insensitive matching and provides fallback color
 * 
 * @param {string} source - Energy source name
 * @returns {string} Hex color code
 * 
 * @example
 * getSourceColor('Coal')        // '#6b7280'
 * getSourceColor('renewables')  // '#10b981'
 * getSourceColor('unknown')     // '#6b7280' (default)
 */
export function getSourceColor(source) {
  if (!source) return CONFIG.colors.coal;
  
  const normalized = source.toLowerCase().replace(/[_\s]/g, '');
  
  const colorMap = {
    'coal': CONFIG.colors.coal,
    'oil': CONFIG.colors.oil,
    'gas': CONFIG.colors.gas,
    'natural_gas': CONFIG.colors.gas,
    'renewables': CONFIG.colors.renewables,
    'renewable': CONFIG.colors.renewables,
    'nuclear': CONFIG.colors.nuclear,
    'solar': CONFIG.colors.solar,
    'wind': CONFIG.colors.wind,
    'hydro': CONFIG.colors.hydro,
    'hydropower': CONFIG.colors.hydro,
    'biofuel': CONFIG.colors.biofuel,
    'biofuels': CONFIG.colors.biofuel,
    'biomass': CONFIG.colors.biofuel,
    'fossil': CONFIG.colors.coal,
    'lowcarbon': CONFIG.colors.lowCarbon,
    'emissions': CONFIG.colors.emissions
  };
  
  return colorMap[normalized] || CONFIG.colors.coal;
}

/**
 * Helper function to get chart-specific configuration
 * 
 * @param {string} chartType - Type of chart (pie, donut, bar, scatter, area)
 * @returns {Object} Chart-specific configuration
 * 
 * @example
 * const pieConfig = getChartConfig('pie');
 * console.log(pieConfig.labelThreshold); // 5
 */
export function getChartConfig(chartType) {
  return CONFIG.chartTypes[chartType] || {};
}

console.log('✓ Configuration module loaded');

