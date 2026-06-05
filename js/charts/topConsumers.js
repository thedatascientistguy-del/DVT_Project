/**
 * Chart 9: Top Energy Consumers by Year
 * 
 * Displays the top 10 energy-consuming countries as a horizontal bar chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 * 
 * Features:
 * - Horizontal bar chart showing top 10 countries
 * - Uses most recent year from selected range
 * - Countries sorted in descending order by consumption
 * - Tooltip with country, rank, and consumption value
 * - Bar grow animation with stagger (30ms per bar)
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByYearRange, formatNumber, getTopN } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for horizontal bar chart visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<Object>} Array of top 10 countries with their consumption
 */
function prepareData(rawData, filterState) {
  // Apply year range filter
  const inRange = filterByYearRange(rawData, ...filterState.yearRange);
  
  // Get the most recent year in the range
  const mostRecentYear = Math.max(...inRange.map(d => d.year));
  
  // Filter to most recent year
  const mostRecentData = inRange.filter(d => d.year === mostRecentYear);
  
  // Get top 10 consumers
  const topCountries = getTopN(mostRecentData, 'total_energy', CONFIG.data.topN);
  
  // Add rank to each country
  return topCountries.map((d, i) => ({
    country: d.country,
    value: d.total_energy,
    rank: i + 1,
    year: mostRecentYear
  }));
}

/**
 * Render the Top Energy Consumers chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderTopConsumers(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Top Consumers chart');
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
    .text('Top 10 Energy Consumers');
  
  // Create scales (will be updated in render function)
  const yScale = d3.scaleBand()
    .range([0, height])
    .padding(0.2);
  
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
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
    .text('Total Energy Consumption (TWh)');
  
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
    yScale.domain(chartData.map(d => d.country));
    xScale.domain([0, d3.max(chartData, d => d.value) * 1.1]); // 10% padding
    
    // Update axes with transition
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => formatNumber(d, 0));
    
    const yAxis = d3.axisLeft(yScale);
    
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
    
    // Update bars
    const bars = barsGroup
      .selectAll('.bar')
      .data(chartData, d => d.country);
    
    // Remove old bars
    bars.exit()
      .transition(t)
      .attr('width', 0)
      .remove();
    
    // Add new bars
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.country))
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('fill', CONFIG.colors.chart1)
      .style('cursor', 'pointer');
    
    // Update all bars
    const allBars = barsEnter.merge(bars);
    
    allBars
      .on('mouseover', function(event, d) {
        // Highlight bar
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8);
        
        // Show tooltip
        const tooltipContent = `
          <strong>Rank:</strong> #${d.rank}<br/>
          <strong>Country:</strong> ${d.country}<br/>
          <strong>Consumption:</strong> ${formatNumber(d.value)} TWh<br/>
          <strong>Year:</strong> ${d.year}
        `;
        tooltip.show(tooltipContent, event);
      })
      .on('mousemove', function(event) {
        tooltip.updatePosition(event);
      })
      .on('mouseout', function() {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 1);
        
        tooltip.hide();
      });
    
    if (isInitial) {
      // Initial animation: bars grow with stagger
      allBars
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .delay((d, i) => i * CONFIG.animation.staggerDelay)
        .attr('y', d => yScale(d.country))
        .attr('height', yScale.bandwidth())
        .attr('width', d => xScale(d.value));
    } else {
      // Update animation
      allBars
        .transition(t)
        .attr('y', d => yScale(d.country))
        .attr('height', yScale.bandwidth())
        .attr('width', d => xScale(d.value));
    }
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

export default renderTopConsumers;
