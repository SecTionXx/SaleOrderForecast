// dashboardCustomization.js - Provides dashboard customization capabilities

/**
 * Initialize dashboard customization features
 */
function initializeDashboardCustomization() {
  console.log('Initializing dashboard customization features...');
  
  // Initialize chart section reordering
  initializeChartReordering();
  
  // Initialize collapsible sections
  initializeCollapsibleSections();
  
  // Initialize user preferences
  initializeUserPreferences();
  
  // Load saved dashboard layout
  loadSavedDashboardLayout();
}

/**
 * Initialize chart section reordering functionality
 */
function initializeChartReordering() {
  const chartSection = document.querySelector('.mb-8');
  if (!chartSection) return;
  
  // Add drag handles to each chart container
  const chartContainers = chartSection.querySelectorAll('.chart-container');
  chartContainers.forEach((container, index) => {
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i data-feather="move"></i>';
    dragHandle.title = 'Drag to reorder';
    
    // Add chart actions container if it doesn't exist
    let actionsContainer = container.querySelector('.chart-actions');
    if (!actionsContainer) {
      actionsContainer = document.createElement('div');
      actionsContainer.className = 'chart-actions';
      container.insertBefore(actionsContainer, container.firstChild);
    }
    
    // Add collapse button
    const collapseButton = document.createElement('button');
    collapseButton.className = 'chart-collapse-btn';
    collapseButton.innerHTML = '<i data-feather="chevron-up"></i>';
    collapseButton.title = 'Collapse/Expand';
    collapseButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleChartCollapse(container);
    });
    
    // Add actions to container
    actionsContainer.appendChild(dragHandle);
    actionsContainer.appendChild(collapseButton);
    
    // Make container draggable
    container.setAttribute('draggable', 'true');
    container.dataset.chartIndex = index.toString();
    
    // Add drag event listeners
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);
  });
  
  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

// Drag and drop event handlers
let draggedItem = null;

