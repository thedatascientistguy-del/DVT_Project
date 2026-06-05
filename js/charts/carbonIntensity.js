/**
 * Chart 15: Carbon Intensity of Electricity
 * 
 * Displays carbon intensity of electricity generation over time with dynamic gradient coloring.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 * 
 * Features:
 * - Line chart showing carbon_intensity_elec metric over time
 * - Weighted average for "All Countries" option (weighted by electricity_generation)
 * - Dynamic gradient coloring: red for high intensity, green for low intensity
 * - Axis label with units "(gCO₂/kWh)"
 * - Supports both single country and "All Countries" aggregation
 * - Smooth 500ms transitions when filters change
 * - Interactive tooltip on hover with year, intensity, and units
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange, calculateWeightedAverage } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for visualization based on current filter state
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<{year: number, value: number}>} Carbon intensity data points
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  if (filterState.country === 'All Countries') {
    // Calculate weighted average by electricity generation for each year
    const byYear = d3.rollup(
      inRange,
      v => {
        const totalGen = d3.sum(v, d => d.electricity_generation || 0);
        const weightedIntensity = d3.sum(v, d => 
          (d.carbon_intensity_elec || 0) * (d.electricity_generation || 0)
        );
        return totalGen > 0 ? weightedIntensity / totalGen : null;
      },
      d => d.year
    );
    
    return Array.from(byYear, ([year, value]) => ({ year, value }))
      .filter(d => d.value != null && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);
  } else {
    // Extract time series for single country
    return inRange
      .map(d => ({ 
        year: d.year, 
        value: d.carbon_intensity_elec 
      }))
      .filter(d => d.value != null && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);
  }
}

/**
 * Render the Carbon Intensity of Electricity chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update and destroy methods
 */
export default function renderCarbonIntensity(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Carbon Intensity chart');
    return null;
  }
  
  // Clear any existing content
  containerElement.innerHTML = '';
  
  // Set up dimensions
  const margin = CONFIG.chart.margin;
  const containerWidth = containerElement.clientWidth || 600;
  const containerHeight = Math.max(
    containerWidth / CONFIG.chart.aspectRatio,
    CONFIG.chart.minHeight
  );
  
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(containerElement)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
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
    .text('Carbon Intensity of Electricity');
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Create defs for gradient (will be updated with data)
  const defs = svg.append('defs');
  
  // Create line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  // Create axes groups
  const xAxisGroup = chartGroup.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`);
  
  const yAxisGroup = chartGroup.append('g')
    .attr('class', 'y-axis');
  
  // Add axis labels
  svg.append('text')
    .attr('class', 'x-axis-label')
    .attr('x', margin.left + width / 2)
    .attr('y', containerHeight - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Year');
  
  svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Carbon Intensity (gCO₂/kWh)');
  
  // Create path for line
  const linePath = chartGroup.append('path')
    .attr('class', 'line-path')
    .attr('fill', 'none')
    .attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round');
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create interactive circles for hover
  const hoverCircles = chartGroup.append('g')
    .attr('class', 'hover-circles');
  
  /**
   * Create or update gradient based on data values
   * @param {Array} chartData - The chart data
   * @param {string} gradientId - ID for the gradient
   */
  function updateGradient(chartData, gradientId) {
    // Remove existing gradient
    defs.selectAll(`#${gradientId}`).remove();
    
    if (!chartData || chartData.length === 0) return;
    
    // Get min and max values for gradient mapping
    const minValue = d3.min(chartData, d => d.value);
    const maxValue = d3.max(chartData, d => d.value);
    
    // Create linear gradient from high (red) to low (green)
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', yScale(maxValue))
      .attr('x2', 0)
      .attr('y2', yScale(minValue));
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CONFIG.colors.intensityHigh) // Red for high intensity
      .attr('stop-opacity', 1);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CONFIG.colors.intensityLow) // Green for low intensity
      .attr('stop-opacity', 1);
  }
  
  /**
   * Render or update the chart with new data
   * @param {boolean} isInitial - Whether this is the initial render
   */
  function render(isInitial = false) {
    // Prepare data
    const chartData = prepareData(data, filterState);
    
    // Check if we have valid data
    if (!chartData || chartData.length === 0) {
      chartGroup.selectAll('.no-data-message').remove();
      chartGroup.append('text')
        .attr('class', 'no-data-message')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available for the selected filters');
      
      // Hide chart elements
      linePath.attr('d', null);
      hoverCircles.selectAll('*').remove();
      return;
    }
    
    // Remove no-data message if present
    chartGroup.selectAll('.no-data-message').remove();
    
    // Update scales
    xScale.domain(d3.extent(chartData, d => d.year));
    yScale.domain([0, d3.max(chartData, d => d.value) * 1.1]); // 10% padding at top
    
    // Update gradient with new scale
    const gradientId = 'intensity-line-gradient';
    updateGradient(chartData, gradientId);
    
    // Apply gradient to line
    linePath.attr('stroke', `url(#${gradientId})`);
    
    // Update transition
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => d.toFixed(0));
    
    // Update axes with transition
    xAxisGroup
      .transition(t)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup
      .transition(t)
      .call(yAxis)
      .selectAll('text')
      .attr('fill', CONFIG.colors.textMuted);
    
    // Style axis lines and ticks
    xAxisGroup.selectAll('line, path')
      .attr('stroke', CONFIG.colors.border);
    
    yAxisGroup.selectAll('line, path')
      .attr('stroke', CONFIG.colors.border);
    
    // Update line path
    if (isInitial) {
      // Initial animation: draw line from left to right
      linePath
        .attr('d', lineGenerator(chartData))
        .attr('stroke-dasharray', function() {
          const length = this.getTotalLength();
          return `${length} ${length}`;
        })
        .attr('stroke-dashoffset', function() {
          return this.getTotalLength();
        })
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .attr('stroke-dashoffset', 0);
    } else {
      // Update animation: morph to new data
      linePath
        .transition(t)
        .attr('d', lineGenerator(chartData));
    }
    
    // Create color scale for circle fill based on intensity value
    const colorScale = d3.scaleLinear()
      .domain([d3.min(chartData, d => d.value), d3.max(chartData, d => d.value)])
      .range([CONFIG.colors.intensityLow, CONFIG.colors.intensityHigh]);
    
    // Update hover circles
    const circles = hoverCircles
      .selectAll('circle')
      .data(chartData, d => d.year);
    
    // Remove old circles
    circles.exit()
      .transition(t)
      .attr('r', 0)
      .remove();
    
    // Add new circles
    const circlesEnter = circles.enter()
      .append('circle')
      .attr('r', 0)
      .attr('stroke', CONFIG.colors.background)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0);
    
    // Update all circles
    circlesEnter.merge(circles)
      .on('mouseover', function(event, d) {
        // Highlight circle
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 6)
          .style('opacity', 1);
        
        // Show tooltip
        const tooltipContent = `
          <strong>Year:</strong> ${d.year}<br/>
          <strong>Carbon Intensity:</strong> ${d.value.toFixed(1)} gCO₂/kWh
        `;
        tooltip.show(tooltipContent, event);
      })
      .on('mousemove', function(event) {
        tooltip.updatePosition(event);
      })
      .on('mouseout', function() {
        // Hide circle
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 4)
          .style('opacity', 0);
        
        // Hide tooltip
        tooltip.hide();
      })
      .transition(t)
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', d => colorScale(d.value));
  }
  
  // Initial render
  render(true);
  
  // Return chart instance with update and destroy methods
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
