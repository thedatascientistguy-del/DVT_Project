/**
 * Filter System Module for Energy Transition Dashboard
 * 
 * This module provides the FilterManager class which manages global filter state
 * (country selection and year range) and coordinates updates across all visualizations
 * using the observer pattern.
 * 
 * Features:
 * - Centralized filter state management
 * - Observer pattern for chart updates
 * - Country dropdown initialization and binding
 * - Year range slider initialization and binding
 * - Synchronous chart updates with notification system
 */

import { getUniqueCountries } from './utils.js';

/**
 * FilterManager class - Manages global filter state and coordinates chart updates
 * 
 * The FilterManager implements the observer pattern where charts can subscribe to
 * filter changes. When filters are updated, all subscribed charts are notified
 * simultaneously, enabling coordinated updates across the dashboard.
 * 
 * Usage example:
 * ```javascript
 * const filterManager = new FilterManager();
 * 
 * // Subscribe charts to filter changes
 * filterManager.subscribe((state) => {
 *   updateChart1(state.country, state.yearRange);
 * });
 * 
 * filterManager.subscribe((state) => {
 *   updateChart2(state.country, state.yearRange);
 * });
 * 
 * // Initialize UI controls
 * filterManager.initCountryDropdown(data, 'country-select');
 * filterManager.initYearSlider('year-slider', 'year-range-label');
 * 
 * // Update filters programmatically
 * filterManager.setCountry('United States');
 * filterManager.setYearRange(2010, 2015);
 * ```
 */
class FilterManager {
  /**
   * Create a new FilterManager instance
   * Initializes filter state with default values
   * 
   * @example
   * const filterManager = new FilterManager();
   */
  constructor() {
    /**
     * Current filter state
     * @type {{country: string, yearRange: [number, number]}}
     */
    this.state = {
      country: 'All Countries',
      yearRange: [2000, 2019]
    };
    
    /**
     * Array of callback functions subscribed to filter changes
     * @type {Array<Function>}
     */
    this.listeners = [];
    
    console.log('✓ FilterManager initialized with default state:', this.state);
  }
  
  /**
   * Subscribe to filter changes
   * The callback function will be invoked whenever filters are updated
   * 
   * @param {Function} callback - Function to call when filters change
   *                              Receives filter state as parameter: callback(state)
   * 
   * @example
   * filterManager.subscribe((state) => {
   *   console.log('Country changed to:', state.country);
   *   console.log('Year range:', state.yearRange);
   *   // Update your chart with new filter state
   * });
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('FilterManager.subscribe: callback must be a function');
      return;
    }
    
    this.listeners.push(callback);
    console.log(`✓ Subscriber added (total: ${this.listeners.length})`);
  }
  
  /**
   * Unsubscribe a callback from filter changes
   * Removes the specified callback from the listeners array
   * 
   * @param {Function} callback - The callback function to remove
   * @returns {boolean} True if callback was found and removed, false otherwise
   * 
   * @example
   * const updateChart = (state) => { ... };
   * filterManager.subscribe(updateChart);
   * // Later...
   * filterManager.unsubscribe(updateChart);
   */
  unsubscribe(callback) {
    const index = this.listeners.indexOf(callback);
    
    if (index !== -1) {
      this.listeners.splice(index, 1);
      console.log(`✓ Subscriber removed (total: ${this.listeners.length})`);
      return true;
    }
    
    console.warn('FilterManager.unsubscribe: callback not found in listeners');
    return false;
  }
  
