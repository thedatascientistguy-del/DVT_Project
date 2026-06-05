/**
 * Chart 4: Fossil vs Renewable vs Nuclear Energy Mix
 * 
 * Displays energy composition over time as a stacked area chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * Features:
 * - Stacked area chart showing fossil, renewables, and nuclear energy
 * - Color mapping (gray fossil, green renewables, purple nuclear)
 * - Tooltip showing energy type and total at year
 * - Stagger animation (100ms delay per layer)
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for stacked area visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<Object>} Array of objects with year and energy values
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Group by year and sum values
  const byYear = d3.rollup(
    inRange,
    v => ({
      fossil: d3.sum(v, d => d.fossil_fuel_consumption || 0),
      renewables: d3.sum(v, d => d.renewables_consumption || 0),
      nuclear: d3.sum(v, d => d.nuclear_consumption || 0)
    }),
    d => d.year
  );
  
  // Convert to array and sort by year
  return Array.from(byYear, ([year, values]) => ({
    year,
    fossil: values.fossil,
    renewables: values.renewables,
    nuclear: values.nuclear
  })).sort((a, b) => a.year - b.year);
}

/**
 * Render the Energy Mix Stacked Area chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderEnergyMixStacked(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Energy Mix Stacked chart');
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
    .text('Energy Mix: Fossil vs Renewable vs Nuclear');
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Define stack keys
  const keys = ['fossil', 'renewables', 'nuclear'];
  
  // Create stack generator
  const stackGenerator = d3.stack()
    .keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  // Create area generator
  const areaGenerator = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
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
    .text('Energy Consumption (TWh)');
  
  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${containerWidth - margin.right - 200}, ${margin.top - 10})`);
  
  const legendData = [
    { key: 'fossil', label: 'Fossil', color: CONFIG.colors.coal },
    { key: 'renewables', label: 'Renewables', color: CONFIG.colors.renewables },
    { key: 'nuclear', label: 'Nuclear', color: CONFIG.colors.nuclear }
  ];
  
  legendData.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(${i * 70}, 0)`);
    
    legendItem.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', item.color);
    
    legendItem.append('text')
      .attr('x', 20)
      .attr('y', 7.5)
      .attr('dy', '0.35em')
      .attr('fill', CONFIG.colors.text)
      .attr('font-size', '11px')
      .text(item.label);
  });
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create layers group
  const layersGroup = chartGroup.append('g')
    .attr('class', 'layers');
  
  /**
   * Get color for energy type
   */
  function getColor(key) {
    const colorMap = {
      'fossil': CONFIG.colors.coal,
      'renewables': CONFIG.colors.renewables,
      'nuclear': CONFIG.colors.nuclear
    };
    return colorMap[key] || CONFIG.colors.coal;
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
      chartGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available for the selected filters');
      return;
    }
    
    // Generate stack data
    const stackData = stackGenerator(chartData);
    
    // Update scales
    xScale.domain(d3.extent(chartData, d => d.year));
    yScale.domain([0, d3.max(stackData[stackData.length - 1], d => d[1]) * 1.1]);
    
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
    
    // Update layers
    const layers = layersGroup
      .selectAll('.layer')
      .data(stackData, d => d.key);
    
    // Remove old layers
    layers.exit()
      .transition(t)
      .attr('opacity', 0)
      .remove();
    
    // Add new layers
    const layersEnter = layers.enter()
      .append('g')
      .attr('class', 'layer');
    
    layersEnter.append('path')
      .attr('class', 'area')
      .attr('fill', d => getColor(d.key))
      .attr('opacity', 0.8);
    
    // Update all layers
    const allLayers = layersEnter.merge(layers);
    
    allLayers.select('.area')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 1);
        
        // Find the year nearest to mouse position
        const [mouseX] = d3.pointer(event, chartGroup.node());
        const year = Math.round(xScale.invert(mouseX));
        const dataPoint = d.find(pt => pt.data.year === year);
        
        if (dataPoint) {
          const value = dataPoint[1] - dataPoint[0];
          const total = dataPoint[1];
          const tooltipContent = `
            <strong>Year:</strong> ${year}<br/>
            <strong>Type:</strong> ${d.key.charAt(0).toUpperCase() + d.key.slice(1)}<br/>
            <strong>Value:</strong> ${formatNumber(value)} TWh<br/>
            <strong>Total:</strong> ${formatNumber(total)} TWh
          `;
          tooltip.show(tooltipContent, event);
        }
      })
      .on('mousemove', function(event) {
        tooltip.updatePosition(event);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8);
        
        tooltip.hide();
      });
    
    if (isInitial) {
      // Stagger animation: each layer animates with delay
      allLayers.select('.area')
        .attr('d', areaGenerator)
        .attr('opacity', 0)
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .delay((d, i) => i * CONFIG.animation.staggerDelay)
        .attr('opacity', 0.8);
    } else {
      // Update animation: morph to new data
      allLayers.select('.area')
        .transition(t)
        .attr('d', areaGenerator);
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

export default renderEnergyMixStacked;
