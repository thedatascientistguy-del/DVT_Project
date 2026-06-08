/**
 * Main Application Controller for Energy Transition Dashboard
 * 
 * This module orchestrates the initialization and coordination of:
 * - Data loading
 * - Filter system
 * - All 15 visualization charts
 * - Error handling
 * - Browser compatibility checks
 */

import { loadEnergyData, validateData } from './dataLoader.js';
import { FilterManager } from './filters.js';
import { CONFIG } from './config.js';

// Import all chart modules
import renderGlobalEnergyTrend from './charts/globalEnergyTrend.js';
import renderCO2EmissionsTrend from './charts/co2EmissionsTrend.js';
import renderElectricityDemandGen from './charts/electricityDemandGen.js';
import renderEnergyMixStacked from './charts/energyMixStacked.js';
import renderElectricitySource from './charts/electricitySource.js';
import renderFossilBreakdown from './charts/fossilBreakdown.js';
import renderRenewableBreakdown from './charts/renewableBreakdown.js';
import renderLowCarbonTrend from './charts/lowCarbonTrend.js';
import renderTopConsumers from './charts/topConsumers.js';
import renderPerCapitaUsage from './charts/perCapitaUsage.js';
import renderCountryComparison from './charts/countryComparison.js';
import renderGdpEnergyCorrelation from './charts/gdpEnergyCorrelation.js';
import renderEnergyEmissionsCorr from './charts/energyEmissionsCorr.js';
import renderRenewableGrowth from './charts/renewableGrowth.js';
import renderCarbonIntensity from './charts/carbonIntensity.js';
import renderEnergyIntensityGdp from './charts/energyIntensityGdp.js';
import renderNuclearTrend from './charts/nuclearTrend.js';
import renderTransitionProgress from './charts/transitionProgress.js';
import renderSolarWindGrowth from './charts/solarWindGrowth.js';
import renderEmissionsPerCapita from './charts/emissionsPerCapita.js';
import renderCoalDecline from './charts/coalDecline.js';
import renderWorldEnergyMap from './charts/worldEnergyMap.js';

/**
 * Global application state
 */
const app = {
  data: null,
  filterManager: null,
  charts: [],
  isInitialized: false
};

/**
 * Initialize the dashboard
 * Main entry point for the application
 */
async function initDashboard() {
  try {
    console.log('🚀 Initializing Energy Transition Dashboard...');
    
    // Show loading indicator
    showLoading();
    
    // Check browser compatibility
    checkBrowserSupport();
    
    // Load and validate data
    console.log('📊 Loading energy data...');
    app.data = await loadEnergyData();
    validateData(app.data);
    console.log(`✓ Loaded ${app.data.length} records successfully`);
    
    // Initialize filter manager
    console.log('🎛️ Initializing filter system...');
    app.filterManager = new FilterManager();
    
    // Initialize UI controls
    initializeControls();
    
    // Initialize all charts
    console.log('📈 Initializing visualizations...');
    await initializeCharts();
    
    // Subscribe charts to filter changes
    subscribeChartsToFilters();
    
    // Hide loading indicator
    hideLoading();
    
    app.isInitialized = true;
    console.log('✅ Dashboard initialization complete!');
    console.log(`   - ${app.charts.length} charts initialized`);
    console.log(`   - Filter system active`);
    console.log(`   - Ready for interaction`);
    
  } catch (error) {
    console.error('❌ Dashboard initialization failed:', error);
    displayErrorMessage(error.message);
    hideLoading();
  }
}

/**
 * Check if browser supports required features
 * @throws {Error} If browser is not compatible
 */
function checkBrowserSupport() {
  const features = {
    'd3': typeof d3 !== 'undefined',
    'Promise': typeof Promise !== 'undefined',
    'fetch': typeof fetch !== 'undefined',
    'ES6': (function() {
      try {
        eval('"use strict"; const test = () => {};');
        return true;
      } catch(e) {
        return false;
      }
    })()
  };
  
  const unsupported = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature, _]) => feature);
  
  if (unsupported.length > 0) {
    throw new Error(
      `Your browser does not support required features: ${unsupported.join(', ')}. ` +
      `Please use a modern browser like Chrome 90+, Firefox 88+, or Safari 14+.`
    );
  }
  
  console.log('✓ Browser compatibility check passed');
}

/**
 * Initialize UI controls (dropdowns, sliders, buttons)
 */
function initializeControls() {
  // Initialize country dropdown
  app.filterManager.initCountryDropdown(app.data, 'country-select');
  
  // Initialize year range slider
  if (typeof noUiSlider !== 'undefined') {
    app.filterManager.initYearRangeSlider('year-slider', 'year-range-label');
  } else {
    console.warn('noUiSlider not available, using fallback slider');
    app.filterManager.initYearSlider('year-slider', 'year-range-label');
  }
  
  // Initialize reset button
  const resetButton = document.getElementById('reset-filters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      app.filterManager.reset();
      console.log('🔄 Filters reset to default values');
    });
  }
  
  console.log('✓ UI controls initialized');
}

