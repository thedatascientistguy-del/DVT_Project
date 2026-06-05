/**
 * Utility Functions Module for Energy Transition Dashboard
 * 
 * This module provides reusable data processing functions including:
 * - Data aggregation by year
 * - Country and year range filtering
 * - Number and percentage formatting
 * - Growth rate calculations
 * - Multi-metric aggregation
 */

/**
 * Aggregate data across countries for a specific metric by year
 * Used for "All Countries" view to sum values from all countries for each year
 * 
 * @param {Array<EnergyRecord>} data - The filtered energy dataset
 * @param {string} metric - The metric field to aggregate (e.g., 'total_energy')
 * @returns {Array<TimeSeriesPoint>} Array of { year, value } objects sorted by year
 * 
 * @example
 * const trend = aggregateByYear(data, 'renewables_consumption');
 * // Returns: [{ year: 2000, value: 1234 }, { year: 2001, value: 1300 }, ...]
 */
export function aggregateByYear(data, metric) {
  // Group data by year using d3.group
  const grouped = d3.group(data, d => d.year);
  
  // Sum metric values for each year, handling null/undefined values
  return Array.from(grouped, ([year, rows]) => ({
    year,
    value: d3.sum(rows, d => d[metric] || 0)
  })).sort((a, b) => a.year - b.year);
}

/**
 * Filter data by country selection
 * If country is "All Countries", returns all data
 * Otherwise, returns only records for the specified country
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @param {string} country - Country name or "All Countries"
 * @returns {Array<EnergyRecord>} Filtered data
 * 
 * @example
 * const usaData = filterByCountry(data, 'United States');
 * const allData = filterByCountry(data, 'All Countries');
 */
export function filterByCountry(data, country) {
  if (country === 'All Countries') {
    return data;
  }
  return data.filter(d => d.country === country);
}

/**
 * Filter data by year range (inclusive)
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @param {number} minYear - Minimum year (inclusive)
 * @param {number} maxYear - Maximum year (inclusive)
 * @returns {Array<EnergyRecord>} Filtered data
 * 
 * @example
 * const filtered = filterByYearRange(data, 2010, 2015);
 */
export function filterByYearRange(data, minYear, maxYear) {
  return data.filter(d => d.year >= minYear && d.year <= maxYear);
}

/**
 * Get unique countries from dataset, sorted alphabetically
 * Includes "All Countries" as the first option
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @returns {Array<string>} Sorted array of unique country names with "All Countries" first
 * 
 * @example
 * const countries = getUniqueCountries(data);
 * // Returns: ['All Countries', 'China', 'Germany', 'India', 'United States', ...]
 */
export function getUniqueCountries(data) {
  const uniqueCountries = Array.from(new Set(data.map(d => d.country))).sort();
  return ['All Countries', ...uniqueCountries];
}

/**
 * Format large numbers with K/M/B suffixes for human readability
 * 
 * @param {number|null|undefined} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumber(1500000)      // "1.50M"
 * formatNumber(2500)         // "2.50K"
 * formatNumber(25)           // "25.00"
 * formatNumber(null)         // "N/A"
 * formatNumber(3500000000)   // "3.50B"
 */
export function formatNumber(num, decimals = 2) {
  // Handle null, undefined, or NaN values
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  const absNum = Math.abs(num);
  
  // Billions
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  
  // Millions
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  
  // Thousands
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  
  // Less than 1000
  return num.toFixed(decimals);
}

/**
 * Format number as percentage with specified decimal places
 * 
 * @param {number|null|undefined} num - Number to format (e.g., 45.6 for 45.6%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 * 
 * @example
 * formatPercent(45.6)     // "45.6%"
 * formatPercent(100)      // "100.0%"
 * formatPercent(null)     // "N/A"
 * formatPercent(12.345, 2) // "12.35%"
 */
export function formatPercent(num, decimals = 1) {
  // Handle null, undefined, or NaN values
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  return num.toFixed(decimals) + '%';
}

/**
 * Calculate year-over-year growth rate for a specific metric
 * Returns array of growth rates (percentage change from previous year)
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset (should be for a single country or aggregated)
 * @param {string} metric - The metric field to calculate growth for (e.g., 'renewables_consumption')
 * @returns {Array<{year: number, growthRate: number}>} Array of growth rate objects
 * 
 * @example
 * const growthData = calculateGrowthRate(data, 'renewables_consumption');
 * // Returns: [{ year: 2001, growthRate: 5.2 }, { year: 2002, growthRate: -2.1 }, ...]
 * 
 * @note
 * - Skips years where previous or current value is null/undefined
 * - Skips calculation if previous value is zero (division by zero protection)
 * - Growth rate is expressed as percentage (e.g., 20 for 20% growth)
 */
export function calculateGrowthRate(data, metric) {
  // Sort data by year to ensure correct ordering
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const result = [];
  
  // Calculate growth for each year compared to previous year
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1][metric];
    const curr = sorted[i][metric];
    
    // Only calculate if both values exist and previous value is not zero
    if (prev != null && curr != null && prev !== 0) {
      const growthRate = ((curr - prev) / prev) * 100;
      result.push({
        year: sorted[i].year,
        growthRate: growthRate
      });
    }
  }
  
  return result;
}

