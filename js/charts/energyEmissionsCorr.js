/**
 * Chart 13: Energy Consumption vs Emissions Correlation
 * 
 * Displays scatter plot showing relationship between energy and emissions.
 * Circles colored by carbon intensity of electricity.
 * Responds to global filter system (year range).
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 * 
 * Features:
 * - Scatter plot with energy on x-axis, emissions on y-axis
 * - Color gradient for carbon_intensity_elec (scaleSequential)
 * - Uses interpolateRdYlGn (reversed) - red high, green low
 * - Color legend showing intensity gradient
 * - Tooltip with country, energy, emissions, intensity
 * - Position and color transition animations
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for scatter plot visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (year range)
 * @returns {Array<Object>} Array of countries with averaged metrics
 */
function prepareData(rawData, filterState) {
  // Apply year range filter
  const inRange = filterByYearRange(rawData, ...filterState.yearRange);
  
  // Group by country and calculate averages
  const byCountry = d3.rollup(
    inRange,
    v => ({
      energy: d3.mean(v, d => d.total_energy),
      emissions: d3.mean(v, d => d.greenhouse_gas_emissions),
      intensity: d3.mean(v, d => d.carbon_intensity_elec)
    }),
    d => d.country
  );
  
  // Convert to array and filter out countries with missing data
  return Array.from(byCountry, ([country, values]) => ({
    country,
    energy: values.energy,
    emissions: values.emissions,
    intensity: values.intensity
  })).filter(d => d.energy > 0 && d.emissions > 0 && d.intensity > 0);
}

/**
 * Render the Energy vs Emissions Correlation chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderEnergyEmissionsCorr(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Energy-Emissions Correlation chart');
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
    .text('Energy Consumption vs Emissions');
  
  // Create scales
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  const colorScale = d3.scaleSequential()
    .interpolator(t => d3.interpolateRdYlGn(1 - t)); // Reverse: red = high, green = low
  
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
  
  svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Greenhouse Gas Emissions (Million Tonnes)');
  
  // Create color legend
  const legendWidth = 20;
  const legendHeight = 150;
  const legendGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${containerWidth - margin.right - legendWidth - 30}, ${margin.top + 20})`);
  
  // Legend gradient
  const legendGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  
  const numStops = 10;
  for (let i = 0; i <= numStops; i++) {
    legendGradient.append('stop')
      .attr('offset', `${(i / numStops) * 100}%`)
      .attr('stop-color', d3.interpolateRdYlGn(1 - i / numStops));
  }
  
  legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)')
    .attr('stroke', CONFIG.colors.border);
  
  legendGroup.append('text')
    .attr('x', legendWidth + 5)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '11px')
    .text('High');
  
  legendGroup.append('text')
    .attr('x', legendWidth + 5)
    .attr('y', legendHeight)
    .attr('dy', '0.35em')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '11px')
    .text('Low');
  
  legendGroup.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '10px')
    .text('Carbon Intensity');
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create circles group
  const circlesGroup = chartGroup.append('g')
    .attr('class', 'circles');
  
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
    xScale.domain([0, d3.max(chartData, d => d.energy) * 1.1]);
    yScale.domain([0, d3.max(chartData, d => d.emissions) * 1.1]);
    colorScale.domain([
      d3.min(chartData, d => d.intensity),
      d3.max(chartData, d => d.intensity)
    ]);
    
    // Update axes
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => formatNumber(d, 0));
    
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
    
    // Style axes
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    // Update circles
    const circles = circlesGroup
      .selectAll('circle')
      .data(chartData, d => d.country);
    
    // Remove old circles
    circles.exit()
      .transition(t)
      .attr('r', 0)
      .attr('opacity', 0)
      .remove();
    
    // Add new circles
    const circlesEnter = circles.enter()
      .append('circle')
      .attr('cx', d => xScale(d.energy))
      .attr('cy', d => yScale(d.emissions))
      .attr('r', 0)
      .attr('stroke', CONFIG.colors.background)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .style('cursor', 'pointer');
    
    // Update all circles
    const allCircles = circlesEnter.merge(circles);
    
    allCircles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 10)
          .attr('opacity', 1)
          .attr('stroke-width', 2.5);
        
        const tooltipContent = `
          <strong>Country:</strong> ${d.country}<br/>
          <strong>Energy:</strong> ${formatNumber(d.energy)} TWh<br/>
          <strong>Emissions:</strong> ${formatNumber(d.emissions)} Mt<br/>
          <strong>Carbon Intensity:</strong> ${formatNumber(d.intensity, 0)} gCO₂/kWh
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
          .attr('r', 6)
          .attr('opacity', 0.8)
          .attr('stroke-width', 1.5);
        
        tooltip.hide();
      });
    
    if (isInitial) {
      // Initial animation: fade in and grow with color
      allCircles
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .delay((d, i) => i * 10)
        .attr('r', 6)
        .attr('fill', d => colorScale(d.intensity))
        .attr('opacity', 0.8);
    } else {
      // Update animation: move and change color
      allCircles
        .transition(t)
        .attr('cx', d => xScale(d.energy))
        .attr('cy', d => yScale(d.emissions))
        .attr('r', 6)
        .attr('fill', d => colorScale(d.intensity))
        .attr('opacity', 0.8);
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

export default renderEnergyEmissionsCorr;
