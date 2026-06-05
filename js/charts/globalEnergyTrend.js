/**
 * Chart 1: Global Energy Consumption Trend
 * 
 * Displays total energy consumption over time as a line chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * Features:
 * - Line chart showing total_energy metric over time
 * - Supports both single country and "All Countries" aggregation
 * - Smooth 500ms transitions when filters change
 * - Interactive tooltip on hover
 * - Responsive sizing with configured margins
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for visualization based on current filter state
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<{year: number, value: number}>} Time series data points
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Aggregate or map data based on country selection
  if (filterState.country === 'All Countries') {
    // Aggregate across all countries by year
    return aggregateByYear(inRange, 'total_energy');
  } else {
    // Extract time series for single country
    return inRange
      .map(d => ({ year: d.year, value: d.total_energy || 0 }))
      .sort((a, b) => a.year - b.year);
  }
}

/**
 * Render the Global Energy Consumption Trend chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderGlobalEnergyTrend(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Global Energy Trend chart');
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
  
  // Remove the duplicate title (it's already in the HTML)
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Create line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX); // Smooth curve
  
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
    .text('Total Energy Consumption (TWh)');
  
  // Create path for line
  const linePath = chartGroup.append('path')
    .attr('class', 'line-path')
    .attr('fill', 'none')
    .attr('stroke', CONFIG.colors.renewables)
    .attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round');
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create invisible circles for better hover interaction
  const hoverCircles = chartGroup.append('g')
    .attr('class', 'hover-circles');
  
  /**
   * Render or update the chart with new data
   * @param {boolean} isInitial - Whether this is the initial render
   */
  function render(isInitial = false) {
    // Prepare data
    const chartData = prepareData(data, filterState);
    
    // Check if we have valid data
    if (!chartData || chartData.length === 0) {
      chartGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available for the selected filters');
      return;
    }
    
    // Update scales
    xScale.domain(d3.extent(chartData, d => d.year));
    yScale.domain([0, d3.max(chartData, d => d.value) * 1.1]); // 10% padding at top
    
    // Update axes with transition
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatNumber(d, 0));
    
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
      .attr('fill', CONFIG.colors.renewables)
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
          <strong>Total Energy:</strong> ${formatNumber(d.value)} TWh
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
      .attr('r', 4);
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

export default renderGlobalEnergyTrend;
