/**
 * Tooltip System Module for Energy Transition Dashboard
 * 
 * This module provides a reusable tooltip component that can be used across all
 * visualization charts. The tooltip displays contextual information on hover with
 * automatic positioning to prevent off-screen display.
 * 
 * Features:
 * - Dark theme styling consistent with dashboard design
 * - Dynamic positioning with viewport boundary detection
 * - Smooth show/hide transitions
 * - Flexible content formatting
 * - Configurable offsets from cursor
 */

/**
 * Default configuration for tooltip behavior and styling
 * These values match the design specification and can be overridden
 */
const DEFAULT_CONFIG = {
  colors: {
    panel: '#111827',
    text: '#e5e7eb',
    border: '#1f2937'
  },
  tooltip: {
    offset: { x: 10, y: -20 }
  }
};

/**
 * Tooltip class - Reusable tooltip component for all charts
 * 
 * Usage example:
 * ```javascript
 * const tooltip = new Tooltip();
 * 
 * // On mouseover
 * chart.on('mouseover', function(event, d) {
 *   tooltip.show(`<strong>Year:</strong> ${d.year}<br/><strong>Value:</strong> ${d.value}`, event);
 * });
 * 
 * // On mousemove (for cursor-following tooltips)
 * chart.on('mousemove', function(event) {
 *   tooltip.updatePosition(event);
 * });
 * 
 * // On mouseout
 * chart.on('mouseout', function() {
 *   tooltip.hide();
 * });
 * ```
 */
class Tooltip {
  /**
   * Create a new Tooltip instance
   * 
   * @param {Object} config - Optional configuration object to override defaults
   * @param {Object} config.colors - Color configuration
   * @param {string} config.colors.panel - Background color
   * @param {string} config.colors.text - Text color
   * @param {string} config.colors.border - Border color
   * @param {Object} config.tooltip - Tooltip-specific configuration
   * @param {Object} config.tooltip.offset - Cursor offset
   * @param {number} config.tooltip.offset.x - Horizontal offset in pixels
   * @param {number} config.tooltip.offset.y - Vertical offset in pixels
   * 
   * @example
   * // Use default configuration
   * const tooltip = new Tooltip();
   * 
   * // Use custom configuration
   * const tooltip = new Tooltip({
   *   colors: { panel: '#1a1a1a', text: '#ffffff', border: '#333333' },
   *   tooltip: { offset: { x: 15, y: -15 } }
   * });
   */
  constructor(config = {}) {
    // Merge provided config with defaults
    this.config = this._mergeConfig(DEFAULT_CONFIG, config);
    
    // Create tooltip DOM element and append to body
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', this.config.colors.panel)
      .style('color', this.config.colors.text)
      .style('border', `1px solid ${this.config.colors.border}`)
      .style('border-radius', '4px')
      .style('padding', '10px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
      .style('max-width', '300px')
      .style('line-height', '1.5');
  }
  
  /**
   * Show the tooltip with specified content at the event location
   * 
   * @param {string} content - HTML content to display in tooltip
   * @param {MouseEvent} event - Mouse event object containing cursor position
   * 
   * @example
   * tooltip.show('<strong>Country:</strong> United States<br/><strong>Value:</strong> 1234 TWh', event);
   */
  show(content, event) {
    this.tooltip
      .style('visibility', 'visible')
      .html(content);
    
    this.updatePosition(event);
  }
  
  /**
   * Hide the tooltip
   * 
   * @example
   * tooltip.hide();
   */
  hide() {
    this.tooltip.style('visibility', 'hidden');
  }
  
  /**
   * Update tooltip position based on cursor location
   * Includes logic to prevent tooltip from going off-screen
   * 
   * Algorithm:
   * 1. Default position: offset right and up from cursor
   * 2. If tooltip would overflow right edge: flip to left of cursor
   * 3. If tooltip would overflow bottom edge: flip above cursor
   * 4. Ensure minimum offset from viewport edges
   * 
   * @param {MouseEvent} event - Mouse event object containing cursor position
   * 
   * @example
   * // Update position during mousemove for cursor-following behavior
   * chart.on('mousemove', function(event) {
   *   tooltip.updatePosition(event);
   * });
   */
  updatePosition(event) {
    const tooltipNode = this.tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    
    // Calculate default position (right and above cursor)
    let left = event.pageX + this.config.tooltip.offset.x;
    let top = event.pageY + this.config.tooltip.offset.y;
    
    // Prevent tooltip from going off-screen horizontally
    if (left + tooltipWidth > window.innerWidth) {
      // Flip to left of cursor if it would overflow right edge
      left = event.pageX - tooltipWidth - this.config.tooltip.offset.x;
    }
    
    // Ensure tooltip doesn't go off left edge
    if (left < 0) {
      left = 10; // Minimum 10px margin from left edge
    }
    
    // Prevent tooltip from going off-screen vertically
    if (top + tooltipHeight > window.innerHeight) {
      // Flip above cursor if it would overflow bottom edge
      top = event.pageY - tooltipHeight - Math.abs(this.config.tooltip.offset.y);
    }
    
    // Ensure tooltip doesn't go off top edge
    if (top < 0) {
      top = 10; // Minimum 10px margin from top edge
    }
    
    // Apply calculated position
    this.tooltip
      .style('left', left + 'px')
      .style('top', top + 'px');
  }
  
  /**
   * Format data object into consistent HTML content for tooltip
   * Helper method for creating standardized tooltip content
   * 
   * @param {Object} data - Key-value pairs to display in tooltip
   * @returns {string} Formatted HTML string
   * 
   * @example
   * const content = tooltip.formatContent({
   *   'Year': 2019,
   *   'Country': 'United States',
   *   'Energy': '12,345 TWh',
   *   'Emissions': '5,678 Mt CO₂'
   * });
   * tooltip.show(content, event);
   * // Displays:
   * // Year: 2019
   * // Country: United States
   * // Energy: 12,345 TWh
   * // Emissions: 5,678 Mt CO₂
   */
  formatContent(data) {
    return Object.entries(data)
      .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
      .join('<br/>');
  }
  
  /**
   * Remove the tooltip from the DOM
   * Call this when the component is being destroyed to clean up resources
   * 
   * @example
   * tooltip.remove();
   */
  remove() {
    this.tooltip.remove();
  }
  
  /**
   * Check if tooltip is currently visible
   * 
   * @returns {boolean} True if tooltip is visible, false otherwise
   * 
   * @example
   * if (tooltip.isVisible()) {
   *   console.log('Tooltip is currently showing');
   * }
   */
  isVisible() {
    return this.tooltip.style('visibility') === 'visible';
  }
  
  /**
   * Merge provided config with default config
   * @private
   * @param {Object} defaults - Default configuration
   * @param {Object} provided - Provided configuration
   * @returns {Object} Merged configuration
   */
  _mergeConfig(defaults, provided) {
    return {
      colors: {
        ...defaults.colors,
        ...(provided.colors || {})
      },
      tooltip: {
        offset: {
          ...defaults.tooltip.offset,
          ...(provided.tooltip?.offset || {})
        }
      }
    };
  }
}

/**
 * Export Tooltip class for use in chart modules
 */
export { Tooltip };
