/**
 * Chart 5: Electricity Source Composition
 * 
 * Displays electricity generation by source as a stacked bar chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 * 
 * Features:
 * - Stacked bar chart showing electricity generation by source
 * - Samples 5-year intervals within selected year range
 * - Normalizes bars to show relative proportions (percentages)
 * - Color mapping for each energy source
 * - Tooltip showing source and percentage
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG, getSourceColor } from '../config.js';
import { filterByCountry, filterByYearRange, formatPercent } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for stacked bar visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<Object>} Array of objects with year and energy source values
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Get unique years and filter to 5-year intervals
  const years = Array.from(new Set(inRange.map(d => d.year)))
    .sort((a, b) => a - b)
    .filter(y => y % 5 === 0); // Only include years divisible by 5
  
  // If no 5-year intervals, use all available years (max 5)
  const sampledYears = years.length > 0 ? years : 
    Array.from(new Set(inRange.map(d => d.year)))
      .sort((a, b) => a - b)
      .slice(0, 5);
  
  // Aggregate data for sampled years
  return sampledYears.map(year => {
    const yearData = inRange.filter(d => d.year === year);
    
    const coal = d3.sum(yearData, d => d.coal_consumption || 0);
    const oil = d3.sum(yearData, d => d.oil_consumption || 0);
    const gas = d3.sum(yearData, d => d.gas_consumption || 0);
    const renewables = d3.sum(yearData, d => d.renewables_consumption || 0);
    const nuclear = d3.sum(yearData, d => d.nuclear_consumption || 0);
    
    const total = coal + oil + gas + renewables + nuclear;
    
    // Calculate percentages
    return {
      year,
      coal: total > 0 ? (coal / total) * 100 : 0,
      oil: total > 0 ? (oil / total) * 100 : 0,
      gas: total > 0 ? (gas / total) * 100 : 0,
      renewables: total > 0 ? (renewables / total) * 100 : 0,
      nuclear: total > 0 ? (nuclear / total) * 100 : 0,
      total
    };
  });
}

/**
 * Render the Electricity Source Composition chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderElectricitySource(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Electricity Source chart');
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
    .text('Electricity Generation by Source');
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleBand()
    .range([0, width])
    .padding(0.3);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100]) // Always 0-100% for normalized data
    .range([height, 0]);
  
  // Define stack keys
  const keys = ['coal', 'oil', 'gas', 'renewables', 'nuclear'];
  
  // Create stack generator
  const stackGenerator = d3.stack()
    .keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
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
    .text('Percentage (%)');
  
  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${margin.left}, ${containerHeight - margin.bottom + 40})`);
  
  const legendData = [
    { key: 'coal', label: 'Coal', color: CONFIG.colors.coal },
    { key: 'oil', label: 'Oil', color: CONFIG.colors.oil },
    { key: 'gas', label: 'Gas', color: CONFIG.colors.gas },
    { key: 'renewables', label: 'Renewables', color: CONFIG.colors.renewables },
    { key: 'nuclear', label: 'Nuclear', color: CONFIG.colors.nuclear }
  ];
  
  legendData.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(${i * 90}, 0)`);
    
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
    
    // Generate stack data
    const stackData = stackGenerator(chartData);
    
    // Update x scale
    xScale.domain(chartData.map(d => d.year));
    
    // Update axes with transition
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => d + '%');
    
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
    const layers = barsGroup
      .selectAll('.layer')
      .data(stackData, d => d.key);
    
    // Remove old layers
    layers.exit()
      .selectAll('rect')
      .transition(t)
      .attr('y', height)
      .attr('height', 0)
      .end()
      .then(() => {
        layers.exit().remove();
      });
    
    // Add new layers
    const layersEnter = layers.enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', d => getSourceColor(d.key));
    
    // Update all layers
    const allLayers = layersEnter.merge(layers);
    
    // Bind rectangles to data
    const rects = allLayers
      .selectAll('rect')
      .data(d => d, d => d.data.year);
    
    // Remove old rectangles
    rects.exit()
      .transition(t)
      .attr('y', height)
      .attr('height', 0)
      .remove();
    
    // Add new rectangles
    const rectsEnter = rects.enter()
      .append('rect')
      .attr('x', d => xScale(d.data.year))
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0);
    
    // Update all rectangles
    rectsEnter.merge(rects)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8);
        
        const layerKey = d3.select(this.parentNode).datum().key;
        const value = d[1] - d[0];
        
        const tooltipContent = `
          <strong>Year:</strong> ${d.data.year}<br/>
          <strong>Source:</strong> ${layerKey.charAt(0).toUpperCase() + layerKey.slice(1)}<br/>
          <strong>Percentage:</strong> ${formatPercent(value)}
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
      .attr('x', d => xScale(d.data.year))
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('opacity', 1);
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

export default renderElectricitySource;
