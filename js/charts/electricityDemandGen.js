/**
 * Chart 3: Electricity Demand vs Generation
 * 
 * Displays electricity demand and generation as dual-line chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * 
 * Features:
 * - Dual-line chart showing electricity_demand and electricity_generation
 * - Distinct colors (amber for demand, cyan for generation)
 * - Legend distinguishing the two lines
 * - Interactive tooltip showing metric name and value
 * - Smooth 500ms transitions when filters change
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for visualization based on current filter state
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Object} Object with demand and generation arrays
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Aggregate or map data based on country selection
  if (filterState.country === 'All Countries') {
    // Aggregate across all countries by year
    const demandData = aggregateByYear(inRange, 'electricity_demand');
    const genData = aggregateByYear(inRange, 'electricity_generation');
    
    return { demand: demandData, generation: genData };
  } else {
    // Extract time series for single country
    const demandData = inRange
      .map(d => ({ year: d.year, value: d.electricity_demand || 0 }))
      .sort((a, b) => a.year - b.year);
    
    const genData = inRange
      .map(d => ({ year: d.year, value: d.electricity_generation || 0 }))
      .sort((a, b) => a.year - b.year);
    
    return { demand: demandData, generation: genData };
  }
}

/**
 * Render the Electricity Demand vs Generation chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderElectricityDemandGen(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Electricity Demand vs Generation chart');
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
    .text('Electricity Demand vs Generation');
  
  // Create scales (will be updated in render function)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Create line generators
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
    .text('Electricity (TWh)');
  
  // Create paths for lines
  const demandPath = chartGroup.append('path')
    .attr('class', 'demand-line')
    .attr('fill', 'none')
    .attr('stroke', CONFIG.colors.demand)
    .attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round');
  
  const generationPath = chartGroup.append('path')
    .attr('class', 'generation-line')
    .attr('fill', 'none')
    .attr('stroke', CONFIG.colors.generation)
    .attr('stroke-width', 2.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round');
  
  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${containerWidth - margin.right - 150}, ${margin.top - 10})`);
  
  // Demand legend item
  legend.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 25)
    .attr('y2', 0)
    .attr('stroke', CONFIG.colors.demand)
    .attr('stroke-width', 2.5);
  
  legend.append('text')
    .attr('x', 30)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '12px')
    .text('Demand');
  
  // Generation legend item
  legend.append('line')
    .attr('x1', 75)
    .attr('y1', 0)
    .attr('x2', 100)
    .attr('y2', 0)
    .attr('stroke', CONFIG.colors.generation)
    .attr('stroke-width', 2.5);
  
  legend.append('text')
    .attr('x', 105)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '12px')
    .text('Generation');
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create hover circles groups
  const demandCircles = chartGroup.append('g').attr('class', 'demand-circles');
  const generationCircles = chartGroup.append('g').attr('class', 'generation-circles');
  
  /**
   * Render or update the chart with new data
   * @param {boolean} isInitial - Whether this is the initial render
   */
  function render(isInitial = false) {
    // Prepare data
    const chartData = prepareData(data, filterState);
    
    // Check if we have valid data
    if (!chartData || chartData.demand.length === 0) {
      chartGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available for the selected filters');
      return;
    }
    
    // Combine both datasets to determine y-scale domain
    const allValues = [
      ...chartData.demand.map(d => d.value),
      ...chartData.generation.map(d => d.value)
    ].filter(v => v != null);
    
    // Update scales
    xScale.domain(d3.extent(chartData.demand, d => d.year));
    yScale.domain([0, d3.max(allValues) * 1.1]); // 10% padding at top
    
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
    
    // Update line paths
    if (isInitial) {
      // Initial animation: draw lines from left to right
      [demandPath, generationPath].forEach(path => {
        path.attr('stroke-dasharray', function() {
          const length = this.getTotalLength();
          return `${length} ${length}`;
        })
        .attr('stroke-dashoffset', function() {
          return this.getTotalLength();
        });
      });
      
      demandPath
        .attr('d', lineGenerator(chartData.demand))
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .attr('stroke-dashoffset', 0);
      
      generationPath
        .attr('d', lineGenerator(chartData.generation))
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .attr('stroke-dashoffset', 0);
    } else {
      // Update animation: morph to new data
      demandPath
        .transition(t)
        .attr('d', lineGenerator(chartData.demand));
      
      generationPath
        .transition(t)
        .attr('d', lineGenerator(chartData.generation));
    }
    
    // Update hover circles for demand
    updateCircles(demandCircles, chartData.demand, CONFIG.colors.demand, 'Demand', t);
    
    // Update hover circles for generation
    updateCircles(generationCircles, chartData.generation, CONFIG.colors.generation, 'Generation', t);
  }
  
  /**
   * Update hover circles for a metric
   */
  function updateCircles(circleGroup, data, color, label, transition) {
    const circles = circleGroup
      .selectAll('circle')
      .data(data, d => d.year);
    
    // Remove old circles
    circles.exit()
      .transition(transition)
      .attr('r', 0)
      .remove();
    
    // Add new circles
    const circlesEnter = circles.enter()
      .append('circle')
      .attr('r', 0)
      .attr('fill', color)
      .attr('stroke', CONFIG.colors.background)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0);
    
    // Update all circles
    circlesEnter.merge(circles)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 6)
          .style('opacity', 1);
        
        const tooltipContent = `
          <strong>Year:</strong> ${d.year}<br/>
          <strong>${label}:</strong> ${formatNumber(d.value)} TWh
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
          .attr('r', 4)
          .style('opacity', 0);
        
        tooltip.hide();
      })
      .transition(transition)
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

export default renderElectricityDemandGen;
