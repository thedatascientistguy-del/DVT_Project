/**
 * Chart 14: Renewable Energy Growth Rate
 * 
 * Displays year-over-year percentage growth rate of renewable energy consumption.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 * 
 * Features:
 * - Line chart showing growth rate of renewables_consumption
 * - Zero reference line (dashed gray) to distinguish positive/negative growth
 * - Conditional coloring: green for positive growth, red for negative
 * - Supports both single country and "All Countries" aggregation
 * - Smooth 500ms transitions when filters change
 * - Interactive tooltip on hover
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, calculateGrowthRate, formatPercent } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for visualization based on current filter state
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<{year: number, growthRate: number}>} Growth rate data points
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Get aggregated time series data first
  let timeSeriesData;
  if (filterState.country === 'All Countries') {
    // Aggregate across all countries by year
    // aggregateByYear returns [{year, value}, ...] format
    timeSeriesData = aggregateByYear(inRange, 'renewables_consumption');
    // Convert to format expected by calculateGrowthRate
    timeSeriesData = timeSeriesData.map(d => ({
      year: d.year,
      renewables_consumption: d.value
    }));
  } else {
    // Extract time series for single country
    timeSeriesData = inRange
      .map(d => ({ year: d.year, renewables_consumption: d.renewables_consumption || 0 }))
      .sort((a, b) => a.year - b.year);
  }
  
  // Calculate year-over-year growth rate
  return calculateGrowthRate(timeSeriesData, 'renewables_consumption');
}

/**
 * Render the Renewable Energy Growth Rate chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update and destroy methods
 */
export default function renderRenewableGrowth(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Renewable Growth chart');
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
    .text('Renewable Energy Growth Rate');
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Create line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.growthRate))
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
    .text('Growth Rate (%)');
  
  // Create zero reference line (will be positioned in render function)
  const zeroLine = chartGroup.append('line')
    .attr('class', 'zero-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('stroke', CONFIG.colors.textMuted)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.5);
  
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
  
  // Create interactive circles for hover
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
    
    // Get extent with some padding for better visualization
    const yExtent = d3.extent(chartData, d => d.growthRate);
    const yPadding = Math.abs(yExtent[1] - yExtent[0]) * 0.1 || 10; // 10% padding or minimum 10
    yScale.domain([
      Math.min(0, yExtent[0] - yPadding), // Ensure zero is included
      Math.max(0, yExtent[1] + yPadding)
    ]);
    
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
      .tickFormat(d => formatPercent(d, 1));
    
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
    
    // Update zero reference line position
    zeroLine
      .transition(t)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0));
    
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
    
    // Update hover circles with conditional coloring
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
          <strong>Growth Rate:</strong> ${formatPercent(d.growthRate, 1)}
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
      .attr('cy', d => yScale(d.growthRate))
      .attr('r', 4)
      .attr('fill', d => d.growthRate >= 0 ? CONFIG.colors.renewables : CONFIG.colors.emissions);
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