/**
 * Aggregate multiple metrics for comparison
 * Calculates mean value for each metric across the provided data
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @param {Array<string>} metrics - Array of metric field names to aggregate
 * @returns {Array<{metric: string, value: number}>} Array of metric-value pairs
 * 
 * @example
 * const comparison = aggregateMultipleMetrics(data, [
 *   'total_energy',
 *   'greenhouse_gas_emissions',
 *   'renewable_share'
 * ]);
 * // Returns: [
 * //   { metric: 'total_energy', value: 5432.1 },
 * //   { metric: 'greenhouse_gas_emissions', value: 1234.5 },
 * //   { metric: 'renewable_share', value: 23.4 }
 * // ]
 * 
 * @note
 * - Uses d3.mean() which automatically handles null values
 * - Returns 0 if no valid values exist for a metric
 */
export function aggregateMultipleMetrics(data, metrics) {
  return metrics.map(metric => ({
    metric,
    value: d3.mean(data, d => d[metric]) || 0
  }));
}

/**
 * Calculate percentage share of a part relative to a total
 * Handles division by zero and null values gracefully
 * 
 * @param {number|null} part - The part value
 * @param {number|null} total - The total value
 * @returns {number} Percentage share (0-100), or 0 if invalid
 * 
 * @example
 * calculateShare(25, 100)  // 25.0
 * calculateShare(0, 0)     // 0
 * calculateShare(50, null) // 0
 */
export function calculateShare(part, total) {
  if (part == null || total == null || total === 0) {
    return 0;
  }
  return (part / total) * 100;
}

/**
 * Safely handle missing or invalid numeric values
 * Returns the value if valid, otherwise returns the default value
 * 
 * @param {number|null|undefined} value - Value to check
 * @param {number} defaultValue - Default value to return if invalid (default: 0)
 * @returns {number} Valid number or default value
 * 
 * @example
 * handleMissingData(123)       // 123
 * handleMissingData(null)      // 0
 * handleMissingData(undefined, 100)  // 100
 * handleMissingData(NaN)       // 0
 */
export function handleMissingData(value, defaultValue = 0) {
  return value != null && !isNaN(value) ? value : defaultValue;
}

/**
 * Calculate weighted average for a metric across countries
 * Useful for calculating global averages weighted by another metric (e.g., population)
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @param {string} metric - The metric to average
 * @param {string} weightMetric - The metric to use as weight
 * @returns {number|null} Weighted average, or null if no valid data
 * 
 * @example
 * // Calculate global carbon intensity weighted by electricity generation
 * const avgIntensity = calculateWeightedAverage(
 *   data,
 *   'carbon_intensity_elec',
 *   'electricity_generation'
 * );
 */
export function calculateWeightedAverage(data, metric, weightMetric) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  data.forEach(d => {
    const value = d[metric];
    const weight = d[weightMetric];
    
    if (value != null && weight != null && !isNaN(value) && !isNaN(weight) && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

/**
 * Get top N items from dataset by a specific metric
 * 
 * @param {Array<EnergyRecord>} data - The energy dataset
 * @param {string} metric - The metric to rank by
 * @param {number} n - Number of top items to return (default: 10)
 * @param {boolean} ascending - Sort in ascending order if true (default: false for descending)
 * @returns {Array<EnergyRecord>} Top N records sorted by metric
 * 
 * @example
 * const topConsumers = getTopN(data, 'total_energy', 10);
 * const lowestEmitters = getTopN(data, 'greenhouse_gas_emissions', 5, true);
 */
export function getTopN(data, metric, n = 10, ascending = false) {
  // Filter out records with null/undefined values for the metric
  const validData = data.filter(d => d[metric] != null && !isNaN(d[metric]));
  
  // Sort data
  const sorted = [...validData].sort((a, b) => 
    ascending ? a[metric] - b[metric] : b[metric] - a[metric]
  );
  
  // Return top N
  return sorted.slice(0, n);
}

/**
 * Calculate linear regression for two metrics
 * Returns slope and intercept for trend line calculation
 * 
 * @param {Array<number>} xValues - X-axis values
 * @param {Array<number>} yValues - Y-axis values
 * @returns {{slope: number, intercept: number, r2: number}|null} Regression parameters or null if invalid
 * 
 * @example
 * const regression = calculateLinearRegression(
 *   data.map(d => d.gdp),
 *   data.map(d => d.total_energy)
 * );
 * // Returns: { slope: 0.045, intercept: 123.4, r2: 0.85 }
 */
export function calculateLinearRegression(xValues, yValues) {
  if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length < 2) {
    return null;
  }
  
  const n = xValues.length;
  
  // Calculate means
  const xMean = d3.mean(xValues);
  const yMean = d3.mean(yValues);
  
  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }
  
  if (denominator === 0) {
    return null;
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R-squared
  let ssRes = 0;
  let ssTot = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    ssRes += (yValues[i] - predicted) ** 2;
    ssTot += (yValues[i] - yMean) ** 2;
  }
  
  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
  
  return { slope, intercept, r2 };
}

/**
 * Normalize array of values to percentages (sum to 100%)
 * Useful for stacked charts and pie charts
 * 
 * @param {Array<number>} values - Array of numeric values
 * @returns {Array<number>} Array of percentages (sum = 100)
 * 
 * @example
 * normalizeToPercent([25, 50, 25])  // [25, 50, 25]
 * normalizeToPercent([10, 20, 30])  // [16.67, 33.33, 50]
 */
export function normalizeToPercent(values) {
  const total = d3.sum(values);
  
  if (total === 0) {
    return values.map(() => 0);
  }
  
  return values.map(v => (v / total) * 100);
}
