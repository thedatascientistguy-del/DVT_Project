/**
 * Data Loader Module for Energy Transition Dashboard
 * 
 * This module handles loading and parsing CSV data from the preprocessed energy dataset.
 * It includes type conversion, null handling, and data validation.
 */

/**
 * Load energy data from CSV file with proper type conversion and filtering
 * 
 * @param {string} filepath - Path to the CSV file (default: 'data/clean_energy.csv')
 * @returns {Promise<Array<EnergyRecord>>} Promise resolving to array of energy records
 * @throws {Error} If data loading fails or file is not accessible
 * 
 * @example
 * const data = await loadEnergyData();
 * console.log(`Loaded ${data.length} records`);
 */
export async function loadEnergyData(filepath = 'data/clean_energy.csv') {
  try {
    // Load CSV with D3 and apply type conversion
    const data = await d3.csv(filepath, row => ({
      // Identifiers
      country: row.country,
      year: +row.year,
      iso_code: row.iso_code,
      
      // Demographic & Economic
      population: +row.population || null,
      gdp: +row.gdp || null,
      
      // Energy Consumption by Source (TWh)
      coal_consumption: +row.coal_consumption || 0,
      oil_consumption: +row.oil_consumption || 0,
      gas_consumption: +row.gas_consumption || 0,
      renewables_consumption: +row.renewables_consumption || 0,
      nuclear_consumption: +row.nuclear_consumption || 0,
      fossil_fuel_consumption: +row.fossil_fuel_consumption || 0,
      
      // Renewable Subcategories (TWh)
      solar_consumption: +row.solar_consumption || 0,
      wind_consumption: +row.wind_consumption || 0,
      hydro_consumption: +row.hydro_consumption || 0,
      biofuel_consumption: +row.biofuel_consumption || 0,
      other_renewable_consumption: +row.other_renewable_consumption || 0,
      
      // Electricity Metrics (TWh)
      electricity_generation: +row.electricity_generation || null,
      electricity_demand: +row.electricity_demand || null,
      
      // Environmental Impact
      greenhouse_gas_emissions: +row.greenhouse_gas_emissions || null,
      carbon_intensity_elec: +row.carbon_intensity_elec || null,
      
      // Per Capita Metrics
      energy_per_capita: +row.energy_per_capita || null,
      per_capita_electricity: +row.per_capita_electricity || null,
      
      // Energy Shares (Percentages)
      fossil_share_energy: +row.fossil_share_energy || 0,
      renewable_share_energy: +row.renewable_share_energy || 0,
      low_carbon_share_energy: +row.low_carbon_share_energy || 0,
      coal_share_energy: +row.coal_share_energy || 0,
      oil_share_energy: +row.oil_share_energy || 0,
      gas_share_energy: +row.gas_share_energy || 0,
      nuclear_share_energy: +row.nuclear_share_energy || 0,
      solar_share_energy: +row.solar_share_energy || 0,
      wind_share_energy: +row.wind_share_energy || 0,
      hydro_share_energy: +row.hydro_share_energy || 0,
      
      // Electricity Shares (Percentages)
      renewables_share_elec: +row.renewables_share_elec || 0,
      low_carbon_share_elec: +row.low_carbon_share_elec || 0,
      fossil_share_elec: +row.fossil_share_elec || 0,
      nuclear_share_elec: +row.nuclear_share_elec || 0,
      solar_share_elec: +row.solar_share_elec || 0,
      wind_share_elec: +row.wind_share_elec || 0,
      hydro_share_elec: +row.hydro_share_elec || 0,
      
      // Derived Metrics (calculated in preprocessing)
      total_energy: +row.total_energy || 0,
      fossil_share: +row.fossil_share || 0,
      renewable_share: +row.renewable_share || 0,
      low_carbon_energy: +row.low_carbon_energy || 0,
      
      // Additional metrics
      primary_energy_consumption: +row.primary_energy_consumption || 0,
      energy_per_gdp: +row.energy_per_gdp || null
    }));
    
    // Filter to year range (2000-2019)
    const filtered = data.filter(d => d.year >= 2000 && d.year <= 2019);
    
    // Get unique countries for logging
    const uniqueCountries = new Set(filtered.map(d => d.country));
    
    console.log(`✓ Data loading successful:`);
    console.log(`  - Loaded ${filtered.length} records`);
    console.log(`  - ${uniqueCountries.size} countries`);
    console.log(`  - Year range: 2000-2019`);
    
    return filtered;
    
  } catch (error) {
    console.error('❌ Data loading failed:', error);
    
    // Provide user-friendly error message based on error type
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('Failed to load energy data. The data file could not be found. Please ensure clean_energy.csv exists in the data directory.');
    } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
      throw new Error('Failed to load energy data due to a network error. Please check your internet connection and try again.');
    } else if (error.message.includes('parse') || error.message.includes('CSV')) {
      throw new Error('Failed to parse energy data. The CSV file may be corrupted or improperly formatted.');
    } else {
      throw new Error(`Failed to load energy data: ${error.message}`);
    }
  }
}