  /**
   * Notify all subscribed listeners of filter state changes
   * Called internally whenever filter state is updated
   * 
   * @private
   * 
   * @example
   * // This is called automatically by setCountry() and setYearRange()
   * this.notifyListeners();
   */
  notifyListeners() {
    console.log(`ℹ Notifying ${this.listeners.length} subscribers of filter change`);
    
    // Call each listener with current state
    this.listeners.forEach((callback, index) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error(`Error in subscriber ${index}:`, error);
      }
    });
  }
  
  /**
   * Update the country filter
   * Sets the country filter to the specified value and notifies all listeners
   * 
   * @param {string} country - Country name or "All Countries"
   * 
   * @example
   * filterManager.setCountry('United States');
   * filterManager.setCountry('All Countries');
   */
  setCountry(country) {
    if (typeof country !== 'string') {
      console.error('FilterManager.setCountry: country must be a string');
      return;
    }
    
    console.log(`ℹ Country filter changed: "${this.state.country}" → "${country}"`);
    
    this.state.country = country;
    this.notifyListeners();
  }
  
  /**
   * Update the year range filter
   * Sets the year range filter to the specified values and notifies all listeners
   * 
   * @param {number} minYear - Minimum year (inclusive)
   * @param {number} maxYear - Maximum year (inclusive)
   * 
   * @example
   * filterManager.setYearRange(2010, 2015);
   * filterManager.setYearRange(2000, 2019); // Full range
   */
  setYearRange(minYear, maxYear) {
    // Validate inputs
    if (typeof minYear !== 'number' || typeof maxYear !== 'number') {
      console.error('FilterManager.setYearRange: minYear and maxYear must be numbers');
      return;
    }
    
    if (minYear > maxYear) {
      console.error('FilterManager.setYearRange: minYear cannot be greater than maxYear');
      return;
    }
    
    console.log(`ℹ Year range filter changed: [${this.state.yearRange[0]}, ${this.state.yearRange[1]}] → [${minYear}, ${maxYear}]`);
    
    this.state.yearRange = [minYear, maxYear];
    this.notifyListeners();
  }
  
  /**
   * Get the current filter state
   * Returns a copy of the current state to prevent external modifications
   * 
   * @returns {{country: string, yearRange: [number, number]}} Current filter state
   * 
   * @example
   * const state = filterManager.getState();
   * console.log(`Country: ${state.country}, Years: ${state.yearRange[0]}-${state.yearRange[1]}`);
   */
  getState() {
    return {
      country: this.state.country,
      yearRange: [...this.state.yearRange]
    };
  }
  
  /**
   * Reset filters to default values
   * Sets country to "All Countries" and year range to [2000, 2019]
   * 
   * @example
   * filterManager.reset();
   */
  reset() {
    console.log('ℹ Resetting filters to default values');
    
    this.state.country = 'All Countries';
    this.state.yearRange = [2000, 2019];
    this.notifyListeners();
  }
  
  /**
   * Initialize country dropdown with data and bind change event
   * Populates the dropdown with all unique countries from the dataset
   * and sets up event listener to update filter state on selection change
   * 
   * @param {Array<EnergyRecord>} data - The energy dataset
   * @param {string} selectId - ID of the select element (without '#')
   * 
   * @example
   * // HTML: <select id="country-select"></select>
   * filterManager.initCountryDropdown(data, 'country-select');
   * 
   * @note
   * - Countries are automatically sorted alphabetically
   * - "All Countries" is added as the first option
   * - The dropdown is set to "All Countries" by default
   */
  initCountryDropdown(data, selectId) {
    // Get unique countries sorted alphabetically with "All Countries" first
    const countries = getUniqueCountries(data);
    
    // Select the dropdown element using D3
    const select = d3.select(`#${selectId}`);
    
    if (select.empty()) {
      console.error(`FilterManager.initCountryDropdown: Element with id "${selectId}" not found`);
      return;
    }
    
    // Populate dropdown options
    select.selectAll('option')
      .data(countries)
      .join('option')
      .attr('value', d => d)
      .text(d => d);
    
    // Set default value to current state
    select.property('value', this.state.country);
    
    // Bind change event to update filter state
    select.on('change', (event) => {
      const selectedCountry = event.target.value;
      this.setCountry(selectedCountry);
    });
    
    console.log(`✓ Country dropdown initialized with ${countries.length} countries`);
  }
  
  /**
   * Initialize year range slider and bind change events
   * Sets up the year range slider with min/max values and updates the label
   * 
   * @param {string} sliderId - ID of the slider input element (without '#')
   * @param {string} labelId - ID of the label element to display range (without '#')
   * 
   * @example
   * // HTML:
   * // <input type="range" id="year-slider" min="2000" max="2019" />
   * // <span id="year-range-label"></span>
   * filterManager.initYearSlider('year-slider', 'year-range-label');
   * 
   * @note
   * - This is a simplified implementation for a single range slider
   * - For a dual-handle range slider, consider using a library like noUiSlider
   * - The slider defaults to the full range [2000, 2019]
   * - The label displays the current year range as "2000 - 2019"
   */
  initYearSlider(sliderId, labelId) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    
    if (!slider) {
      console.error(`FilterManager.initYearSlider: Element with id "${sliderId}" not found`);
      return;
    }
    
    if (!label) {
      console.error(`FilterManager.initYearSlider: Element with id "${labelId}" not found`);
      return;
    }
    
    // Set initial label
    const [minYear, maxYear] = this.state.yearRange;
    label.textContent = `${minYear} - ${maxYear}`;
    
    // Check if slider has data attributes for dual-handle configuration
    const hasMinMax = slider.hasAttribute('data-min') && slider.hasAttribute('data-max');
    
    if (hasMinMax) {
      // Dual-handle slider (custom implementation or library)
      const minValue = parseInt(slider.getAttribute('data-min'));
      const maxValue = parseInt(slider.getAttribute('data-max'));
      
      // Update label and filter state on change
      slider.addEventListener('change', (event) => {
        const min = parseInt(slider.getAttribute('data-min'));
        const max = parseInt(slider.getAttribute('data-max'));
        
        this.setYearRange(min, max);
        label.textContent = `${min} - ${max}`;
      });
      
      console.log(`✓ Year range slider initialized (dual-handle: ${minValue}-${maxValue})`);
    } else {
      // Single slider - user selects minimum year, maximum is always 2019
      slider.min = 2000;
      slider.max = 2019;
      slider.value = 2000;
      
      slider.addEventListener('input', (event) => {
        const min = parseInt(event.target.value);
        const max = 2019;
        
        this.setYearRange(min, max);
        label.textContent = `${min} - ${max}`;
      });
      
      console.log(`✓ Year slider initialized (single handle: 2000-2019)`);
    }
  }
  
  /**
   * Initialize dual-handle range slider using noUiSlider library
   * This method provides advanced range slider functionality with two handles
   * 
   * @param {string} sliderId - ID of the slider element (without '#')
   * @param {string} labelId - ID of the label element (without '#')
   * 
   * @example
   * // HTML: <div id="year-slider"></div><span id="year-range-label"></span>
   * // Make sure noUiSlider is included in your HTML:
   * // <link href="https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.css" rel="stylesheet">
   * // <script src="https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.js"></script>
   * 
   * filterManager.initYearRangeSlider('year-slider', 'year-range-label');
   * 
   * @note
   * - Requires noUiSlider library to be included in the page
   * - Provides smoother UX with dual handles for min and max year selection
   * - Updates are debounced to prevent excessive re-renders
   */
  initYearRangeSlider(sliderId, labelId) {
    const sliderElement = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    
    if (!sliderElement) {
      console.error(`FilterManager.initYearRangeSlider: Element with id "${sliderId}" not found`);
      return;
    }
    
    if (!label) {
      console.error(`FilterManager.initYearRangeSlider: Element with id "${labelId}" not found`);
      return;
    }
    
    // Check if noUiSlider is available
    if (typeof noUiSlider === 'undefined') {
      console.error('FilterManager.initYearRangeSlider: noUiSlider library not found. Please include noUiSlider in your HTML.');
      console.log('Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.js"></script>');
      return;
    }
    
    // Create the range slider
    noUiSlider.create(sliderElement, {
      start: this.state.yearRange,
      connect: true,
      step: 1,
      range: {
        'min': 2000,
        'max': 2019
      },
      tooltips: [true, true],
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value)
      }
    });
    
    // Update label on slider change
    sliderElement.noUiSlider.on('update', (values) => {
      const [min, max] = values.map(v => Math.round(v));
      label.textContent = `${min} - ${max}`;
    });
    
    // Debounce filter updates to prevent excessive re-renders
    let updateTimeout;
    sliderElement.noUiSlider.on('change', (values) => {
      clearTimeout(updateTimeout);
      
      updateTimeout = setTimeout(() => {
        const [min, max] = values.map(v => Math.round(v));
        this.setYearRange(min, max);
      }, 100); // 100ms debounce
    });
    
    console.log('✓ Year range slider initialized with noUiSlider (2000-2019)');
  }
}

/**
 * Export FilterManager class for use in main application
 */
export { FilterManager };