function handleDragStart(e) {
  this.classList.add('dragging');
  draggedItem = this;
  
  // Set the drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.chartIndex);
  
  // Add dragging class to all potential drop targets
  document.querySelectorAll('.chart-container').forEach(container => {
    if (container !== this) {
      container.classList.add('drop-target');
    }
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary to allow dropping
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation(); // Stops some browsers from redirecting
  e.preventDefault();
  
  // Don't do anything if dropping on the same element
  if (draggedItem === this) {
    return false;
  }
  
  // Get the source and target indices
  const sourceIndex = parseInt(draggedItem.dataset.chartIndex);
  const targetIndex = parseInt(this.dataset.chartIndex);
  
  // Perform the reordering
  reorderCharts(sourceIndex, targetIndex);
  
  return false;
}

function handleDragEnd(e) {
  // Remove all drag-related classes
  this.classList.remove('dragging');
  document.querySelectorAll('.chart-container').forEach(container => {
    container.classList.remove('drag-over');
    container.classList.remove('drop-target');
  });
  
  // Save the new layout
  saveDashboardLayout();
}

/**
 * Reorder chart containers based on drag and drop
 * @param {number} sourceIndex - The index of the dragged chart
 * @param {number} targetIndex - The index of the drop target
 */
function reorderCharts(sourceIndex, targetIndex) {
  const chartSection = document.querySelector('.mb-8');
  const chartContainers = Array.from(chartSection.querySelectorAll('.chart-container'));
  
  // Remove the dragged element
  const draggedElement = chartContainers[sourceIndex];
  chartSection.removeChild(draggedElement);
  
  // Insert at the new position
  const targetElement = chartContainers[targetIndex];
  if (sourceIndex < targetIndex) {
    // Insert after target if moving forward
    chartSection.insertBefore(draggedElement, targetElement.nextSibling);
  } else {
    // Insert before target if moving backward
    chartSection.insertBefore(draggedElement, targetElement);
  }
  
  // Update data-chart-index attributes
  chartSection.querySelectorAll('.chart-container').forEach((container, index) => {
    container.dataset.chartIndex = index.toString();
  });
}

/**
 * Toggle chart collapse state
 * @param {HTMLElement} chartContainer - The chart container to toggle
 */
function toggleChartCollapse(chartContainer) {
  const chartContent = chartContainer.querySelector('div:not(.chart-title):not(.chart-actions)');
  const collapseButton = chartContainer.querySelector('.chart-collapse-btn i');
  
  if (chartContent) {
    if (chartContent.style.display === 'none') {
      // Expand
      chartContent.style.display = '';
      collapseButton.setAttribute('data-feather', 'chevron-up');
      chartContainer.classList.remove('collapsed');
    } else {
      // Collapse
      chartContent.style.display = 'none';
      collapseButton.setAttribute('data-feather', 'chevron-down');
      chartContainer.classList.add('collapsed');
    }
    
    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
    
    // Save collapse state
    saveDashboardLayout();
  }
}

/**
 * Initialize collapsible sections
 */
function initializeCollapsibleSections() {
  // Add collapse buttons to major sections
  const sections = [
    { selector: '.summary-cards-grid', title: 'Summary Cards' },
    { selector: '.mb-8', title: 'Charts' },
    { selector: 'section:last-child', title: 'Data Table' }
  ];
  
  sections.forEach(section => {
    const sectionElement = document.querySelector(section.selector);
    if (!sectionElement) return;
    
    // Create section header if it doesn't exist
    let sectionHeader = sectionElement.querySelector('.section-header');
    if (!sectionHeader) {
      sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      
      const sectionTitle = document.createElement('h2');
      sectionTitle.className = 'section-title';
      sectionTitle.textContent = section.title;
      
      sectionHeader.appendChild(sectionTitle);
      sectionElement.insertBefore(sectionHeader, sectionElement.firstChild);
    }
    
    // Add collapse button if it doesn't exist
    let collapseButton = sectionHeader.querySelector('.section-collapse-btn');
    if (!collapseButton) {
      collapseButton = document.createElement('button');
      collapseButton.className = 'section-collapse-btn';
      collapseButton.innerHTML = '<i data-feather="chevron-up"></i>';
      collapseButton.title = 'Collapse/Expand Section';
      
      collapseButton.addEventListener('click', () => {
        toggleSectionCollapse(sectionElement, collapseButton);
      });
      
      sectionHeader.appendChild(collapseButton);
    }
  });
  
  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

/**
 * Toggle section collapse state
 * @param {HTMLElement} section - The section to toggle
 * @param {HTMLElement} button - The collapse button
 */
function toggleSectionCollapse(section, button) {
  const content = Array.from(section.children).filter(child => 
    !child.classList.contains('section-header')
  );
  
  const icon = button.querySelector('i');
  
  if (section.classList.contains('collapsed')) {
    // Expand
    content.forEach(element => {
      element.style.display = '';
    });
    icon.setAttribute('data-feather', 'chevron-up');
    section.classList.remove('collapsed');
  } else {
    // Collapse
    content.forEach(element => {
      element.style.display = 'none';
    });
    icon.setAttribute('data-feather', 'chevron-down');
    section.classList.add('collapsed');
  }
  
  // Update feather icons
  if (window.feather) {
    window.feather.replace();
  }
  
  // Save collapse state
  saveDashboardLayout();
}

/**
 * Initialize user preferences
 */
function initializeUserPreferences() {
  // Create preferences button in navbar
  const navbarActions = document.querySelector('.navbar-actions');
  if (!navbarActions) return;
  
  // Add preferences button if it doesn't exist
  let preferencesButton = document.getElementById('preferences-btn');
  if (!preferencesButton) {
    preferencesButton = document.createElement('button');
    preferencesButton.id = 'preferences-btn';
    preferencesButton.className = 'preferences-btn';
    preferencesButton.innerHTML = '<i data-feather="settings"></i><span>Preferences</span>';
    
    preferencesButton.addEventListener('click', showPreferencesModal);
    
    // Insert before logout button
    const logoutButton = navbarActions.querySelector('.logout-btn');
    if (logoutButton) {
      navbarActions.insertBefore(preferencesButton, logoutButton);
    } else {
      navbarActions.appendChild(preferencesButton);
    }
  }
  
  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

/**
 * Show preferences modal
 */
function showPreferencesModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('preferences-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preferences-modal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content preferences-modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Dashboard Preferences';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Theme preference
    const themeSection = document.createElement('div');
    themeSection.className = 'preference-section';
    
    const themeLabel = document.createElement('h3');
    themeLabel.textContent = 'Theme';
    
    const themeOptions = document.createElement('div');
    themeOptions.className = 'theme-options';
    
    const themes = [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
      { id: 'system', name: 'System Default' }
    ];
    
    themes.forEach(theme => {
      const themeOption = document.createElement('div');
      themeOption.className = 'theme-option';
      
      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = 'theme';
      radioInput.id = `theme-${theme.id}`;
      radioInput.value = theme.id;
      
      // Set checked based on current theme
      const currentTheme = localStorage.getItem('orderforecast_theme') || 'light';
      if (theme.id === currentTheme) {
        radioInput.checked = true;
      }
      
      radioInput.addEventListener('change', () => {
        if (radioInput.checked) {
          setThemePreference(theme.id);
        }
      });
      
      const radioLabel = document.createElement('label');
      radioLabel.htmlFor = `theme-${theme.id}`;
      radioLabel.textContent = theme.name;
      
      themeOption.appendChild(radioInput);
      themeOption.appendChild(radioLabel);
      themeOptions.appendChild(themeOption);
    });
    
    themeSection.appendChild(themeLabel);
    themeSection.appendChild(themeOptions);
    
    // Default view preference
    const viewSection = document.createElement('div');
    viewSection.className = 'preference-section';
    
    const viewLabel = document.createElement('h3');
    viewLabel.textContent = 'Default View';
    
    const viewOptions = document.createElement('div');
    viewOptions.className = 'view-options';
    
    const views = [
      { id: 'full', name: 'Full Dashboard' },
      { id: 'charts', name: 'Charts Only' },
      { id: 'table', name: 'Table Only' }
    ];
    
    views.forEach(view => {
      const viewOption = document.createElement('div');
      viewOption.className = 'view-option';
      
      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = 'default-view';
      radioInput.id = `view-${view.id}`;
      radioInput.value = view.id;
      
      // Set checked based on current default view
      const currentView = localStorage.getItem('orderforecast_default_view') || 'full';
      if (view.id === currentView) {
        radioInput.checked = true;
      }
      
      radioInput.addEventListener('change', () => {
        if (radioInput.checked) {
          setDefaultViewPreference(view.id);
        }
      });
      
      const radioLabel = document.createElement('label');
      radioLabel.htmlFor = `view-${view.id}`;
      radioLabel.textContent = view.name;
      
      viewOption.appendChild(radioInput);
      viewOption.appendChild(radioLabel);
      viewOptions.appendChild(viewOption);
    });
    
    viewSection.appendChild(viewLabel);
    viewSection.appendChild(viewOptions);
    
    // Chart color scheme preference
    const colorSection = document.createElement('div');
    colorSection.className = 'preference-section';
    
    const colorLabel = document.createElement('h3');
    colorLabel.textContent = 'Chart Color Scheme';
    
    const colorOptions = document.createElement('div');
    colorOptions.className = 'color-options';
    
    const colorSchemes = [
      { id: 'default', name: 'Default' },
      { id: 'pastel', name: 'Pastel' },
      { id: 'vibrant', name: 'Vibrant' },
      { id: 'monochrome', name: 'Monochrome' }
    ];
    
    colorSchemes.forEach(scheme => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      
      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = 'color-scheme';
      radioInput.id = `color-${scheme.id}`;
      radioInput.value = scheme.id;
      
      // Set checked based on current color scheme
      const currentScheme = localStorage.getItem('orderforecast_color_scheme') || 'default';
      if (scheme.id === currentScheme) {
        radioInput.checked = true;
      }
      
      radioInput.addEventListener('change', () => {
        if (radioInput.checked) {
          setColorSchemePreference(scheme.id);
        }
      });
      
      const radioLabel = document.createElement('label');
      radioLabel.htmlFor = `color-${scheme.id}`;
      radioLabel.textContent = scheme.name;
      
      // Add color preview
      const colorPreview = document.createElement('div');
      colorPreview.className = `color-preview ${scheme.id}`;
      
      colorOption.appendChild(radioInput);
      colorOption.appendChild(radioLabel);
      colorOption.appendChild(colorPreview);
      colorOptions.appendChild(colorOption);
    });
    
    colorSection.appendChild(colorLabel);
    colorSection.appendChild(colorOptions);
    
    // Reset button
    const resetSection = document.createElement('div');
    resetSection.className = 'preference-section reset-section';
    
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-preferences-btn';
    resetButton.textContent = 'Reset to Defaults';
    resetButton.addEventListener('click', resetPreferences);
    
    resetSection.appendChild(resetButton);
    
    // Add sections to modal body
    modalBody.appendChild(themeSection);
    modalBody.appendChild(viewSection);
    modalBody.appendChild(colorSection);
    modalBody.appendChild(resetSection);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Show modal
  modal.style.display = 'block';
}

/**
 * Set theme preference
 * @param {string} theme - The theme to set
 */
function setThemePreference(theme) {
  localStorage.setItem('orderforecast_theme', theme);
  
  // Apply theme
  document.body.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
  } else {
    document.body.classList.add(`theme-${theme}`);
  }
}

/**
 * Set default view preference
 * @param {string} view - The default view to set
 */
function setDefaultViewPreference(view) {
  localStorage.setItem('orderforecast_default_view', view);
  
  // Apply default view on next load
  // (We don't switch the current view to avoid disrupting the user)
}

/**
 * Set color scheme preference
 * @param {string} scheme - The color scheme to set
 */
function setColorSchemePreference(scheme) {
  localStorage.setItem('orderforecast_color_scheme', scheme);
  
  // Apply color scheme to charts
  // This would typically require reinitializing the charts with the new colors
  // For now, we'll just store the preference and apply it on next load
  alert('Color scheme will be applied when you refresh the page');
}

/**
 * Reset all preferences to defaults
 */
function resetPreferences() {
  if (confirm('Are you sure you want to reset all preferences to defaults?')) {
    // Clear all preference items
    localStorage.removeItem('orderforecast_theme');
    localStorage.removeItem('orderforecast_default_view');
    localStorage.removeItem('orderforecast_color_scheme');
    localStorage.removeItem('orderforecast_dashboard_layout');
    
    // Apply defaults
    setThemePreference('light');
    
    // Reload page to apply all defaults
    window.location.reload();
  }
}

/**
 * Save current dashboard layout
 */
function saveDashboardLayout() {
  // Create layout object
  const layout = {
    chartOrder: [],
    collapsedCharts: [],
    collapsedSections: []
  };
  
  // Save chart order
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach((container, index) => {
    // Store chart ID or title as identifier
    const chartTitle = container.querySelector('.chart-title')?.textContent || `Chart ${index}`;
    const chartId = container.id || `chart-${index}`;
    
    layout.chartOrder.push({
      id: chartId,
      title: chartTitle,
      originalIndex: parseInt(container.dataset.originalIndex || index)
    });
    
    // Store collapse state
    if (container.classList.contains('collapsed')) {
      layout.collapsedCharts.push(chartId);
    }
  });
  
  // Save section collapse states
  const sections = [
    { selector: '.summary-cards-grid', id: 'summary' },
    { selector: '.mb-8', id: 'charts' },
    { selector: 'section:last-child', id: 'table' }
  ];
  
  sections.forEach(section => {
    const sectionElement = document.querySelector(section.selector);
    if (sectionElement && sectionElement.classList.contains('collapsed')) {
      layout.collapsedSections.push(section.id);
    }
  });
  
  // Save to localStorage
  localStorage.setItem('orderforecast_dashboard_layout', JSON.stringify(layout));
}

/**
 * Load saved dashboard layout
 */
function loadSavedDashboardLayout() {
  // Get saved layout
  const savedLayout = localStorage.getItem('orderforecast_dashboard_layout');
  if (!savedLayout) return;
  
  try {
    const layout = JSON.parse(savedLayout);
    
    // Apply chart order
    if (layout.chartOrder && layout.chartOrder.length > 0) {
      const chartSection = document.querySelector('.mb-8');
      const chartContainers = Array.from(chartSection.querySelectorAll('.chart-container'));
      
      // Store original indices
      chartContainers.forEach((container, index) => {
        container.dataset.originalIndex = index.toString();
      });
      
      // Sort containers according to saved order
      const sortedContainers = [];
      layout.chartOrder.forEach(chartInfo => {
        // Find the chart by ID or by original index
        let chart = document.getElementById(chartInfo.id);
        if (!chart) {
          chart = chartContainers.find(c => parseInt(c.dataset.originalIndex) === chartInfo.originalIndex);
        }
        
        if (chart) {
          sortedContainers.push(chart);
          chartSection.removeChild(chart);
        }
      });
      
      // Add any charts that weren't in the saved layout
      chartContainers.forEach(container => {
        if (document.body.contains(container)) {
          sortedContainers.push(container);
          chartSection.removeChild(container);
        }
      });
      
      // Add all charts back in the correct order
      sortedContainers.forEach((container, index) => {
        chartSection.appendChild(container);
        container.dataset.chartIndex = index.toString();
      });
    }
    
    // Apply chart collapse states
    if (layout.collapsedCharts && layout.collapsedCharts.length > 0) {
      layout.collapsedCharts.forEach(chartId => {
        const chart = document.getElementById(chartId);
        if (chart) {
          const chartContent = chart.querySelector('div:not(.chart-title):not(.chart-actions)');
          const collapseButton = chart.querySelector('.chart-collapse-btn i');
          
          if (chartContent && collapseButton) {
            chartContent.style.display = 'none';
            collapseButton.setAttribute('data-feather', 'chevron-down');
            chart.classList.add('collapsed');
          }
        }
      });
    }
    
    // Apply section collapse states
    if (layout.collapsedSections && layout.collapsedSections.length > 0) {
      const sections = [
        { id: 'summary', selector: '.summary-cards-grid' },
        { id: 'charts', selector: '.mb-8' },
        { id: 'table', selector: 'section:last-child' }
      ];
      
      layout.collapsedSections.forEach(sectionId => {
        const sectionInfo = sections.find(s => s.id === sectionId);
        if (sectionInfo) {
          const section = document.querySelector(sectionInfo.selector);
          const button = section?.querySelector('.section-collapse-btn');
          
          if (section && button) {
            toggleSectionCollapse(section, button);
          }
        }
      });
    }
    
    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  } catch (error) {
    console.error('Error loading dashboard layout:', error);
  }
}

// Apply theme based on preference when script loads
function applyInitialTheme() {
  const theme = localStorage.getItem('orderforecast_theme') || 'light';
  setThemePreference(theme);
}

// Apply initial theme
applyInitialTheme();

// Make functions available globally instead of using ES6 exports
window.initializeDashboardCustomization = initializeDashboardCustomization;
window.showPreferencesModal = showPreferencesModal;
window.setThemePreference = setThemePreference;
window.setDefaultViewPreference = setDefaultViewPreference;
window.setColorSchemePreference = setColorSchemePreference;
window.resetPreferences = resetPreferences;
// End of dashboardCustomization.js - No exports should be used in this file
