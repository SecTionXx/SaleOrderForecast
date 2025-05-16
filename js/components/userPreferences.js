// userPreferences.js - User preferences modal and settings management

/**
 * Initialize user preferences functionality
 */
function initializeUserPreferences() {
  // Add preferences button to the header
  addPreferencesButton();
  
  // Load saved preferences
  loadUserPreferences();
  
  // Apply initial theme
  applyTheme(getUserPreference('theme', 'light'));
}

/**
 * Add preferences button to the header
 */
function addPreferencesButton() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  
  const preferencesButton = document.createElement('button');
  preferencesButton.className = 'btn btn-sm btn-outline-secondary ml-2';
  preferencesButton.innerHTML = '<i data-feather="settings"></i> Preferences';
  preferencesButton.addEventListener('click', showPreferencesModal);
  
  headerActions.appendChild(preferencesButton);
  
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
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Dashboard Preferences</h2>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <div class="preferences-section">
            <h3>Theme</h3>
            <div class="preference-options">
              <label class="preference-option">
                <input type="radio" name="theme" value="light">
                <span class="option-label">Light</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="theme" value="dark">
                <span class="option-label">Dark</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="theme" value="system">
                <span class="option-label">System</span>
              </label>
            </div>
          </div>
          
          <div class="preferences-section">
            <h3>Default View</h3>
            <div class="preference-options">
              <label class="preference-option">
                <input type="radio" name="defaultView" value="charts">
                <span class="option-label">Charts</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="defaultView" value="table">
                <span class="option-label">Table</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="defaultView" value="combined">
                <span class="option-label">Combined</span>
              </label>
            </div>
          </div>
          
          <div class="preferences-section">
            <h3>Color Scheme</h3>
            <div class="preference-options">
              <label class="preference-option">
                <input type="radio" name="colorScheme" value="default">
                <span class="option-label">Default</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="colorScheme" value="pastel">
                <span class="option-label">Pastel</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="colorScheme" value="vibrant">
                <span class="option-label">Vibrant</span>
              </label>
              <label class="preference-option">
                <input type="radio" name="colorScheme" value="monochrome">
                <span class="option-label">Monochrome</span>
              </label>
            </div>
          </div>
          
          <div class="preferences-actions">
            <button id="reset-preferences" class="btn btn-outline-secondary">Reset to Defaults</button>
            <button id="save-preferences" class="btn btn-primary">Save Preferences</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up event listeners
    const closeButton = modal.querySelector('.close');
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    const saveButton = modal.querySelector('#save-preferences');
    saveButton.addEventListener('click', saveUserPreferences);
    
    const resetButton = modal.querySelector('#reset-preferences');
    resetButton.addEventListener('click', resetPreferences);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Load current preferences into form
  loadPreferencesIntoForm();
  
  // Show modal
  modal.style.display = 'block';
}

/**
 * Load user preferences into the form
 */
function loadPreferencesIntoForm() {
  const theme = getUserPreference('theme', 'light');
  const defaultView = getUserPreference('defaultView', 'charts');
  const colorScheme = getUserPreference('colorScheme', 'default');
  
  // Set radio button values
  document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
  document.querySelector(`input[name="defaultView"][value="${defaultView}"]`).checked = true;
  document.querySelector(`input[name="colorScheme"][value="${colorScheme}"]`).checked = true;
}

/**
 * Save user preferences from form
 */
function saveUserPreferences() {
  const theme = document.querySelector('input[name="theme"]:checked').value;
  const defaultView = document.querySelector('input[name="defaultView"]:checked').value;
  const colorScheme = document.querySelector('input[name="colorScheme"]:checked').value;
  
  // Save preferences
  setUserPreference('theme', theme);
  setUserPreference('defaultView', defaultView);
  setUserPreference('colorScheme', colorScheme);
  
  // Apply preferences
  applyTheme(theme);
  applyDefaultView(defaultView);
  applyColorScheme(colorScheme);
  
  // Close modal
  document.getElementById('preferences-modal').style.display = 'none';
  
  // Show confirmation message
  showToast('Preferences saved successfully');
}

/**
 * Reset preferences to defaults
 */
function resetPreferences() {
  // Set default values
  setUserPreference('theme', 'light');
  setUserPreference('defaultView', 'charts');
  setUserPreference('colorScheme', 'default');
  
  // Reload form
  loadPreferencesIntoForm();
  
  // Apply defaults
  applyTheme('light');
  applyDefaultView('charts');
  applyColorScheme('default');
  
  // Show confirmation message
  showToast('Preferences reset to defaults');
}

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences() {
  const theme = getUserPreference('theme', 'light');
  const defaultView = getUserPreference('defaultView', 'charts');
  const colorScheme = getUserPreference('colorScheme', 'default');
  
  // Apply preferences
  applyTheme(theme);
  applyDefaultView(defaultView);
  applyColorScheme(colorScheme);
}

/**
 * Get user preference from localStorage
 * @param {string} key - Preference key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Preference value
 */
function getUserPreference(key, defaultValue) {
  const preferences = JSON.parse(localStorage.getItem('orderforecast_preferences') || '{}');
  return preferences[key] !== undefined ? preferences[key] : defaultValue;
}

/**
 * Set user preference in localStorage
 * @param {string} key - Preference key
 * @param {string} value - Preference value
 */
function setUserPreference(key, value) {
  const preferences = JSON.parse(localStorage.getItem('orderforecast_preferences') || '{}');
  preferences[key] = value;
  localStorage.setItem('orderforecast_preferences', JSON.stringify(preferences));
}

/**
 * Apply theme preference
 * @param {string} theme - Theme to apply (light, dark, system)
 */
function applyTheme(theme) {
  const body = document.body;
  
  // Remove existing theme classes
  body.classList.remove('theme-light', 'theme-dark');
  
  if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-light');
    }
    
    // Listen for changes in system preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (getUserPreference('theme', 'light') === 'system') {
          body.classList.remove('theme-light', 'theme-dark');
          body.classList.add(e.matches ? 'theme-dark' : 'theme-light');
        }
      });
    }
  } else {
    // Apply specified theme
    body.classList.add(`theme-${theme}`);
  }
}

/**
 * Apply default view preference
 * @param {string} view - View to apply (charts, table, combined)
 */
function applyDefaultView(view) {
  // This function would be implemented based on the application's view switching mechanism
  // For example, it might show/hide certain sections or trigger tab changes
  const chartSection = document.querySelector('.chart-section');
  const tableSection = document.querySelector('.table-section');
  
  if (!chartSection || !tableSection) return;
  
  switch (view) {
    case 'charts':
      chartSection.style.display = 'block';
      tableSection.style.display = 'none';
      break;
    case 'table':
      chartSection.style.display = 'none';
      tableSection.style.display = 'block';
      break;
    case 'combined':
      chartSection.style.display = 'block';
      tableSection.style.display = 'block';
      break;
  }
}

/**
 * Apply color scheme preference
 * @param {string} scheme - Color scheme to apply
 */
function applyColorScheme(scheme) {
  const body = document.body;
  
  // Remove existing scheme classes
  body.classList.remove('color-default', 'color-pastel', 'color-vibrant', 'color-monochrome');
  
  // Apply new scheme
  body.classList.add(`color-${scheme}`);
  
  // If charts are already initialized, update their colors
  if (window.updateChartsColorScheme) {
    window.updateChartsColorScheme(scheme);
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
  let toast = document.getElementById('toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.className = 'toast show';
  
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

// Export functions
export {
  initializeUserPreferences,
  getUserPreference,
  setUserPreference,
  applyTheme,
  applyDefaultView,
  applyColorScheme
};
