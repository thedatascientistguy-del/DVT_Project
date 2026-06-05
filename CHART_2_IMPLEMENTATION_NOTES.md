# Chart 2: CO₂ Emissions Trend - Implementation Notes

## Overview
Chart 2 (CO₂ Emissions Trend) is a line chart with area fill that visualizes greenhouse gas emissions over time. It follows the same architectural pattern as Chart 1 but with emissions-specific styling.

## Key Implementation Details

### Data Source
- **Metric**: `greenhouse_gas_emissions`
- **Unit**: Million Tonnes
- **Aggregation**: Sum across all countries for "All Countries" view, individual values for specific countries

### Visual Design

#### Area Fill
```javascript
// Area generator with baseline at bottom
const areaGenerator = d3.area()
  .x(d => xScale(d.year))
  .y0(height)              // Bottom of chart
  .y1(d => yScale(d.value)) // Data value
  .curve(d3.curveMonotoneX); // Smooth curve
```

#### Gradient
```javascript
// Linear gradient for area fill (top to bottom)
gradient.append('stop')
  .attr('offset', '0%')
  .attr('stop-color', CONFIG.colors.emissions) // #ef4444 (red)
  .attr('stop-opacity', 0.5);

gradient.append('stop')
  .attr('offset', '100%')
  .attr('stop-color', CONFIG.colors.emissions)
  .attr('stop-opacity', 0.1);

// Area path uses gradient
areaPath
  .attr('fill', 'url(#emissions-gradient)')
  .attr('opacity', 0.3); // Overall opacity
```

#### Line
```javascript
const lineGenerator = d3.line()
  .x(d => xScale(d.year))
  .y(d => yScale(d.value))
  .curve(d3.curveMonotoneX); // Smooth curve matching area

linePath
  .attr('stroke', CONFIG.colors.emissions) // Red
  .attr('stroke-width', 2.5)
```

### Animation Sequence

#### Initial Render
1. Area path fades in from opacity 0 to 0.3
2. Line path draws from left to right using stroke-dasharray technique
3. Both animations run simultaneously over 500ms

#### Update Transition
1. Area morphs to new data shape
2. Line morphs to new data shape
3. Hover circles reposition smoothly
4. All transitions synchronized over 500ms

### Hover Interaction

```javascript
// Tooltip content for emissions
const tooltipContent = `
  <strong>Year:</strong> ${d.year}<br/>
  <strong>Emissions:</strong> ${formatNumber(d.value)} Million Tonnes
`;
```

### Color Scheme
- **Line**: `#ef4444` (red) - indicates negative environmental impact
- **Area Fill**: Red gradient with 0.3 opacity
- **Hover Circles**: Red fill with dark background stroke

## Comparison with Chart 1

| Feature | Chart 1 (Energy) | Chart 2 (Emissions) |
|---------|------------------|---------------------|
| **Metric** | `total_energy` | `greenhouse_gas_emissions` |
| **Units** | TWh | Million Tonnes |
| **Visual** | Line only | Line + Area fill |
| **Color** | Green (#10b981) | Red (#ef4444) |
| **Fill** | None | Gradient (0.3 opacity) |
| **Gradient** | No | Yes (50% → 10% opacity) |
| **Semantic** | Positive (energy production) | Negative (emissions) |

## Data Flow

```
User Filters (country, yearRange)
  ↓
prepareData()
  ├── filterByCountry() → filtered data
  ├── filterByYearRange() → data in range
  └── aggregateByYear() or map() → [{year, value}, ...]
  ↓
Scales
  ├── xScale.domain([minYear, maxYear])
  └── yScale.domain([0, maxEmissions * 1.1])
  ↓
Generators
  ├── areaGenerator() → area path data
  └── lineGenerator() → line path data
  ↓
DOM Update
  ├── areaPath.attr('d', areaData) with transition
  ├── linePath.attr('d', lineData) with transition
  └── circles.attr('cx', 'cy') with transition
```

## Integration Example

```javascript
import { renderCo2EmissionsTrend } from './js/charts/co2EmissionsTrend.js';

// Initialize chart
const emissionsChart = renderCo2EmissionsTrend(
  '#emissions-container',
  energyData,
  { country: 'All Countries', yearRange: [2000, 2019] }
);

// Update on filter change
filterManager.subscribe((newFilterState) => {
  emissionsChart.update(energyData, newFilterState);
});

// Cleanup on unmount
emissionsChart.destroy();
```

## Testing Checklist

- [x] Chart renders with "All Countries" data
- [x] Chart renders with single country data
- [x] Year range filtering works correctly
- [x] Tooltip displays on hover
- [x] Tooltip shows correct values
- [x] Transitions are smooth (500ms)
- [x] Area fill uses red color with gradient
- [x] Line uses red color at 2.5px width
- [x] Hover circles appear/disappear smoothly
- [x] Empty data shows appropriate message
- [x] Chart responds to filter updates
- [x] Axes update with transitions

## Requirements Coverage

✅ **Requirement 5.1**: Line chart showing greenhouse gas emissions by year
✅ **Requirement 5.2**: Aggregates emissions across all countries when "All Countries" selected  
✅ **Requirement 5.3**: Displays single country's emissions trend  
✅ **Requirement 5.4**: Tooltip displays year and exact emissions value  
✅ **Requirement 5.5**: Uses red color from Color_Configuration  
✅ **Requirement 5.6**: Smooth transition animation when year range changes  

## File Structure

```
js/charts/co2EmissionsTrend.js
├── Import statements (CONFIG, utils, Tooltip)
├── prepareData() function
│   ├── Filter by country
│   ├── Filter by year range
│   └── Aggregate or map emissions data
├── renderCo2EmissionsTrend() function
│   ├── Container setup
│   ├── Dimensions calculation
│   ├── SVG creation
│   ├── Gradient definition
│   ├── Scale setup
│   ├── Generator setup (area + line)
│   ├── Axes setup
│   ├── Path elements
│   ├── Tooltip integration
│   ├── Hover circles
│   ├── render() function (internal)
│   │   ├── Prepare data
│   │   ├── Update scales
│   │   ├── Update axes
│   │   ├── Update paths (area + line)
│   │   └── Update hover circles
│   └── Return chart instance
│       ├── update() method
│       └── destroy() method
└── Export renderCo2EmissionsTrend
```

## Performance Considerations

- **Data Points**: Chart handles 20 years × 200+ countries efficiently
- **Aggregation**: Uses d3.group() and d3.sum() for O(n) aggregation
- **Transitions**: All transitions use requestAnimationFrame via D3
- **Memory**: Cleanup via destroy() method removes tooltip and SVG elements

## Accessibility

- Chart title clearly identifies content
- Axis labels provide context
- Tooltip provides detailed information on hover
- Color contrast meets WCAG AA standards (red on dark background)
- All text elements use sufficient font sizes (12px-16px)

## Browser Compatibility

- Requires D3.js v7
- Uses ES6 modules
- SVG-based rendering (all modern browsers)
- Tested in Chrome, Firefox, Safari, Edge
