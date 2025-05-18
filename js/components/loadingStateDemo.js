/**
 * loadingStateDemo.js - Loading States and Transitions Demo
 * Demonstrates the various loading states and transitions available in the application
 */

import { 
  globalLoadingManager, 
  createButtonLoadingState, 
  createFormLoadingState,
  createApiLoadingManager,
  createSectionTransition
} from '../utils/loadingStateManager.js';
import { logDebug } from '../utils/logger.js';

/**
 * Initialize loading states demo
 * @param {string} containerId - Container element ID
 */
export function initLoadingStatesDemo(containerId = 'loading-states-demo') {
  const container = document.getElementById(containerId);
  
  if (!container) {
    logDebug('Loading states demo container not found:', containerId);
    return;
  }
  
  // Create demo sections
  createButtonLoadingDemo(container);
  createElementLoadingDemo(container);
  createFormLoadingDemo(container);
  createTransitionDemo(container);
  createSkeletonLoadingDemo(container);
}

/**
 * Create button loading demo
 * @param {HTMLElement} container - Container element
 */
function createButtonLoadingDemo(container) {
  // Create section
  const section = document.createElement('div');
  section.className = 'demo-section';
  section.innerHTML = `
    <h3>Button Loading States</h3>
    <div class="button-group">
      <button id="demo-button-1" class="btn btn-primary">Simple Loading</button>
      <button id="demo-button-2" class="btn btn-secondary">Loading with Text</button>
      <button id="demo-button-3" class="btn btn-success">Async Operation</button>
    </div>
  `;
  
  container.appendChild(section);
  
  // Set up button 1 (simple loading)
  const button1 = document.getElementById('demo-button-1');
  const button1Loading = createButtonLoadingState(button1);
  
  button1.addEventListener('click', () => {
    button1Loading.setLoading(true);
    
    setTimeout(() => {
      button1Loading.setLoading(false);
    }, 2000);
  });
  
  // Set up button 2 (loading with text)
  const button2 = document.getElementById('demo-button-2');
  const button2Loading = createButtonLoadingState(button2, {
    loadingText: 'Processing...'
  });
  
  button2.addEventListener('click', () => {
    button2Loading.setLoading(true);
    
    setTimeout(() => {
      button2Loading.setLoading(false);
    }, 2000);
  });
  
  // Set up button 3 (async operation)
  const button3 = document.getElementById('demo-button-3');
  const button3Loading = createButtonLoadingState(button3);
  
  button3.addEventListener('click', button3Loading.withLoading(async () => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'Operation completed';
  }));
}

/**
 * Create element loading demo
 * @param {HTMLElement} container - Container element
 */
function createElementLoadingDemo(container) {
  // Create section
  const section = document.createElement('div');
  section.className = 'demo-section';
  section.innerHTML = `
    <h3>Element Loading States</h3>
    <div class="demo-cards">
      <div id="demo-card-1" class="demo-card">
        <h4>Loading Overlay</h4>
        <p>Click to show loading overlay</p>
      </div>
      <div id="demo-card-2" class="demo-card">
        <h4>Error State</h4>
        <p>Click to show error state</p>
      </div>
      <div id="demo-card-3" class="demo-card">
        <h4>Success State</h4>
        <p>Click to show success state</p>
      </div>
    </div>
  `;
  
  container.appendChild(section);
  
  // Set up card 1 (loading overlay)
  const card1 = document.getElementById('demo-card-1');
  
  card1.addEventListener('click', () => {
    const loading = globalLoadingManager.setLoading(card1, true, 'Loading data...');
    
    setTimeout(() => {
      loading.setLoading(false);
    }, 2000);
  });
  
  // Set up card 2 (error state)
  const card2 = document.getElementById('demo-card-2');
  
  card2.addEventListener('click', () => {
    globalLoadingManager.showError(card2, 'Failed to load data. Please try again.');
  });
  
  // Set up card 3 (success state)
  const card3 = document.getElementById('demo-card-3');
  
  card3.addEventListener('click', () => {
    globalLoadingManager.showSuccess(card3, 'Data loaded successfully!');
  });
}

/**
 * Create form loading demo
 * @param {HTMLElement} container - Container element
 */
