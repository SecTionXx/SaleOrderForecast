/**
 * Button Component
 * A reusable button component with various styles and states
 */

import { BaseComponent } from './base/BaseComponent.js';
import { logDebug } from '../utils/logger.js';

/**
 * Button component that extends BaseComponent
 */
export class Button extends BaseComponent {
  /**
   * Create a new Button
   * @param {Object} options - Button options
   * @param {string} [options.text] - Button text
   * @param {string} [options.icon] - Material icon name
   * @param {string} [options.variant] - Button variant (primary, secondary, danger, etc.)
   * @param {string} [options.size] - Button size (sm, md, lg)
   * @param {boolean} [options.disabled] - Whether the button is disabled
   * @param {Function} [options.onClick] - Click handler
   * @param {string} [options.type] - Button type (button, submit, reset)
   * @param {string} [options.className] - Additional CSS classes
   * @param {Object} [options.attributes] - Additional HTML attributes
   */
  constructor({
    text = '',
    icon = '',
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick = null,
    type = 'button',
    className = '',
    attributes = {},
    ...rest
  } = {}) {
    super({
      className: `btn btn-${variant} btn-${size} ${className}`.trim(),
      attributes: {
        type,
        role: 'button',
        tabindex: '0',
        'aria-disabled': disabled ? 'true' : 'false',
        ...attributes
      },
      ...rest
    });
    
    this.text = text;
    this.icon = icon;
    this.variant = variant;
    this.size = size;
    this.disabled = disabled;
    this.onClick = onClick;
    
    // Initialize the button
    this.initialize();
  }
  
  /**
   * Initialize the button
   */
  initialize() {
    // Create button content
    this.createContent();
    
    // Set initial disabled state
    this.setDisabled(this.disabled);
    
    // Add click handler if provided
    if (this.onClick) {
      this.addListener('click', (e) => {
        if (!this.disabled) {
          this.onClick(e);
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
    
    // Add keyboard support
    this.addListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !this.disabled) {
        e.preventDefault();
        if (this.onClick) {
          this.onClick(e);
        }
      }
    });
  }
  
  /**
   * Create the button content
   */
  createContent() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add icon if provided
    if (this.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = 'material-icons';
      iconElement.textContent = this.icon;
      this.element.appendChild(iconElement);
    }
    
    // Add text if provided
    if (this.text) {
      const textElement = document.createElement('span');
      textElement.className = 'btn-text';
      textElement.textContent = this.text;
      this.element.appendChild(textElement);
    }
    
    // Add loading spinner (hidden by default)
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.innerHTML = '<span class="spinner"></span>';
    spinner.style.display = 'none';
    this.element.appendChild(spinner);
    
    // Store references to elements
    this.elements = {
      ...this.elements,
      icon: this.element.querySelector('.material-icons'),
      text: this.element.querySelector('.btn-text'),
      spinner: spinner
    };
  }
  
  /**
   * Set the button text
   * @param {string} text - New button text
   */
  setText(text) {
    this.text = text;
    if (this.elements.text) {
      this.elements.text.textContent = text;
    } else if (text) {
      // Create text element if it doesn't exist
      const textElement = document.createElement('span');
      textElement.className = 'btn-text';
      textElement.textContent = text;
      this.element.appendChild(textElement);
      this.elements.text = textElement;
    }
  }
  
  /**
   * Set the button icon
   * @param {string} icon - Material icon name
   */
  setIcon(icon) {
    this.icon = icon;
    if (this.elements.icon) {
      if (icon) {
        this.elements.icon.textContent = icon;
        this.elements.icon.style.display = '';
      } else {
        this.elements.icon.style.display = 'none';
      }
    } else if (icon) {
      // Create icon element if it doesn't exist
      const iconElement = document.createElement('span');
      iconElement.className = 'material-icons';
      iconElement.textContent = icon;
      this.element.insertBefore(iconElement, this.element.firstChild);
      this.elements.icon = iconElement;
    }
  }
  
  /**
   * Set the button variant
   * @param {string} variant - Button variant (primary, secondary, danger, etc.)
   */
  setVariant(variant) {
    // Remove existing variant classes
    this.removeClass(...Object.values(this.getVariantClasses()));
    
    // Add new variant class
    this.variant = variant;
    this.addClass(`btn-${variant}`);
  }
  
  /**
   * Set the button size
   * @param {string} size - Button size (sm, md, lg)
   */
  setSize(size) {
    // Remove existing size classes
    this.removeClass('btn-sm', 'btn-md', 'btn-lg');
    
    // Add new size class
    this.size = size;
    this.addClass(`btn-${size}`);
  }
  
  /**
   * Set the disabled state of the button
   * @param {boolean} disabled - Whether the button is disabled
   */
  setDisabled(disabled) {
    this.disabled = disabled;
    
    if (disabled) {
      this.element.setAttribute('aria-disabled', 'true');
      this.element.setAttribute('tabindex', '-1');
      this.addClass('disabled');
    } else {
      this.element.setAttribute('aria-disabled', 'false');
      this.element.setAttribute('tabindex', '0');
      this.removeClass('disabled');
    }
  }
  
  /**
   * Set the loading state of the button
   * @param {boolean} isLoading - Whether the button is in a loading state
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.addClass('loading');
      this.elements.spinner.style.display = '';
      this.element.setAttribute('aria-busy', 'true');
    } else {
      this.removeClass('loading');
      this.elements.spinner.style.display = 'none';
      this.element.setAttribute('aria-busy', 'false');
    }
  }
  
  /**
   * Get the variant classes for the button
   * @returns {Object} Variant classes
   * @private
   */
  getVariantClasses() {
    return {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      danger: 'btn-danger',
      warning: 'btn-warning',
      info: 'btn-info',
      light: 'btn-light',
      dark: 'btn-dark',
      link: 'btn-link'
    };
  }
  
  /**
   * Clean up the button
   */
  destroy() {
    // Clean up event listeners
    this.removeAllListeners();
    
    // Call parent destroy
    super.destroy();
  }
}

// Export a convenience function to create buttons
export function createButton(options) {
  return new Button(options);
}
