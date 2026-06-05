/**
 * Chart 11: Country Comparison
 * 
 * Displays a grouped bar chart comparing 2-5 selected countries across key metrics.
 * Has its own multi-select dropdown independent of global country filter.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 * 
 * Features:
 * - Multi-select dropdown for choosing 2-5 countries (excludes "All Countries")
 * - Grouped bar chart comparing total_energy, emissions, renewable_share
 * - Distinct colors per country from CONFIG
 * - Legend with color swatches
 * - Tooltip with country, metric, and value
 * - Smooth 500ms transitions when selection changes
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange, formatNumber, formatPercent, getUniqueCountries } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for grouped bar chart visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (year range)
 * @param {Array<string>} selectedCountries - Array of selected country names
 * @returns {Array<Object>} Array of metrics with values per country
 */
function prepareData(rawData, filterState, selectedCountries) {
  // Apply year range filter
  const inRange = filterByYearRange(rawData, ...filterState.yearRange);
  
  // Define metrics to compare
  const metrics = [
    { key: 'total_energy', label: 'Total Energy (TWh)', format: v => formatNumber(v, 0) },
    { key: 'greenhouse_gas_emissions', label: 'Emissions (Mt)', format: v => formatNumber(v, 0) },
    { key: 'renewable_share', label: 'Renewable %', format: v => formatPercent(v, 1) }
  ];
  
  // Calculate average values for each country and metric
  return metrics.map(metric => {
    const values = {};
    
    selectedCountries.forEach(country => {
      const countryData = inRange.filter(d => d.country === country);
      
      if (countryData.length > 0) {
        if (metric.key === 'renewable_share') {
          // Calculate renewable share as percentage
          const totalEnergy = d3.mean(countryData, d => d.total_energy);
          const renewables = d3.mean(countryData, d => d.renewables_consumption);
          values[country] = totalEnergy > 0 ? (renewables / totalEnergy) * 100 : 0;
        } else {
          values[country] = d3.mean(countryData, d => d[metric.key]) || 0;
        }
      } else {
        values[country] = 0;
      }
    });
    
    return {
      metric: metric.label,
      key: metric.key,
      format: metric.format,
      values
    };
  });
}

/**
 * Render the Country Comparison chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state (year range only)
 * @returns {Object} Chart instance with update method
 */