function createFormLoadingDemo(container) {
  // Create section
  const section = document.createElement('div');
  section.className = 'demo-section';
  section.innerHTML = `
    <h3>Form Loading States</h3>
    <form id="demo-form" class="demo-form">
      <div class="form-group">
        <label for="demo-input">Input Field</label>
        <input type="text" id="demo-input" class="form-control" placeholder="Enter some text">
      </div>
      <div class="form-group">
        <label for="demo-select">Select Field</label>
        <select id="demo-select" class="form-control">
          <option value="">Select an option</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </select>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">Submit Form</button>
      </div>
    </form>
  `;
  
  container.appendChild(section);
  
  // Set up form
  const form = document.getElementById('demo-form');
  const formLoading = createFormLoadingState(form, {
    loadingMessage: 'Submitting form...',
    successMessage: 'Form submitted successfully!',
    errorMessage: 'Form submission failed. Please try again.',
    resetFormOnSuccess: true
  });
  
  form.addEventListener('submit', formLoading.withLoading(async (event) => {
    event.preventDefault();
    
    // Simulate form submission
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail
        if (Math.random() > 0.3) {
          resolve();
        } else {
          reject(new Error('Network error occurred'));
        }
      }, 2000);
    });
  }));
}

/**
 * Create transition demo
 * @param {HTMLElement} container - Container element
 */
function createTransitionDemo(container) {
  // Create section
  const section = document.createElement('div');
  section.className = 'demo-section';
  section.innerHTML = `
    <h3>Section Transitions</h3>
    <div class="transition-controls">
      <button id="transition-fade" class="btn btn-outline-primary">Fade</button>
      <button id="transition-slide" class="btn btn-outline-primary">Slide</button>
      <button id="transition-slide-up" class="btn btn-outline-primary">Slide Up</button>
    </div>
    <div id="transition-container" class="transition-container">
      <div id="section-1" class="section active">
        <h4>Section 1</h4>
        <p>This is the first section content.</p>
      </div>
      <div id="section-2" class="section">
        <h4>Section 2</h4>
        <p>This is the second section content.</p>
      </div>
      <div id="section-3" class="section">
        <h4>Section 3</h4>
        <p>This is the third section content.</p>
      </div>
    </div>
  `;
  
  container.appendChild(section);
  
  // Create section transition controller
  const transitionContainer = document.getElementById('transition-container');
  const sectionTransition = createSectionTransition(transitionContainer, {
    sectionSelector: '.section',
    activeClass: 'active',
    transitionDuration: 300,
    defaultTransition: 'fade'
  });
  
  // Set up transition buttons
  const fadeButton = document.getElementById('transition-fade');
  const slideButton = document.getElementById('transition-slide');
  const slideUpButton = document.getElementById('transition-slide-up');
  
  // Track current section
  let currentSectionIndex = 1;
  
  fadeButton.addEventListener('click', () => {
    currentSectionIndex = (currentSectionIndex % 3) + 1;
    sectionTransition.showSection(`#section-${currentSectionIndex}`, 'fade');
  });
  
  slideButton.addEventListener('click', () => {
    currentSectionIndex = (currentSectionIndex % 3) + 1;
    sectionTransition.showSection(`#section-${currentSectionIndex}`, 'slide');
  });
  
  slideUpButton.addEventListener('click', () => {
    currentSectionIndex = (currentSectionIndex % 3) + 1;
    sectionTransition.showSection(`#section-${currentSectionIndex}`, 'slideUp');
  });
}

/**
 * Create skeleton loading demo
 * @param {HTMLElement} container - Container element
 */
function createSkeletonLoadingDemo(container) {
  // Create section
  const section = document.createElement('div');
  section.className = 'demo-section';
  section.innerHTML = `
    <h3>Skeleton Loading</h3>
    <button id="toggle-skeleton" class="btn btn-primary">Toggle Skeleton</button>
    <div id="skeleton-container" class="skeleton-container">
      <div id="skeleton-content" class="skeleton-content">
        <h4>Content Title</h4>
        <p>This is the actual content that will be shown after loading.</p>
        <p>It contains multiple paragraphs of information.</p>
        <div class="content-image">
          <img src="https://via.placeholder.com/300x200" alt="Content image">
        </div>
      </div>
      <div id="skeleton-loading" class="skeleton-loading" style="display: none;">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-rectangle"></div>
      </div>
    </div>
  `;
  
  container.appendChild(section);
  
  // Set up toggle button
  const toggleButton = document.getElementById('toggle-skeleton');
  const skeletonContent = document.getElementById('skeleton-content');
  const skeletonLoading = document.getElementById('skeleton-loading');
  
  toggleButton.addEventListener('click', () => {
    const isLoading = skeletonLoading.style.display !== 'none';
    
    if (isLoading) {
      // Show content
      skeletonLoading.style.display = 'none';
      skeletonContent.style.display = 'block';
    } else {
      // Show skeleton
      skeletonLoading.style.display = 'block';
      skeletonContent.style.display = 'none';
      
      // Automatically switch back after 2 seconds
      setTimeout(() => {
        skeletonLoading.style.display = 'none';
        skeletonContent.style.display = 'block';
      }, 2000);
    }
  });
}
