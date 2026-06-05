/**
 * Chart 20: Emissions Per Capita Ranking
 * 
 * Horizontal bar chart showing countries ranked by per capita emissions.
 */

import { CONFIG } from '../config.js';
import { filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

function prepareData(rawData, filterState) {
  const inRange = filterByYearRange(rawData, ...filterState.yearRange);
  
  // Calculate average emissions per capita for each country
  const countryGroups = d3.group(inRange, d => d.country);
  
  const countryAverages = Array.from(countryGroups, ([country, records]) => {
    const validRecords = records.filter(d => d.population && d.greenhouse_gas_emissions);
    if (validRecords.length === 0) return null;
    
    const avgEmissions = d3.mean(validRecords, d => d.greenhouse_gas_emissions);
    const avgPopulation = d3.mean(validRecords, d => d.population);
    
    return {
      country,
      value: avgPopulation > 0 ? (avgEmissions / avgPopulation) * 1e6 : 0 // tons per capita
    };
  })
  .filter(d => d !== null && d.value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, 15); // Top 15
  
  return countryAverages;
}

export function renderEmissionsPerCapita(container, data, filterState) {
  const containerElement = typeof container === 'string' ? document.querySelector(container) : container;
  if (!containerElement) return null;
  
  containerElement.innerHTML = '';
  
  const margin = { ...CONFIG.chart.margin, left: 120 };
  const containerWidth = containerElement.clientWidth || 600;
  const containerHeight = Math.max(containerWidth / CONFIG.chart.aspectRatio, 450);
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  const svg = d3.select(containerElement)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight);
  
  const chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleBand().range([0, height]).padding(0.2);
  
  const xAxisGroup = chartGroup.append('g').attr('transform', `translate(0,${height})`);
  const yAxisGroup = chartGroup.append('g');
  
  svg.append('text')
    .attr('x', margin.left + width / 2)
    .attr('y', containerHeight - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Emissions Per Capita (tons CO₂)');
  
  const tooltip = new Tooltip(CONFIG);
  
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
    
    xScale.domain([0, d3.max(chartData, d => d.value) * 1.1]);
    yScale.domain(chartData.map(d => d.country));
    
    const t = d3.transition().duration(CONFIG.animation.duration);
    
    xAxisGroup.transition(t)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup.transition(t)
      .call(d3.axisLeft(yScale))
      .selectAll('text').attr('fill', CONFIG.colors.text).attr('font-size', '11px');
    
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    const bars = chartGroup.selectAll('.bar').data(chartData, d => d.country);
    
    bars.exit().transition(t).attr('width', 0).remove();
    
    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.country))
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', CONFIG.colors.emissions)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip.show(`<strong>${d.country}</strong><br/>Emissions: ${d.value.toFixed(2)} tons CO₂ per capita`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.hide();
      })
      .merge(bars)
      .transition(t)
      .attr('y', d => yScale(d.country))
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth());
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

export default renderEmissionsPerCapita;