/**
 * Validate that loaded data contains required fields and is not empty
 * 
 * @param {Array<EnergyRecord>} data - The loaded energy dataset
 * @returns {boolean} True if validation passes
 * @throws {Error} If validation fails
 * 
 * @example
 * const data = await loadEnergyData();
 * validateData(data);  // Throws if invalid
 */
export function validateData(data) {
  // Check if data exists and is an array
  if (!data || !Array.isArray(data)) {
    throw new Error('No data loaded: Data is null, undefined, or not an array.');
  }
  
  // Check if data is empty
  if (data.length === 0) {
    throw new Error('No data loaded: The dataset is empty. Please check the CSV file.');
  }
  
  // Define required fields that must exist in every record
  const requiredFields = ['country', 'year'];
  
  // Check first record for required fields
  const firstRecord = data[0];
  const missingFields = requiredFields.filter(field => 
    !firstRecord.hasOwnProperty(field)
  );
  
  if (missingFields.length > 0) {
    throw new Error(`Data validation failed: Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Check for valid year values
  const invalidYears = data.filter(d => 
    typeof d.year !== 'number' || isNaN(d.year) || d.year < 1900 || d.year > 2100
  );
  
  if (invalidYears.length > 0) {
    throw new Error(`Data validation failed: Found ${invalidYears.length} records with invalid year values.`);
  }
  
  // Check for valid country values
  const invalidCountries = data.filter(d => 
    !d.country || typeof d.country !== 'string' || d.country.trim() === ''
  );
  
  if (invalidCountries.length > 0) {
    throw new Error(`Data validation failed: Found ${invalidCountries.length} records with invalid or empty country names.`);
  }
  
  // Log data quality information
  logDataQuality(data);
  
  console.log('✓ Data validation passed');
  return true;
}

/**
 * Log data quality metrics for debugging and monitoring
 * @private
 * @param {Array<EnergyRecord>} data - The loaded energy dataset
 */
function logDataQuality(data) {
  const totalRecords = data.length;
  
  // Metrics to check for data quality
  const metricsToCheck = [
    'population',
    'gdp',
    'greenhouse_gas_emissions',
    'carbon_intensity_elec',
    'energy_per_capita',
    'electricity_generation',
    'electricity_demand'
  ];
  
  console.log('Data Quality Report:');
  
  metricsToCheck.forEach(metric => {
    const nullCount = data.filter(d => d[metric] == null).length;
    const nullPct = (nullCount / totalRecords) * 100;
    
    if (nullPct > 30) {
      console.warn(`  ⚠ ${metric}: ${nullPct.toFixed(1)}% missing values (${nullCount}/${totalRecords})`);
    } else if (nullPct > 10) {
      console.log(`  ℹ ${metric}: ${nullPct.toFixed(1)}% missing values (${nullCount}/${totalRecords})`);
    }
  });
  
  // Check for countries with sparse data
  const countryCounts = new Map();
  data.forEach(d => {
    countryCounts.set(d.country, (countryCounts.get(d.country) || 0) + 1);
  });
  
  const sparseCountries = Array.from(countryCounts.entries())
    .filter(([_, count]) => count < 10)
    .map(([country, count]) => `${country} (${count} records)`);
  
  if (sparseCountries.length > 0) {
    console.log(`  ℹ Countries with sparse data (<10 records): ${sparseCountries.length}`);
  }
}
