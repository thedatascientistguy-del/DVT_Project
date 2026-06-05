/**
 * Chart 18: Energy Transition Progress
 * 
 * Shows the shift from fossil fuels to clean energy over time as a stacked percentage area.
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange } from '../utils.js';
import { Tooltip } from '../tooltip.js';

function prepareData(rawData, filterState) {
  const filtered = filterByCountry(rawData, filterState.country);
  const inRange = filterByYearRange(filtered, ...filterState.yearRange);
  
  if (filterState.country === 'All Countries') {
    const yearGroups = d3.group(inRange, d => d.year);
    return Array.from(yearGroups, ([year, records]) => {
      const fossil = d3.sum(records, d => d.fossil_fuel_consumption || 0);
      const renewables = d3.sum(records, d => d.renewables_consumption || 0);
      const nuclear = d3.sum(records, d => d.nuclear_consumption || 0);
      const total = fossil + renewables + nuclear;
      
      return {
        year,
        fossil: total > 0 ? (fossil / total) * 100 : 0,
        renewables: total > 0 ? (renewables / total) * 100 : 0,
        nuclear: total > 0 ? (nuclear / total) * 100 : 0
      };
    }).sort((a, b) => a.year - b.year);
  } else {
    return inRange.map(d => {
      const total = (d.fossil_fuel_consumption || 0) + (d.renewables_consumption || 0) + (d.nuclear_consumption || 0);
      return {
        year: d.year,
        fossil: total > 0 ? ((d.fossil_fuel_consumption || 0) / total) * 100 : 0,
        renewables: total > 0 ? ((d.renewables_consumption || 0) / total) * 100 : 0,
        nuclear: total > 0 ? ((d.nuclear_consumption || 0) / total) * 100 : 0
      };
    }).sort((a, b) => a.year - b.year);
  }
}

export function renderTransitionProgress(container, data, filterState) {
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
  const yScale = d3.scaleLinear().range([height, 0]).domain([0, 100]);
  
  const stack = d3.stack()
    .keys(['fossil', 'nuclear', 'renewables'])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveMonotoneX);
  
  const colorMap = {
    fossil: CONFIG.colors.fossil,
    nuclear: CONFIG.colors.nuclear,
    renewables: CONFIG.colors.renewables
  };
  
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
    .text('Energy Mix (%)');
  
  const layersGroup = chartGroup.append('g');
  const tooltip = new Tooltip(CONFIG);
  
  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left + 20}, ${margin.top + 20})`);
  
  const legendData = [
    { key: 'renewables', label: 'Renewables', color: CONFIG.colors.renewables },
    { key: 'nuclear', label: 'Nuclear', color: CONFIG.colors.nuclear },
    { key: 'fossil', label: 'Fossil Fuels', color: CONFIG.colors.fossil }
  ];
  
  legendData.forEach((item, i) => {
    const g = legend.append('g').attr('transform', `translate(0, ${i * 25})`);
    g.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', item.color);
    g.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', CONFIG.colors.text)
      .attr('font-size', '12px')
      .text(item.label);
  });
  
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
    
    const t = d3.transition().duration(CONFIG.animation.duration);
    
    xAxisGroup.transition(t)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    yAxisGroup.transition(t)
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', CONFIG.colors.textMuted);
    
    xAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    yAxisGroup.selectAll('line, path').attr('stroke', CONFIG.colors.border);
    
    const layers = stack(chartData);
    
    const paths = layersGroup.selectAll('path').data(layers);
    
    paths.exit().remove();
    
    paths.enter()
      .append('path')
      .attr('fill', d => colorMap[d.key])
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        const mouseYear = Math.round(xScale.invert(d3.pointer(event)[0]));
        const point = d.find(p => p.data.year === mouseYear) || d[0];
        const value = point[1] - point[0];
        tooltip.show(`<strong>${d.key}:</strong> ${value.toFixed(1)}%<br/><strong>Year:</strong> ${point.data.year}`, event);
      })
      .on('mousemove', (event) => tooltip.updatePosition(event))
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        tooltip.hide();
      })
      .merge(paths)
      .transition(t)
      .attr('d', area);
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

export default renderTransitionProgress;