/**
 * Initialize all chart visualizations
 * All 22 charts are imported and rendered
 */
async function initializeCharts() {
  const chartDefinitions = [
    { id: 'chart-1', render: renderGlobalEnergyTrend, name: 'Global Energy Trend' },
    { id: 'chart-2', render: renderCO2EmissionsTrend, name: 'CO₂ Emissions Trend' },
    { id: 'chart-3', render: renderElectricityDemandGen, name: 'Electricity Demand vs Generation' },
    { id: 'chart-4', render: renderEnergyMixStacked, name: 'Energy Mix (Stacked)' },
    { id: 'chart-5', render: renderElectricitySource, name: 'Electricity Source Composition' },
    { id: 'chart-6', render: renderFossilBreakdown, name: 'Fossil Fuel Breakdown' },
    { id: 'chart-7', render: renderRenewableBreakdown, name: 'Renewable Breakdown' },
    { id: 'chart-8', render: renderLowCarbonTrend, name: 'Low-Carbon Energy Trend' },
    { id: 'chart-9', render: renderTopConsumers, name: 'Top Energy Consumers' },
    { id: 'chart-10', render: renderPerCapitaUsage, name: 'Per Capita Usage' },
    { id: 'chart-11', render: renderCountryComparison, name: 'Country Comparison' },
    { id: 'chart-12', render: renderGdpEnergyCorrelation, name: 'GDP vs Energy Correlation' },
    { id: 'chart-13', render: renderEnergyEmissionsCorr, name: 'Energy vs Emissions Correlation' },
    { id: 'chart-14', render: renderRenewableGrowth, name: 'Renewable Growth Rate' },
    { id: 'chart-15', render: renderCarbonIntensity, name: 'Carbon Intensity of Electricity' },
    { id: 'chart-16', render: renderEnergyIntensityGdp, name: 'Energy Intensity of GDP' },
    { id: 'chart-17', render: renderNuclearTrend, name: 'Nuclear Energy Trend' },
    { id: 'chart-18', render: renderTransitionProgress, name: 'Energy Transition Progress' },
    { id: 'chart-19', render: renderSolarWindGrowth, name: 'Solar & Wind Growth' },
    { id: 'chart-20', render: renderEmissionsPerCapita, name: 'Emissions Per Capita Ranking' },
    { id: 'chart-21', render: renderCoalDecline, name: 'Coal Consumption Trend' },
    { id: 'chart-22', render: renderWorldEnergyMap, name: 'World Energy Map' }
  ];
  
  const initialFilterState = app.filterManager.getState();
  
  chartDefinitions.forEach(chartDef => {
    try {
      const container = document.querySelector(`#${chartDef.id} .chart-content`);
      
      if (!container) {
        console.warn(`Container #${chartDef.id} not found, skipping...`);
        return;
      }
      
      // Render the chart
      const chartInstance = chartDef.render(container, app.data, initialFilterState);
      
      if (chartInstance) {
        app.charts.push(chartInstance);
        console.log(`✓ ${chartDef.name} initialized`);
      } else {
        console.warn(`⚠️ ${chartDef.name} returned null`);
      }
    } catch (error) {
      console.error(`❌ Error initializing ${chartDef.name}:`, error);
    }
  });
  
  console.log(`✓ ${app.charts.length}/${chartDefinitions.length} charts initialized successfully`);
}

/**
 * Subscribe all charts to filter changes
 * When filters update, all charts will automatically re-render
 */
function subscribeChartsToFilters() {
  app.filterManager.subscribe((filterState) => {
    console.log('🔄 Filter changed, updating charts...');
    console.log(`   Country: ${filterState.country}`);
    console.log(`   Year Range: ${filterState.yearRange[0]} - ${filterState.yearRange[1]}`);
    
    // Update each chart with new filter state
    app.charts.forEach((chart, index) => {
      try {
        if (chart.update && typeof chart.update === 'function') {
          chart.update(app.data, filterState);
        }
      } catch (error) {
        console.error(`Error updating chart ${index + 1}:`, error);
      }
    });
    
    console.log(`✓ ${app.charts.length} charts updated`);
  });
  
  console.log('✓ Charts subscribed to filter changes');
}

/**
 * Display loading indicator
 */
function showLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 300); // Smooth fade out
  }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function displayErrorMessage(message) {
  const errorContainer = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const closeButton = document.getElementById('error-close');
  
  if (errorContainer && errorText) {
    errorText.textContent = message;
    errorContainer.classList.remove('hidden');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        errorContainer.classList.add('hidden');
      });
    }
  } else {
    // Fallback to alert if error container doesn't exist
    alert(`Error: ${message}`);
  }
}

/**
 * Render the dashboard
 * Alias for initDashboard for consistency with common patterns
 */
function renderDashboard() {
  return initDashboard();
}

/**
 * Export app state for debugging (available in console as window.app)
 */
window.app = app;

/**
 * Initialize dashboard when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  // DOM already loaded
  initDashboard();
}

/**
 * Export functions for testing and module usage
 */
export {
  initDashboard,
  renderDashboard,
  checkBrowserSupport,
  displayErrorMessage
};

