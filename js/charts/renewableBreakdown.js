/**
 * Chart 7: Renewable Energy Breakdown
 * 
 * Displays the composition of renewable energy sources as a donut chart.
 * Responds to global filter system (country and year range).
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 * 
 * Features:
 * - Donut chart showing solar/wind/hydro/other renewables
 * - Color mapping (yellow solar, light blue wind, green hydro)
 * - Insufficient data handling with message display
 * - Tooltip with source type and percentage
 * - Smooth transitions when filters change
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange, formatNumber, formatPercent } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare data for donut chart visualization
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {FilterState} filterState - Current filter state (country, yearRange)
 * @returns {Array<Object>|null} Array of objects with renewable type and value, or null if insufficient data
 */
function prepareData(rawData, filterState) {
  // Apply country filter
  const filtered = filterByCountry(rawData, filterState.country);
  
  // Apply year range filter
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  // Sum consumption for each renewable type across selected years
  const solar = d3.sum(inRange, d => d.solar_consumption || 0);
  const wind = d3.sum(inRange, d => d.wind_consumption || 0);
  const hydro = d3.sum(inRange, d => d.hydro_consumption || 0);
  const biofuel = d3.sum(inRange, d => d.biofuel_consumption || 0);
  const other = d3.sum(inRange, d => d.other_renewable_consumption || 0);
  
  const total = solar + wind + hydro + biofuel + other;
  
  // Check if we have sufficient data
  if (total < 1) {
    return null; // Insufficient data
  }
  
  // Return data with percentages
  return [
    { 
      type: 'Solar', 
      value: solar,
      percentage: (solar / total) * 100,
      color: CONFIG.colors.solar
    },
    { 
      type: 'Wind', 
      value: wind,
      percentage: (wind / total) * 100,
      color: CONFIG.colors.wind
    },
    { 
      type: 'Hydro', 
      value: hydro,
      percentage: (hydro / total) * 100,
      color: CONFIG.colors.hydro
    },
    { 
      type: 'Biofuel', 
      value: biofuel,
      percentage: (biofuel / total) * 100,
      color: CONFIG.colors.biofuel
    },
    { 
      type: 'Other', 
      value: other,
      percentage: (other / total) * 100,
      color: CONFIG.colors.renewables
    }
  ].filter(d => d.value > 0); // Only include non-zero values
}

/**
 * Render the Renewable Energy Breakdown donut chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderRenewableBreakdown(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for Renewable Breakdown chart');
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
  
  // Calculate radius
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.5; // Donut inner radius
  
  // Create SVG
  const svg = d3.select(containerElement)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
    .style('background-color', 'transparent');
  
  // Create chart group centered in the available space
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left + width / 2},${margin.top + height / 2})`);
  
  // Add title
  svg.append('text')
    .attr('x', containerWidth / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Renewable Energy Breakdown');
  
  // Create pie generator
  const pieGenerator = d3.pie()
    .value(d => d.value)
    .sort(null);
  
  // Create arc generator for donut
  const arcGenerator = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius)
    .cornerRadius(CONFIG.chartTypes.donut.cornerRadius);
  
  // Create label arc
  const labelArc = d3.arc()
    .innerRadius(radius * 0.8)
    .outerRadius(radius * 0.8);
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Create arcs group
  const arcsGroup = chartGroup.append('g')
    .attr('class', 'arcs');
  
  // Create labels group
  const labelsGroup = chartGroup.append('g')
    .attr('class', 'labels');
  
  // Create center label for "No Data" message
  const centerLabel = chartGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '14px')
    .attr('opacity', 0);
  
  /**
   * Render or update the chart with new data
   * @param {boolean} isInitial - Whether this is the initial render
   */
  function render(isInitial = false) {
    // Prepare data
    const chartData = prepareData(data, filterState);
    
    // Check if we have valid data
    if (!chartData) {
      // Display "insufficient data" message
      centerLabel
        .text('Insufficient renewable data')
        .transition()
        .duration(CONFIG.animation.duration)
        .attr('opacity', 1);
      
      // Remove any existing arcs and labels
      arcsGroup.selectAll('.arc').remove();
      labelsGroup.selectAll('.label').remove();
      return;
    }
    
    // Hide center message
    centerLabel.transition().duration(CONFIG.animation.duration).attr('opacity', 0);
    
    // Generate pie data
    const pieData = pieGenerator(chartData);
    
    // Update transition
    const t = d3.transition()
      .duration(CONFIG.animation.duration)
      .ease(CONFIG.animation.easing);
    
    // Update arcs
    const arcs = arcsGroup
      .selectAll('.arc')
      .data(pieData, d => d.data.type);
    
    // Remove old arcs
    arcs.exit()
      .transition(t)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(d, { startAngle: 0, endAngle: 0 });
        return function(t) {
          return arcGenerator(interpolate(t));
        };
      })
      .remove();
    
    // Add new arcs
    const arcsEnter = arcs.enter()
      .append('path')
      .attr('class', 'arc')
      .attr('fill', d => d.data.color)
      .attr('stroke', CONFIG.colors.background)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');
    
    // Update all arcs
    const allArcs = arcsEnter.merge(arcs);
    
    allArcs
      .on('mouseover', function(event, d) {
        // Highlight arc
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8);
        
        // Show tooltip
        const tooltipContent = `
          <strong>Source:</strong> ${d.data.type}<br/>
          <strong>Value:</strong> ${formatNumber(d.data.value)} TWh<br/>
          <strong>Percentage:</strong> ${formatPercent(d.data.percentage)}
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
      // Initial animation: grow from center
      allArcs
        .attr('d', d3.arc().innerRadius(innerRadius).outerRadius(innerRadius))
        .transition()
        .duration(CONFIG.animation.duration)
        .ease(CONFIG.animation.easing)
        .attrTween('d', function(d) {
          const interpolate = d3.interpolate(
            { startAngle: 0, endAngle: 0 },
            { startAngle: d.startAngle, endAngle: d.endAngle }
          );
          return function(t) {
            const arc = d3.arc()
              .innerRadius(innerRadius)
              .outerRadius(innerRadius + (radius - innerRadius) * t)
              .cornerRadius(CONFIG.chartTypes.donut.cornerRadius);
            return arc(interpolate(t));
          };
        });
    } else {
      // Update animation: morph to new angles
      allArcs
        .transition(t)
        .attrTween('d', function(d) {
          const previous = this._current || { startAngle: 0, endAngle: 0 };
          const interpolate = d3.interpolate(previous, d);
          this._current = interpolate(1);
          return function(t) {
            return arcGenerator(interpolate(t));
          };
        });
    }
    
    // Store current angles for next transition
    allArcs.each(function(d) {
      this._current = d;
    });
    
    // Update labels (only show for slices >5%)
    const labels = labelsGroup
      .selectAll('.label')
      .data(pieData.filter(d => d.data.percentage > 5), d => d.data.type);
    
    // Remove old labels
    labels.exit()
      .transition(t)
      .attr('opacity', 0)
      .remove();
    
    // Add new labels
    const labelsEnter = labels.enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('fill', CONFIG.colors.text)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0);
    
    // Update all labels
    const allLabels = labelsEnter.merge(labels);
    
    allLabels
      .text(d => formatPercent(d.data.percentage, 1))
      .transition(t)
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
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

export default renderRenewableBreakdown;
