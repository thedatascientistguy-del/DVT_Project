/**
 * Chart 17: Nuclear Energy Trend
 * 
 * Tracks nuclear energy consumption over time - important low-carbon source.
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

function prepareData(rawData, filterState) {
  const filtered = filterByCountry(rawData, filterState.country);
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  if (filterState.country === 'All Countries') {
    return aggregateByYear(inRange, 'nuclear_consumption');
  } else {
    return inRange
      .map(d => ({ year: d.year, value: d.nuclear_consumption || 0 }))
      .sort((a, b) => a.year - b.year);
  }
}

export function renderNuclearTrend(container, data, filterState) {
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
  
  // Define gradient for area
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'nuclear-gradient')
    .attr('x1', '0%')
    .attr('x2', '0%')
    .attr('y1', '0%')
    .attr('y2', '100%');
  
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', CONFIG.colors.nuclear)
    .attr('stop-opacity', 0.6);
  
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', CONFIG.colors.nuclear)
    .attr('stop-opacity', 0.1);
  
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  
  const area = d3.area()
    .x(d => xScale(d.year))
    .y0(height)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  const xAxisGroup = chartGroup.append('g').attr('transform', `translate(0,${height})`);
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
    .text('Nuclear Energy (TWh)');
  
  const areaPath = chartGroup.append('path').attr('fill', 'url(#nuclear-gradient)');
  const linePath = chartGroup.append('path')
    .attr('fill', 'none')
    .attr('stroke', CONFIG.colors.nuclear)
    .attr('stroke-width', 2);
  
  const tooltip = new Tooltip(CONFIG);
  const hoverCircles = chartGroup.append('g');
  
  function render(isInitial = false) {
    const chartData = prepareData(data, filterState);
    
    if (!chartData || chartData.length === 0) {
      chartGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', CONFIG.colors.textMuted)
        .text('No data available');
      return;
    }
    
    xScale.domain(d3.extent(chartData, d => d.year));
    yScale.domain([0, d3.max(chartData, d => d.value) * 1.1]);
    
    const t = d3.transition().duration(CONFIG.animation.duration);
    
    xAxisGroup.transition(t)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup.transition(t)
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => formatNumber(d, 0)))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    areaPath.transition(t).attr('d', area(chartData));
    linePath.transition(t).attr('d', line(chartData));
    
    const circles = hoverCircles.selectAll('circle').data(chartData);
    circles.exit().remove();
    
    circles.enter().append('circle')
      .attr('r', 4)
      .attr('fill', CONFIG.colors.nuclear)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1);
        tooltip.show(`<strong>Year:</strong> ${d.year}<br/><strong>Nuclear:</strong> ${formatNumber(d.value)} TWh`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).attr('opacity', 0);
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

export default renderNuclearTrend;
