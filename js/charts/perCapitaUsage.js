/**
 * Chart 10: Per Capita Energy Usage
 * 
 * Displays the top 15 countries by per capita energy usage as a horizontal bar chart.
 * Responds to global filter system (year range).
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 * 
 * Features:
 * - Horizontal bar chart showing top 15 countries
 * - Averages energy_per_capita across selected year range
 * - Countries sorted in descending order by per capita usage
 * - Filters out null values
 * - Axis labels with units "(kWh per capita)"
 * - Tooltip with country and per capita value
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for horizontal bar chart visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<Object>} Array of top 15 countries with their per capita usage
 */
function prepareData(rawData, filterState) {
  // Apply year range filter
  const inRange = filterByYearRange(rawData, ...filterState.yearRange);
  
  // Group by country and calculate average energy_per_capita
  const byCountry = d3.rollup(
    inRange,
    v => {
      const values = v.map(d => d.energy_per_capita).filter(val => val != null && val > 0);
      return values.length > 0 ? d3.mean(values) : null;
    },
    d => d.country
  );
  
  // Convert to array and filter out null values
  const countriesWithData = Array.from(byCountry, ([country, avgPerCapita]) => ({
    country,
    value: avgPerCapita
  })).filter(d => d.value != null && d.value > 0);
  
  // Sort in descending order and take top 15
  return countriesWithData
    .sort((a, b) => b.value - a.value)
    .slice(0, CONFIG.data.topNPerCapita);
}

/**
 * Render the Per Capita Energy Usage chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderPerCapitaUsage(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Per Capita Usage chart');
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
    .text('Per Capita Energy Usage');
  
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
    .text('Energy Per Capita (kWh per capita)');
  
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
        .text('No per capita data available for the selected filters');
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
      .attr('fill', CONFIG.colors.chart2)
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
          <strong>Country:</strong> ${d.country}<br/>
          <strong>Per Capita:</strong> ${formatNumber(d.value, 0)} kWh/capita
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

export default renderPerCapitaUsage;
