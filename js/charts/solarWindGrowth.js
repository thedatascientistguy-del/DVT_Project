/**
 * Chart 19: Solar & Wind Growth Comparison
 * 
 * Dual-line chart showing the rapid growth of solar and wind energy.
 */

import { CONFIG } from '../config.js';
import { aggregateByYear, filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

function prepareData(rawData, filterState) {
  const filtered = filterByCountry(rawData, filterState.country);
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  if (filterState.country === 'All Countries') {
    const solarData = aggregateByYear(inRange, 'solar_consumption');
    const windData = aggregateByYear(inRange, 'wind_consumption');
    
    return solarData.map(s => ({
      year: s.year,
      solar: s.value,
      wind: windData.find(w => w.year === s.year)?.value || 0
    }));
  } else {
    return inRange.map(d => ({
      year: d.year,
      solar: d.solar_consumption || 0,
      wind: d.wind_consumption || 0
    })).sort((a, b) => a.year - b.year);
  }
}

export function renderSolarWindGrowth(container, data, filterState) {
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
  
  const solarLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.solar))
    .curve(d3.curveMonotoneX);
  
  const windLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.wind))
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
    .text('Energy Consumption (TWh)');
  
  const solarPath = chartGroup.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#fbbf24')
    .attr('stroke-width', 3);
  
  const windPath = chartGroup.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#06b6d4')
    .attr('stroke-width', 3);
  
  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left + width - 150}, ${margin.top + 20})`);
  
  legend.append('line')
    .attr('x1', 0).attr('x2', 30)
    .attr('y1', 0).attr('y2', 0)
    .attr('stroke', '#fbbf24')
    .attr('stroke-width', 3);
  legend.append('text')
    .attr('x', 35).attr('y', 5)
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '12px')
    .text('Solar');
  
  legend.append('line')
    .attr('x1', 0).attr('x2', 30)
    .attr('y1', 25).attr('y2', 25)
    .attr('stroke', '#06b6d4')
    .attr('stroke-width', 3);
  legend.append('text')
    .attr('x', 35).attr('y', 30)
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '12px')
    .text('Wind');
  
  const tooltip = new Tooltip(CONFIG);
  const hoverGroup = chartGroup.append('g');
  
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
    const maxValue = d3.max(chartData, d => Math.max(d.solar, d.wind));
    yScale.domain([0, maxValue * 1.1]);
    
    const t = d3.transition().duration(CONFIG.animation.duration);
    
    xAxisGroup.transition(t)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup.transition(t)
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => formatNumber(d, 0)))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    solarPath.transition(t).attr('d', solarLine(chartData));
    windPath.transition(t).attr('d', windLine(chartData));
    
    // Add hover circles for both lines
    const solarCircles = hoverGroup.selectAll('.solar-circle').data(chartData);
    solarCircles.exit().remove();
    
    solarCircles.enter().append('circle')
      .attr('class', 'solar-circle')
      .attr('r', 4)
      .attr('fill', '#fbbf24')
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1);
        tooltip.show(`<strong>Year:</strong> ${d.year}<br/><strong>Solar:</strong> ${formatNumber(d.solar)} TWh`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).attr('opacity', 0);
        tooltip.hide();
      })
      .merge(solarCircles)
      .transition(t)
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.solar));
    
    const windCircles = hoverGroup.selectAll('.wind-circle').data(chartData);
    windCircles.exit().remove();
    
    windCircles.enter().append('circle')
      .attr('class', 'wind-circle')
      .attr('r', 4)
      .attr('fill', '#06b6d4')
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1);
        tooltip.show(`<strong>Year:</strong> ${d.year}<br/><strong>Wind:</strong> ${formatNumber(d.wind)} TWh`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).attr('opacity', 0);
        tooltip.hide();
      })
      .merge(windCircles)
      .transition(t)
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.wind));
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

export default renderSolarWindGrowth;
