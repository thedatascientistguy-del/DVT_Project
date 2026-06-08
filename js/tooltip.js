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
      .style('position', 'fixed') // Changed to fixed positioning
      .style('display', 'none') // Initially hidden
      .style('opacity', '0')
      .style('background-color', 'white')
      .style('color', '#1f2937')
      .style('border', '3px solid #3b82f6')
      .style('border-radius', '8px')
      .style('padding', '12px 16px')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.1)')
      .style('max-width', '320px')
      .style('line-height', '1.6')
      .style('transition', 'opacity 0.2s ease')
      .style('left', '0px')
      .style('top', '0px');
    
    console.log('Tooltip instance created'); // Debug log
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
    console.log('Tooltip show called with content:', content); // Debug log
    
    this.tooltip
      .style('display', 'block') // Ensure it's displayed
      .style('opacity', '1')
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
    console.log('Tooltip hide called'); // Debug log
    this.tooltip
      .style('opacity', '0')
      .style('display', 'none');
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
    
    // Use clientX/clientY for fixed positioning (relative to viewport)
    let left = event.clientX + this.config.tooltip.offset.x;
    let top = event.clientY + this.config.tooltip.offset.y;
    
    console.log('Tooltip position - left:', left, 'top:', top, 'width:', tooltipWidth, 'height:', tooltipHeight); // Debug log
    
    // Prevent tooltip from going off-screen horizontally
    if (left + tooltipWidth > window.innerWidth) {
      // Flip to left of cursor if it would overflow right edge
      left = event.clientX - tooltipWidth - this.config.tooltip.offset.x;
    }
    
    // Ensure tooltip doesn't go off left edge
    if (left < 0) {
      left = 10; // Minimum 10px margin from left edge
    }
    
    // Prevent tooltip from going off-screen vertically
    if (top + tooltipHeight > window.innerHeight) {
      // Flip above cursor if it would overflow bottom edge
      top = event.clientY - tooltipHeight - Math.abs(this.config.tooltip.offset.y);
    }
    
    // Ensure tooltip doesn't go off top edge
    if (top < 0) {
      top = 10; // Minimum 10px margin from top edge
    }
    
    // Apply calculated position
    this.tooltip
      .style('left', left + 'px')
      .style('top', top + 'px');
      
    console.log('Final tooltip position - left:', left + 'px', 'top:', top + 'px'); // Debug log
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
    return this.tooltip.style('opacity') !== '0';
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
