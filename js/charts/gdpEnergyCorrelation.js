/**
 * Chart 12: GDP vs Energy Consumption Correlation
 * 
 * Displays scatter plot showing relationship between GDP and energy consumption.
 * Responds to global filter system (year range).
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 * 
 * Features:
 * - Scatter plot with log scale for GDP (x-axis)
 * - Averages metrics across year range per country
 * - Circles sized by population using scaleSqrt()
 * - Regression trend line showing correlation
 * - Tooltip with country, GDP, energy, population
 * - Circle fade-in and grow animation
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByYearRange, formatNumber, calculateLinearRegression } from '../utils.js';
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
      gdp: d3.mean(v, d => d.gdp),
      energy: d3.mean(v, d => d.total_energy),
      population: d3.mean(v, d => d.population)
    }),
    d => d.country
  );
  
  // Convert to array and filter out countries with missing data
  return Array.from(byCountry, ([country, values]) => ({
    country,
    gdp: values.gdp,
    energy: values.energy,
    population: values.population
  })).filter(d => d.gdp > 0 && d.energy > 0 && d.population > 0);
}

/**
 * Render the GDP vs Energy Correlation chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderGdpEnergyCorrelation(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for GDP-Energy Correlation chart');
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
    .text('GDP vs Energy Consumption');
  
  // Create scales
  const xScale = d3.scaleLog()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  const radiusScale = d3.scaleSqrt()
    .range([3, 20]);
  
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
    .text('GDP (USD, log scale)');
  
  svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Total Energy Consumption (TWh)');
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create circles group
  const circlesGroup = chartGroup.append('g')
    .attr('class', 'circles');
  
  // Create regression line group
  const regressionGroup = chartGroup.append('g')
    .attr('class', 'regression');
  
  const regressionLine = regressionGroup.append('line')
    .attr('stroke', CONFIG.colors.chart3)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')
    .attr('opacity', 0.6);
  
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
    xScale.domain([
      d3.min(chartData, d => d.gdp) * 0.8,
      d3.max(chartData, d => d.gdp) * 1.2
    ]);
    
    yScale.domain([0, d3.max(chartData, d => d.energy) * 1.1]);
    
    radiusScale.domain([
      d3.min(chartData, d => d.population),
      d3.max(chartData, d => d.population)
    ]);
    
    // Calculate regression line
    const regression = calculateLinearRegression(
      chartData.map(d => Math.log10(d.gdp)),
      chartData.map(d => d.energy)
    );
    
    // Update axes
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
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
    
    // Update regression line
    if (regression) {
      const x1 = d3.min(chartData, d => d.gdp);
      const x2 = d3.max(chartData, d => d.gdp);
      const y1 = regression.slope * Math.log10(x1) + regression.intercept;
      const y2 = regression.slope * Math.log10(x2) + regression.intercept;
      
      regressionLine
        .transition(t)
        .attr('x1', xScale(x1))
        .attr('y1', yScale(y1))
        .attr('x2', xScale(x2))
        .attr('y2', yScale(y2));
    }
    
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
      .attr('cx', d => xScale(d.gdp))
      .attr('cy', d => yScale(d.energy))
      .attr('r', 0)
      .attr('fill', CONFIG.colors.chart1)
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
          .attr('opacity', 1)
          .attr('stroke-width', 2.5);
        
        const tooltipContent = `
          <strong>Country:</strong> ${d.country}<br/>
          <strong>GDP:</strong> ${formatNumber(d.gdp)} USD<br/>
          <strong>Energy:</strong> ${formatNumber(d.energy)} TWh<br/>
          <strong>Population:</strong> ${formatNumber(d.population, 0)}
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
          .attr('opacity', 0.7)
          .attr('stroke-width', 1.5);
        
        tooltip.hide();
      });
    
    if (isInitial) {
      // Initial animation: fade in and grow
      allCircles
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .delay((d, i) => i * 10)
        .attr('r', d => radiusScale(d.population))
        .attr('opacity', 0.7);
    } else {
      // Update animation
      allCircles
        .transition(t)
        .attr('cx', d => xScale(d.gdp))
        .attr('cy', d => yScale(d.energy))
        .attr('r', d => radiusScale(d.population))
        .attr('opacity', 0.7);
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

export default renderGdpEnergyCorrelation;