export function renderCountryComparison(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Country Comparison chart');
    return null;
  }
  
  // Clear any existing content
  containerElement.innerHTML = '';
  
  // Initialize with default selected countries (top 3)
  let selectedCountries = ['United States', 'China', 'India'];
  
  // Set up dimensions
  const margin = CONFIG.chart.margin;
  const containerWidth = containerElement.clientWidth || 600;
  const containerHeight = Math.max(
    containerWidth / CONFIG.chart.aspectRatio,
    CONFIG.chart.minHeight
  );
  
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom - 50; // Extra space for dropdown
  
  // Create container div
  const containerDiv = d3.select(containerElement);
  
  // Add checkbox controls for country selection
  const controlsDiv = containerDiv.append('div')
    .style('padding', '15px')
    .style('background-color', CONFIG.colors.panel)
    .style('border-bottom', `1px solid ${CONFIG.colors.border}`)
    .style('margin-bottom', '10px');
  
  controlsDiv.append('div')
    .style('color', CONFIG.colors.textMuted)
    .style('font-size', '14px')
    .style('margin-bottom', '10px')
    .style('font-weight', '500')
    .text('Select Countries to Compare (2-5):');
  
  // Create checkbox grid
  const checkboxContainer = controlsDiv.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fill, minmax(180px, 1fr))')
    .style('gap', '8px')
    .style('max-height', '200px')
    .style('overflow-y', 'auto')
    .style('padding', '10px')
    .style('background-color', CONFIG.colors.background)
    .style('border-radius', '4px')
    .style('border', `1px solid ${CONFIG.colors.border}`);
  
  // Populate checkboxes with countries (excluding "All Countries")
  const countries = getUniqueCountries(data).filter(c => c !== 'All Countries');
  
  countries.forEach(country => {
    const label = checkboxContainer.append('label')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px')
      .style('cursor', 'pointer')
      .style('color', CONFIG.colors.text)
      .style('font-size', '13px')
      .style('padding', '4px')
      .style('border-radius', '3px')
      .style('transition', 'background-color 0.2s');
    
    label.on('mouseover', function() {
      d3.select(this).style('background-color', CONFIG.colors.panelHover);
    })
    .on('mouseout', function() {
      d3.select(this).style('background-color', 'transparent');
    });
    
    const checkbox = label.append('input')
      .attr('type', 'checkbox')
      .attr('value', country)
      .property('checked', selectedCountries.includes(country))
      .style('cursor', 'pointer')
      .style('width', '16px')
      .style('height', '16px');
    
    label.append('span').text(country);
    
    checkbox.on('change', function() {
      const checked = this.checked;
      
      if (checked) {
        if (selectedCountries.length < 5) {
          selectedCountries.push(country);
          render(false);
        } else {
          this.checked = false;
          alert('You can select a maximum of 5 countries');
        }
      } else {
        selectedCountries = selectedCountries.filter(c => c !== country);
        if (selectedCountries.length >= 2) {
          render(false);
        } else {
          this.checked = true;
          alert('Please select at least 2 countries');
        }
      }
    });
  });
  
  // Create SVG
  const svg = containerDiv.append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight - 50)
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight - 50}`)
    .style('background-color', 'transparent');
  
  // Create chart group
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add title
  svg.append('text')
    .attr('x', containerWidth / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Country Comparison');
  
  // Create scales
  const x0Scale = d3.scaleBand()
    .range([0, width])
    .padding(0.2);
  
  const x1Scale = d3.scaleBand()
    .padding(0.05);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Country colors
  const colorScale = d3.scaleOrdinal()
    .range([
      CONFIG.colors.chart1,
      CONFIG.colors.chart2,
      CONFIG.colors.chart3,
      CONFIG.colors.chart4,
      CONFIG.colors.chart5
    ]);
  
  // Create axes groups
  const xAxisGroup = chartGroup.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`);
  
  const yAxisGroup = chartGroup.append('g')
    .attr('class', 'y-axis');
  
  // Add axis label
  svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Value');
  
  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${margin.left}, ${height + margin.top + 40})`);
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create bars group
  const barsGroup = chartGroup.append('g')
    .attr('class', 'bars');
  
  /**
   * Render or update the chart with new data
   * @param {boolean} isInitial - Whether this is the initial render
   */
  function render(isInitial = false) {
    // Prepare data
    const chartData = prepareData(data, filterState, selectedCountries);
    
    // Update color scale domain
    colorScale.domain(selectedCountries);
    
    // Update scales
    x0Scale.domain(chartData.map(d => d.metric));
    x1Scale.domain(selectedCountries).range([0, x0Scale.bandwidth()]);
    
    // Find max value across all metrics and countries
    const maxValue = d3.max(chartData, d => 
      d3.max(selectedCountries, country => d.values[country])
    );
    yScale.domain([0, maxValue * 1.1]);
    
    // Update axes
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(x0Scale);
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatNumber(d, 0));
    
    xAxisGroup
      .transition(t)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', CONFIG.colors.textMuted)
      .style('text-anchor', 'middle');
    
    yAxisGroup
      .transition(t)
      .call(yAxis)
      .selectAll('text')
      .attr('fill', CONFIG.colors.textMuted);
    
    // Style axes
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    // Update metric groups
    const metricGroups = barsGroup
      .selectAll('.metric-group')
      .data(chartData, d => d.metric);
    
    metricGroups.exit().remove();
    
    const metricGroupsEnter = metricGroups.enter()
      .append('g')
      .attr('class', 'metric-group');
    
    const allMetricGroups = metricGroupsEnter.merge(metricGroups)
      .attr('transform', d => `translate(${x0Scale(d.metric)},0)`);
    
    // Update bars within each metric group
    allMetricGroups.each(function(metricData) {
      const group = d3.select(this);
      
      const bars = group
        .selectAll('.bar')
        .data(selectedCountries, d => d);
      
      bars.exit()
        .transition(t)
        .attr('height', 0)
        .attr('y', height)
        .remove();
      
      const barsEnter = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', country => x1Scale(country))
        .attr('width', x1Scale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .attr('fill', country => colorScale(country))
        .style('cursor', 'pointer');
      
      barsEnter.merge(bars)
        .on('mouseover', function(event, country) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 0.8);
          
          const value = metricData.values[country];
          const tooltipContent = `
            <strong>Country:</strong> ${country}<br/>
            <strong>Metric:</strong> ${metricData.metric}<br/>
            <strong>Value:</strong> ${metricData.format(value)}
          `;
          tooltip.show(tooltipContent, event);
        })
        .on('mousemove', function(event) {
          tooltip.updatePosition(event);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 1);
          
          tooltip.hide();
        })
        .transition(t)
        .attr('x', country => x1Scale(country))
        .attr('width', x1Scale.bandwidth())
        .attr('y', country => yScale(metricData.values[country]))
        .attr('height', country => height - yScale(metricData.values[country]));
    });
    
    // Update legend
    const legendItems = legend
      .selectAll('.legend-item')
      .data(selectedCountries);
    
    legendItems.exit().remove();
    
    const legendItemsEnter = legendItems.enter()
      .append('g')
      .attr('class', 'legend-item');
    
    legendItemsEnter.append('rect')
      .attr('width', 15)
      .attr('height', 15);
    
    legendItemsEnter.append('text')
      .attr('x', 20)
      .attr('y', 7.5)
      .attr('dy', '0.35em')
      .attr('fill', CONFIG.colors.text)
      .attr('font-size', '12px');
    
    const allLegendItems = legendItemsEnter.merge(legendItems)
      .attr('transform', (d, i) => `translate(${i * 120}, 0)`);
    
    allLegendItems.select('rect')
      .attr('fill', d => colorScale(d));
    
    allLegendItems.select('text')
      .text(d => d.length > 12 ? d.substring(0, 12) + '...' : d);
  }
  
  // Initial render
  render(true);
  
  // Return chart instance with update method
  return {
    /**
     * Update chart with new filter state
     * @param {Array<EnergyRecord>} newData - Updated dataset
     * @param {FilterState} newFilterState - New filter state
     */
    update(newData, newFilterState) {
      data = newData;
      filterState = newFilterState;
      render(false);
    },
    
    /**
     * Remove chart and clean up resources
     */
    destroy() {
      tooltip.remove();
      containerElement.innerHTML = '';
    }
  };
}

export default renderCountryComparison;
