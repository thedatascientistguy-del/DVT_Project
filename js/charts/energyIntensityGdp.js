/**
 * Chart 16: Energy Intensity of GDP
 * 
 * Shows energy consumption per unit of GDP over time - key efficiency metric.
 * Lower values indicate more efficient economies.
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

function prepareData(rawData, filterState) {
  const filtered = filterByCountry(rawData, filterState.country);
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  if (filterState.country === 'All Countries') {
    // Aggregate: total energy / total GDP
    const yearGroups = d3.group(inRange, d => d.year);
    return Array.from(yearGroups, ([year, records]) => {
      const totalEnergy = d3.sum(records, d => d.total_energy || 0);
      const totalGDP = d3.sum(records, d => d.gdp || 0);
      return {
        year,
        value: totalGDP > 0 ? (totalEnergy / totalGDP) * 1e12 : 0 // MWh per dollar (scaled up for visibility)
      };
    }).sort((a, b) => a.year - b.year);
  } else {
    return inRange
      .filter(d => d.gdp && d.total_energy)
      .map(d => ({
        year: d.year,
        value: (d.total_energy / d.gdp) * 1e12 // MWh per dollar
      }))
      .sort((a, b) => a.year - b.year);
  }
}

export function renderEnergyIntensityGdp(container, data, filterState) {
  const containerElement = typeof container === 'string' ? document.querySelector(container) : container;
  if (!containerElement) return null;
  
  containerElement.innerHTML = '';
  
  const margin = CONFIG.chart.margin;
  const containerWidth = containerElement.clientWidth || 600;
  const containerHeight = Math.max(containerWidth / CONFIG.chart.aspectRatio, CONFIG.chart.minHeight);
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  const svg = d3.select(containerElement)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight);
  
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  
  const lineGenerator = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  const xAxisGroup = chartGroup.append('g')
    .attr('transform', `translate(0,${height})`);
  const yAxisGroup = chartGroup.append('g');
  
  svg.append('text')
    .attr('x', margin.left + width / 2)
    .attr('y', containerHeight - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Year');
  
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Energy Intensity (MWh per million $)');
  
  // Add insight box
  const insightBox = svg.append('g')
    .attr('class', 'insight-box')
    .attr('transform', `translate(${margin.left + 10}, ${margin.top + 10})`);
  
  insightBox.append('rect')
    .attr('width', 280)
    .attr('height', 70)
    .attr('fill', CONFIG.colors.panel)
    .attr('stroke', CONFIG.colors.primary)
    .attr('stroke-width', 2)
    .attr('rx', 5)
    .attr('opacity', 0.95);
  
  insightBox.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .attr('fill', CONFIG.colors.primary)
    .attr('font-size', '13px')
    .attr('font-weight', 'bold')
    .text('💡 What this shows:');
  
  insightBox.append('text')
    .attr('x', 10)
    .attr('y', 38)
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '11px')
    .text('Lower values = more efficient economy');
  
  insightBox.append('text')
    .attr('x', 10)
    .attr('y', 54)
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '10px')
    .text('Declining trend indicates technological progress');
  
  const linePath = chartGroup.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6') // Bright blue
    .attr('stroke-width', 3);
  
  const tooltip = new Tooltip(CONFIG);
  const hoverCircles = chartGroup.append('g');
  
  function render(isInitial = false) {
    const chartData = prepareData(data, filterState);
    
    // Debug logging
    console.log('Energy Intensity Chart Data:', chartData);
    if (chartData && chartData.length > 0) {
      console.log('Sample values:', chartData.slice(0, 3));
      console.log('Min:', d3.min(chartData, d => d.value));
      console.log('Max:', d3.max(chartData, d => d.value));
    }
    
    if (!chartData || chartData.length === 0) {
      chartGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available');
      return;
    }
    
    // Calculate trend
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    const isImproving = percentChange < 0; // Declining is good for energy intensity
    
    // Update insight text
    insightBox.selectAll('.dynamic-insight').remove();
    
    insightBox.append('text')
      .attr('class', 'dynamic-insight')
      .attr('x', width - 320)
      .attr('y', 20)
      .attr('fill', isImproving ? CONFIG.colors.renewables : CONFIG.colors.emissions)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${isImproving ? '↓' : '↑'} ${Math.abs(percentChange).toFixed(1)}% ${isImproving ? 'improvement' : 'decline'}`);
    
    xScale.domain(d3.extent(chartData, d => d.year));
    
    // Set Y scale to start from minimum value (not 0) to make trend visible
    const minValue = d3.min(chartData, d => d.value);
    const maxValue = d3.max(chartData, d => d.value);
    const padding = (maxValue - minValue) * 0.1; // 10% padding
    yScale.domain([minValue - padding, maxValue + padding]);
    
    const t = d3.transition().duration(CONFIG.animation.duration);
    
    xAxisGroup.transition(t)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup.transition(t)
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    linePath.transition(t).attr('d', lineGenerator(chartData));
    
    const circles = hoverCircles.selectAll('circle').data(chartData);
    circles.exit().remove();
    
    circles.enter().append('circle')
      .attr('r', 5)
      .attr('fill', '#3b82f6') // Match line color
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 7).attr('opacity', 1);
        tooltip.show(`<strong>Year:</strong> ${d.year}<br/><strong>Intensity:</strong> ${d.value.toFixed(2)} MWh/$M`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('r', 5).attr('opacity', 0);
        tooltip.hide();
      })
      .merge(circles)
      .transition(t)
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.value));
  }
  
  render(true);
  
  return {
    update(newData, newFilterState) {
      data = newData;
      filterState = newFilterState;
      render(false);
    },
    destroy() {
      tooltip.remove();
      containerElement.innerHTML = '';
    }
  };
}

export default renderEnergyIntensityGdp;
