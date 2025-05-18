/**
 * Components Module
 * Exports all UI components for easier importing
 */

// Base Components
export { BaseComponent } from './base/BaseComponent.js';

// UI Components
export { Button, createButton } from './Button.js';
export { Modal, createModal } from './Modal.js';
export { Table, createTable } from './Table.js';

// Export all components as a single object for convenience
import * as components from './exports.js';
export default components;
