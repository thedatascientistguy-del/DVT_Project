/**
 * Chart 22: World Energy Map
 * 
 * Interactive world map showing energy consumption by country with hover insights.
 * Features year-based filtering to see energy trends over time.
 * 
 * Features:
 * - Choropleth map colored by energy consumption intensity
 * - Hover tooltips showing detailed country insights
 * - Year slider for temporal analysis
 * - Color scale from light to dark based on energy consumption
 * - Responsive sizing
 */

import { CONFIG } from '../config.js';
import { filterByCountry, filterByYearRange, formatNumber } from '../utils.js';
import { Tooltip } from '../tooltip.js';

/**
 * Prepare map data for a specific year
 * 
 * @param {Array<EnergyRecord>} rawData - The complete energy dataset
 * @param {number} selectedYear - Year to display
 * @returns {Map<string, Object>} Map of country name to energy data
 */
function prepareMapData(rawData, selectedYear) {
  const dataMap = new Map();
  
  // Filter data for the selected year
  const yearData = rawData.filter(d => d.year === selectedYear);
  
  yearData.forEach(record => {
    dataMap.set(record.country, {
      country: record.country,
      year: record.year,
      totalEnergy: record.total_energy || 0,
      renewables: record.renewables || 0,
      fossil: record.fossil_energy || 0,
      nuclear: record.nuclear_energy || 0,
      emissions: record.greenhouse_gas_emissions || 0,
      population: record.population || 0,
      gdp: record.gdp || 0,
      perCapita: record.population > 0 ? (record.total_energy / record.population) * 1000000 : 0
    });
  });
  
  return dataMap;
}

/**
 * Render the World Energy Map chart
 * 
 * @param {string|HTMLElement} container - Container selector or DOM element
 * @param {Array<EnergyRecord>} data - The complete energy dataset
 * @param {FilterState} filterState - Initial filter state
 * @returns {Object} Chart instance with update method
 */
export function renderWorldEnergyMap(container, data, filterState) {
  // Get container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container)
    : container;
  
  if (!containerElement) {
    console.error('Container not found for World Energy Map chart');
    return null;
  }
  
  // Clear any existing content
  containerElement.innerHTML = '';
  
  // Set up dimensions
  const margin = { top: 80, right: 20, bottom: 60, left: 20 };
  const containerWidth = containerElement.clientWidth || 1200;
  const containerHeight = Math.max(containerWidth * 0.6, 500);
  
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
  
  // Year range from data
  const years = [...new Set(data.map(d => d.year))].sort();
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  // Current selected year
  let currentYear = filterState.yearRange ? filterState.yearRange[1] : maxYear;
  
  // Add year control
  const controlGroup = svg.append('g')
    .attr('transform', `translate(${margin.left}, 20)`);
  
  controlGroup.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', CONFIG.colors.text)
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text('Select Year:');
  
  // Year slider
  const sliderWidth = Math.min(300, width * 0.3);
  const sliderX = 100;
  
  const yearScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, sliderWidth])
    .clamp(true);
  
  const sliderGroup = controlGroup.append('g')
    .attr('transform', `translate(${sliderX}, -5)`);
  
  // Slider track
  sliderGroup.append('line')
    .attr('x1', 0)
    .attr('x2', sliderWidth)
    .attr('stroke', CONFIG.colors.border)
    .attr('stroke-width', 4)
    .attr('stroke-linecap', 'round');
  
  // Slider handle
  const sliderHandle = sliderGroup.append('circle')
    .attr('cx', yearScale(currentYear))
    .attr('cy', 0)
    .attr('r', 8)
    .attr('fill', CONFIG.colors.primary)
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'grab');
  
  // Year label
  const yearLabel = controlGroup.append('text')
    .attr('x', sliderX + sliderWidth + 15)
    .attr('y', 5)
    .attr('fill', CONFIG.colors.primary)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(currentYear);
  
  // Create projection
  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], { type: 'Sphere' });
  
  const pathGenerator = d3.geoPath().projection(projection);
  
  // Create color scale
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(data, d => d.total_energy) || 10000]);
  
  // Create tooltip
  const tooltip = new Tooltip(CONFIG);
  
  // Group for countries
  const countriesGroup = chartGroup.append('g')
    .attr('class', 'countries');
  
  // Add legend
  const legendWidth = 200;
  const legendHeight = 10;
  const legendX = width - legendWidth - 20;
  const legendY = height - 40;
  
  const legendGroup = chartGroup.append('g')
    .attr('transform', `translate(${legendX}, ${legendY})`);
  
  // Legend gradient
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%')
    .attr('x2', '100%');
  
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', d3.interpolateBlues(0));
  
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', d3.interpolateBlues(1));
  
  legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)');
  
  legendGroup.append('text')
    .attr('x', 0)
    .attr('y', -5)
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('Low');
  
  legendGroup.append('text')
    .attr('x', legendWidth)
    .attr('y', -5)
    .attr('text-anchor', 'end')
    .attr('fill', CONFIG.colors.textMuted)
    .attr('font-size', '12px')
    .text('High Energy Consumption (TWh)');
  
  /**
   * Render or update the map with new year
   */
  function render(year) {
    currentYear = year;
    yearLabel.text(currentYear);
    sliderHandle.attr('cx', yearScale(currentYear));
    
    // Prepare data for current year
    const mapData = prepareMapData(data, currentYear);
    
    // Load world map GeoJSON
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(worldData => {
        const countries = topojson.feature(worldData, worldData.objects.countries);
        
        // Get country name mapping
        const countryNames = new Map([
          ['USA', 'United States'],
          ['CHN', 'China'],
          ['IND', 'India'],
          ['GBR', 'United Kingdom'],
          ['DEU', 'Germany'],
          ['FRA', 'France'],
          ['BRA', 'Brazil'],
          ['CAN', 'Canada'],
          ['AUS', 'Australia'],
          ['JPN', 'Japan'],
          ['RUS', 'Russia'],
          ['MEX', 'Mexico'],
          ['IDN', 'Indonesia'],
          ['TUR', 'Turkey'],
          ['SAU', 'Saudi Arabia'],
          ['KOR', 'South Korea'],
          ['ESP', 'Spain'],
          ['ITA', 'Italy'],
          ['POL', 'Poland'],
          ['NLD', 'Netherlands']
        ]);
        
        // Bind data
        const paths = countriesGroup.selectAll('path')
          .data(countries.features);
        
        // Remove old paths
        paths.exit().remove();
        
        // Add new paths
        const pathsEnter = paths.enter()
          .append('path')
          .attr('d', pathGenerator)
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5);
        
        // Update all paths
        pathsEnter.merge(paths)
          .transition()
          .duration(500)
          .attr('fill', d => {
            // Try to match country by name
            const countryData = mapData.get(d.properties.name);
            if (countryData && countryData.totalEnergy > 0) {
              return colorScale(countryData.totalEnergy);
            }
            return '#e5e7eb'; // Gray for no data
          })
          .attr('opacity', 0.9);
        
        // Add hover interactions
        pathsEnter.merge(paths)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('opacity', 1)
              .attr('stroke-width', 1.5);
            
            const countryData = mapData.get(d.properties.name);
            
            if (countryData) {
              const tooltipContent = `
                <strong>${countryData.country}</strong><br/>
                <strong>Year:</strong> ${countryData.year}<br/>
                <strong>Total Energy:</strong> ${formatNumber(countryData.totalEnergy)} TWh<br/>
                <strong>Renewables:</strong> ${formatNumber(countryData.renewables)} TWh (${((countryData.renewables / countryData.totalEnergy) * 100).toFixed(1)}%)<br/>
                <strong>Fossil:</strong> ${formatNumber(countryData.fossil)} TWh<br/>
                <strong>Nuclear:</strong> ${formatNumber(countryData.nuclear)} TWh<br/>
                <strong>Emissions:</strong> ${formatNumber(countryData.emissions)} Mt CO₂<br/>
                <strong>Per Capita:</strong> ${formatNumber(countryData.perCapita, 2)} MWh/person
              `;
              tooltip.show(tooltipContent, event);
            } else {
              const tooltipContent = `
                <strong>${d.properties.name}</strong><br/>
                No data available for ${currentYear}
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
              .attr('opacity', 0.9)
              .attr('stroke-width', 0.5);
            
            tooltip.hide();
          });
      })
      .catch(error => {
        console.error('Error loading world map:', error);
        chartGroup.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', CONFIG.colors.textMuted)
          .text('Error loading world map. Please check your internet connection.');
      });
  }
  
  // Slider drag behavior
  const drag = d3.drag()
    .on('start', function() {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('drag', function(event) {
      const newX = Math.max(0, Math.min(sliderWidth, event.x));
      const newYear = Math.round(yearScale.invert(newX));
      
      if (newYear !== currentYear && years.includes(newYear)) {
        render(newYear);
      }
    })
    .on('end', function() {
      d3.select(this).style('cursor', 'grab');
    });
  
  sliderHandle.call(drag);
  
  // Click on track to jump to year
  sliderGroup.append('rect')
    .attr('x', 0)
    .attr('y', -10)
    .attr('width', sliderWidth)
    .attr('height', 20)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('click', function(event) {
      const [mouseX] = d3.pointer(event);
      const newYear = Math.round(yearScale.invert(mouseX));
      
      if (years.includes(newYear)) {
        render(newYear);
      }
    });
  
  // Load TopoJSON library if not available
  if (typeof topojson === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
    script.onload = () => render(currentYear);
    document.head.appendChild(script);
  } else {
    // Initial render
    render(currentYear);
  }
  
  // Return chart instance
  return {
    /**
     * Update chart with new filter state
     * @param {Array<EnergyRecord>} newData - Updated dataset
     * @param {FilterState} newFilterState - New filter state
     */
    update(newData, newFilterState) {
      data = newData;
      filterState = newFilterState;
      const newYear = newFilterState.yearRange ? newFilterState.yearRange[1] : currentYear;
      if (newYear !== currentYear && years.includes(newYear)) {
        render(newYear);
      }
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

export default renderWorldEnergyMap;
