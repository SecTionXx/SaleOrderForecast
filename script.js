// script.js

// Import enhanced table functionality
import {
  initializeRowDetails,
  initializeRowSelection,
  initializePagination,
  getStatusBadgeClass,
  formatDealStageCell,
  formatCurrencyCell,
  formatPercentCell,
  formatDateCell,
  createActionButtons,
  generateTableRow,
} from "./table.js"
import { fetchDataWithCaching } from "./js/modules/dataFetch.js"
import { initializeCharts, charts, enhancedPalette } from "./chartInit.js" 
import { updateCharts } from "./chartUpdate.js"

// Make charts available globally for PDF export
window.charts = charts;
import { exportToCSV, showExportOptions } from './exportData.js';
import { initializeAdvancedFilters, getFilterLogic } from './advancedFilters.js';
import { initializeDashboardCustomization, showPreferencesModal } from './dashboardCustomization.js';
import { shouldOptimizeCharts } from './chartOptimization.js';
import { initializeDealForm } from './dealForm.js';
import { initializeEmailReports } from './emailReports.js';
import { initializeHistoryTracker } from './historyTracker.js';

// --- Global Variables ---
let allDealsData = [] // Holds the data fetched from the sheet
let filteredData = [] // Holds the filtered data
let currentPage = 1
let itemsPerPage = 10
let rowsPerPage = 10 // Number of rows per page for table pagination
let sortColumn = 'lastUpdated'
let sortDirection = 'desc'

// Import authentication service
import { 
  checkAuthentication as authCheck, 
  getAuthUser, 
  getAuthToken, 
  logout as authLogout, 
  hasRole, 
  hasPermission, 
  AUTH_EVENTS, 
  onAuthEvent 
} from './js/auth/clientAuthService.js';

// Import navigation component
import Navigation from './js/components/navigation.js';

// Authentication constants
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag'

// Use the DEBUG utility for logging
function logAppDebug(message, data = null) {
  if (window.DEBUG && DEBUG.debug) {
    DEBUG.debug('App', message, data);
  } else {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [App] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [App] ${message}`);
    }
  }
}

// Prevent redirect loops by adding a timestamp
function preventRedirectLoop(url) {
  // Add a timestamp parameter to prevent caching and loops
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

// --- Chart Colors ---
const chartColors = {
  "Proposal Sent": "rgba(59, 130, 246, 0.8)",
  Negotiation: "rgba(245, 158, 11, 0.8)",
  "Verbal Agreement": "rgba(234, 179, 8, 0.8)",
  "Closed Won": "rgba(34, 197, 94, 0.8)",
  "Closed Lost": "rgba(239, 68, 68, 0.7)",
  default: "rgba(107, 114, 128, 0.7)",
}
const salesRepColors = [
  "rgba(59, 130, 246, 0.7)",
  "rgba(16, 185, 129, 0.7)",
  "rgba(249, 115, 22, 0.7)",
  "rgba(139, 92, 246, 0.7)",
  "rgba(236, 72, 153, 0.7)",
]

// --- Persistent Filter/Sort State ---
const FILTERS_KEY = "orderforecast_filters"
function saveFiltersToStorage(filters) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
}
function loadFiltersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_KEY)) || {}
  } catch {
    return {}
  }
}

// --- Main Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  logAppDebug("script.js: DOM Loaded. Checking authentication...")
  
  // Set up authentication event listeners
  setupAuthEventListeners();
  
  // Check if user is authenticated
  checkAuthentication()
    .then(isAuthenticated => {
      if (isAuthenticated) {
        console.log("User is authenticated. Initializing Dashboard...")
        initializeDashboard()
      } else {
        console.log("User is not authenticated. Redirecting to login...")
        window.location.href = "login.html"
      }
    })
    .catch(error => {
      console.error("Authentication check failed:", error)
      // On error, redirect to login page
      window.location.href = "login.html"
    })
})

// Initialize the dashboard
async function initializeDashboard() {
  try {
    // Initialize event listeners
    initializeEventListeners()

    // Fetch data and initialize dashboard
    await fetchDataAndInitializeDashboard(false)

    // Initialize feather icons
    feather.replace()

    // Set up the filter toggle button
    setupFilterToggle()

    // Set up summary toggle button
    setupSummaryToggle()
    
    // Initialize advanced filters
    initializeAdvancedFilters(handleFilterChange)
    
    // Initialize dashboard customization features
    initializeDashboardCustomization()
    
    // Initialize chart optimization notification
    initializeOptimizationNotice()
    
    // Initialize deal form functionality
    initializeDealForm()
    
    // Initialize email report sharing functionality
    initializeEmailReports()
    
    // Initialize history tracker functionality
    initializeHistoryTracker()
  } catch (error) {
    console.error('Error initializing dashboard:', error)
    displayErrorMessage('Failed to initialize dashboard. Please try again later.')
  }
}

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function checkAuthentication() {
  try {
    logAppDebug("Checking authentication...");
    
    // Use the new authentication service
    const isAuthenticated = await authCheck();
    
    if (!isAuthenticated) {
      logAppDebug("Not authenticated, redirecting to login");
      redirectToLogin();
      return false;
    }
    
    // Get user info
    const user = getAuthUser();
    
    // Update user info in UI
    updateUserInfo(user);
    
    // Initialize navigation component
    initializeNavigation();
    
    logAppDebug("Authentication successful");
    return true;
  } catch (error) {
    logAppDebug("Authentication error:", error);
    redirectToLogin();
    return false;
  }
}

/**
 * Update user information in the UI
 * @param {Object} user - The user object from the server
 */
function updateUserInfo(user) {
  if (!user) return;
  
  // Show/hide elements based on user role
  const adminElements = document.querySelectorAll('.admin-only');
  const editorElements = document.querySelectorAll('.editor-only');
  
  // Use the hasRole function from our authentication service
  if (hasRole('admin')) {
    adminElements.forEach(el => el.style.display = '');
    editorElements.forEach(el => el.style.display = '');
  } else if (hasRole('editor')) {
    adminElements.forEach(el => el.style.display = 'none');
    editorElements.forEach(el => el.style.display = '');
  } else {
    adminElements.forEach(el => el.style.display = 'none');
    editorElements.forEach(el => el.style.display = 'none');
  }
  
  // Show/hide elements based on permissions
  document.querySelectorAll('[data-permission]').forEach(el => {
    const permission = el.getAttribute('data-permission');
    if (permission && !hasPermission(permission)) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  });
}

/**
 * Set up authentication event listeners
 */
function setupAuthEventListeners() {
  // Listen for logout events
  onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    logAppDebug('Logout event received, redirecting to login');
    window.location.href = '/login.html';
  });
  
  // Listen for session expiry events
  onAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, () => {
    logAppDebug('Session expired, redirecting to login');
    window.location.href = '/login.html?expired=true';
  });
  
  // Listen for unauthorized events
  onAuthEvent(AUTH_EVENTS.UNAUTHORIZED, () => {
    logAppDebug('Unauthorized access, redirecting to login');
    window.location.href = '/login.html?unauthorized=true';
  });
}

/**
 * Logout the current user
 */
async function logout() {
  try {
    // Use the logout function from our authentication service
    await authLogout();
    
    // Redirect is handled by the auth event listener
  } catch (error) {
    logAppDebug('Logout error:', error);
    
    // Redirect to login page anyway
    window.location.href = '/login.html';
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Filter form
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFilterChange();
    });
  }
  
  // Refresh data button
  const refreshBtn = document.getElementById('refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchDataAndInitializeDashboard(true); // Force fresh data
    });
  }
  
  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showExportOptions(getCurrentFilteredData());
    });
  }
  
  // Dashboard customization button
  const customizeBtn = document.getElementById('customize-dashboard');
  if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
      showPreferencesModal();
    });
  }
  
  // Logout button
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.removeEventListener('click', () => {});
    logoutBtn.addEventListener('click', logout);
  }
}

// Helper function to get currently filtered data
function getCurrentFilteredData() {
  // If we don't have any data, return empty array
  if (!allDealsData || !Array.isArray(allDealsData)) {
    return []
  }
  
  // Apply filters to the data
  return applyFilters(allDealsData)
}

// Function to apply filters to the data
function applyFilters(data) {
  const salesRepFilter = document.getElementById('sales-rep-filter').value
  const dealStageFilterElement = document.getElementById('deal-stage-filter')
  const forecastMonthFilter = document.getElementById('forecast-month-filter').value
  const searchFilter = document.getElementById('search-deal-filter').value.toLowerCase()
  const startDateFilter = document.getElementById('start-date-filter').value
  const endDateFilter = document.getElementById('end-date-filter').value
  
  // Get selected deal stages for multi-select
  const dealStageContainer = dealStageFilterElement.closest('.multi-select-container')
  let selectedDealStages = []
  
  if (dealStageContainer) {
    const checkboxes = dealStageContainer.querySelectorAll('input[type="checkbox"]:checked')
    selectedDealStages = Array.from(checkboxes).map(cb => cb.value)
  } else {
    // Fallback to single select if multi-select container not found
    const dealStageFilter = dealStageFilterElement.value
    if (dealStageFilter) selectedDealStages = [dealStageFilter]
  }
  
  // Get filter logic (AND/OR)
  const filterLogic = getFilterLogic()
  
  return data.filter(deal => {
    // Create an array to track which filters pass
    const filterResults = []
    
    // Apply sales rep filter
    if (salesRepFilter) {
      filterResults.push(deal.salesRep === salesRepFilter)
    }

    // Apply deal stage filter (multi-select)
    if (selectedDealStages.length > 0) {
      filterResults.push(selectedDealStages.includes(deal.dealStage))
    }

    // Apply forecast month filter (YYYY-MM format)
    if (forecastMonthFilter) {
      const forecastDate = new Date(deal.expectedCloseDate)
      const forecastMonth = `${forecastDate.getFullYear()}-${String(
        forecastDate.getMonth() + 1
      ).padStart(2, '0')}`
      filterResults.push(forecastMonth === forecastMonthFilter)
    }

    // Apply search filter (customer name or project name)
    if (searchFilter) {
      filterResults.push(
        deal.customerName.toLowerCase().includes(searchFilter) ||
        deal.projectName.toLowerCase().includes(searchFilter)
      )
    }

    // Apply date range filters
    if (startDateFilter) {
      const startDate = new Date(startDateFilter)
      const dealDate = new Date(deal.expectedCloseDate)
      filterResults.push(dealDate >= startDate)
    }

    if (endDateFilter) {
      const endDate = new Date(endDateFilter)
      endDate.setHours(23, 59, 59, 999) // End of the day
      const dealDate = new Date(deal.expectedCloseDate)
      filterResults.push(dealDate <= endDate)
    }
    
    // If no filters are active, return true
    if (filterResults.length === 0) return true
    
    // Apply filter logic (AND/OR)
    if (filterLogic === 'AND') {
      // All filters must pass
      return filterResults.every(result => result === true)
    } else {
      // At least one filter must pass
      return filterResults.some(result => result === true)
    }
  })
}

// ==================================
// DASHBOARD INITIALIZATION & DATA HANDLING
// ==================================
async function fetchDataAndInitializeDashboard(forceFresh = false) {
  console.log("script.js: fetchDataAndInitializeDashboard Starting...")
  showLoadingIndicator(true)
  displayErrorMessage("") // Clear previous errors

  try {
    // Use the new caching functionality
    allDealsData = await fetchDataWithCaching(forceFresh)
    console.log("script.js: Data received:", allDealsData ? `${allDealsData.length} rows` : "No data")
    
    // Check if chart optimization should be applied based on dataset size and device capabilities
    const optimizationActive = shouldOptimizeCharts() && allDealsData && allDealsData.length > 100;
    showChartOptimizationNotice(optimizationActive);

    if (
      allDealsData &&
      Array.isArray(allDealsData) &&
      allDealsData.length > 0
    ) {
      console.log(
        `script.js: Valid data received (${allDealsData.length} rows). Populating UI...`
      )
      populateSalesRepDropdown(allDealsData)
      populateDealStageDropdown(allDealsData)
      populateTable(allDealsData)
      initializeFilteringAndUpdates() // Setup filters AFTER table exists
      
      // Update last refresh indicator
      updateLastRefreshTime()

      // Initialize Lucide icons *after* initial UI population
      if (
        typeof window.lucide === "object" &&
        typeof window.lucide.createIcons === "function"
      ) {
        console.log("script.js: Creating initial Lucide icons.")
        window.lucide.createIcons()
      } else {
        // Only log once to avoid spamming the console
        if (!window.__lucideWarned) {
          console.error("Lucide library not found or not loaded.")
          window.__lucideWarned = true
        }
      }
    } else {
      console.warn(
        "script.js: No valid data returned. Displaying 'no data' message."
      )
      displayErrorMessage(
        "No data found in the specified Google Sheet range or sheet is empty."
      )
      const tableBody = document.getElementById("forecast-table-body")
      if (tableBody)
        tableBody.innerHTML =
          '<tr><td colspan="11" class="text-center py-4 text-gray-500">No data available.</td></tr>'
      updateSummaryCards([])
      updateCharts([], chartColors, salesRepColors)
    }
  } catch (error) {
    console.error("script.js: Error during data fetching or processing:", error)
    
    // Display user-friendly error message
    displayErrorMessage(error.message || "An unexpected error occurred while loading data.")
    
    // Show error in table
    const tableBody = document.getElementById("forecast-table-body")
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-4">
            <div class="flex flex-col items-center justify-center space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-red-600 font-semibold">${error.message || "Failed to load data"}</p>
              <button id="retry-fetch-btn" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Retry
              </button>
            </div>
          </td>
        </tr>
      `;
      
      // Add event listener to retry button
      document.getElementById('retry-fetch-btn')?.addEventListener('click', () => {
        fetchDataAndInitializeDashboard(true); // Force fresh data on retry
      });
    }
    
    updateSummaryCards([])
    updateCharts([], chartColors, salesRepColors)
  } finally {
    showLoadingIndicator(false)
    console.log("script.js: fetchDataAndInitializeDashboard Finished.")
  }
}

// Function to update the last refresh time indicator
function updateLastRefreshTime() {
  const refreshTimeElement = document.getElementById('last-refresh-time')
  if (refreshTimeElement) {
    const now = new Date()
    refreshTimeElement.textContent = now.toLocaleTimeString()
    refreshTimeElement.setAttribute('title', now.toLocaleString())
  }
}

// --- Add this function ---
function populateSalesRepDropdown(data) {
  const salesRepFilter = document.getElementById("sales-rep-filter")
  if (!salesRepFilter) return
  // Get unique, non-empty salesRep values
  const reps = Array.from(
    new Set(
      data
        .map((d) => (d.salesRep || "").trim())
        .filter((v) => v && v.toLowerCase() !== "unknown")
    )
  )
  // Save current selection
  const currentValue = salesRepFilter.value
  // Clear and add default option (ENGLISH)
  salesRepFilter.innerHTML = '<option value="">All</option>'
  reps.forEach((rep) => {
    const option = document.createElement("option")
    option.value = rep
    option.textContent = rep
    salesRepFilter.appendChild(option)
  })
  // Restore selection if possible
  if (reps.includes(currentValue)) {
    salesRepFilter.value = currentValue
  }
}

function populateDealStageDropdown(data) {
  const dealStageFilter = document.getElementById("deal-stage-filter")
  if (!dealStageFilter) return
  // Get unique, non-empty dealStage values
  const stages = Array.from(
    new Set(
      data
        .map((d) => (d.dealStage || "").trim())
        .filter((v) => v && v.toLowerCase() !== "unknown")
    )
  )
  // Save current selection
  const currentValue = dealStageFilter.value
  // Clear and add default option
  dealStageFilter.innerHTML = '<option value="">All</option>'
  stages.forEach((stage) => {
    const option = document.createElement("option")
    option.value = stage
    option.textContent = stage
    dealStageFilter.appendChild(option)
  })
  // Restore selection if possible
  if (stages.includes(currentValue)) {
    dealStageFilter.value = currentValue
  }
}

// ==================================
// TABLE POPULATION (UI Logic - Updated formatDate)
// ==================================
function populateTable(data) {
  console.log(`script.js: populateTable CALLED with ${data.length} items.`)
  const tableBody = document.getElementById("forecast-table-body")
  if (!tableBody) {
    console.error(
      "script.js: Cannot find table body element 'forecast-table-body'."
    )
    return
  }
  tableBody.innerHTML = "" // Clear previous content
  console.log("script.js: Table body cleared.")

  if (data.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="11" class="text-center py-4 text-gray-500">No matching data found for current filters.</td></tr>'
    // Initialize pagination with 0 items
    initializePagination(0, rowsPerPage)
    return
  }

  // Calculate pagination
  const totalPages = Math.ceil(data.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, data.length)

  // Initialize or update pagination controls
  initializePagination(data.length, rowsPerPage)

  // Only process items for the current page
  const currentPageData = data.slice(startIndex, endIndex)

  currentPageData.forEach((deal, index) => {
    try {
      const row = document.createElement("tr")

      // Add data attributes for filtering and row details
      row.dataset.salesRep = deal.salesRep || ""
      row.dataset.dealStage = deal.dealStage || ""
      row.dataset.dealId = deal.dealId || `DEAL-${index}`

      // Store dates in dataset for details expansion
      row.dataset.closeDate =
        deal.expectedCloseDate instanceof Date
          ? deal.expectedCloseDate.toISOString().split("T")[0]
          : deal.expectedCloseDate || ""
      row.dataset.dateCreated =
        deal.dateCreated instanceof Date
          ? deal.dateCreated.toISOString().split("T")[0]
          : deal.dateCreated || ""
      row.dataset.lastUpdated =
        deal.lastUpdated instanceof Date
          ? deal.lastUpdated.toISOString().split("T")[0]
          : deal.lastUpdated || ""
      row.dataset.notes = deal.notes || ""

      // Store values in dataset for conditional formatting
      row.dataset.value = deal.totalValue || "0"
      row.dataset.weightedValue = deal.weightedValue || "0"
      row.dataset.probabilityPercent = deal.probabilityPercent || "0"

      // Get enhanced status badge class from table.js
      const stageBadgeClass = getStatusBadgeClass(deal.dealStage)

      // Format values for display
      const displayTotalValue = formatCurrencyCell(deal.totalValue)
      const displayWeightedValue = formatCurrencyCell(deal.weightedValue)
      const displayProb = formatPercentCell(deal.probabilityPercent)

      // Format dates
      const displayCloseDate = formatDateCell(deal.expectedCloseDate)
      const displayLastUpdated = formatDateCell(deal.lastUpdated)
      const displayDateCreated = formatDateCell(deal.dateCreated)

      // Calculate age in days
      let ageDays = null
      if (deal.dateCreated) {
        let createdDate
        if (
          deal.dateCreated instanceof Date &&
          !isNaN(deal.dateCreated.getTime())
        ) {
          createdDate = deal.dateCreated
        } else if (typeof deal.dateCreated === "string") {
          createdDate = new Date(deal.dateCreated)
        }
        if (createdDate && !isNaN(createdDate.getTime())) {
          const today = new Date("2025-04-28") // Use current date context
          today.setHours(0, 0, 0, 0)
          ageDays = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24))
        }
      }
      deal.ageDays = ageDays

      // Add classes for row styling based on deal properties
      if (
        (deal.dealStage || "").toLowerCase().includes("negotiation") &&
        ageDays > 30
      ) {
        row.classList.add("stale-deal")
      }

      if (deal.weightedValue >= 1000000) {
        row.classList.add("high-priority-deal")
      }

      // Check for past due deals
      let pastDueClass = ""
      if (row.dataset.closeDate) {
        try {
          const closeDate = new Date(row.dataset.closeDate + "T00:00:00")
          const today = new Date("2025-04-28")
          today.setHours(0, 0, 0, 0)
          if (
            !isNaN(closeDate.getTime()) &&
            closeDate < today &&
            !(deal.dealStage || "").toLowerCase().includes("closed")
          ) {
            pastDueClass = "past-due-deal"
          }
        } catch (e) {
          console.warn(
            "Could not parse date for past-due check:",
            row.dataset.closeDate,
            e
          )
        }
      }

      // Create row HTML with enhanced styling
      row.innerHTML = generateTableRow(deal, {
        stageBadgeClass,
        displayCloseDate,
        ageDays,
        pastDueClass,
        index,
      })
      tableBody.appendChild(row)
    } catch (error) {
      console.error(
        `script.js: Error populating row for deal index ${index}:`,
        deal,
        error
      )
    }
  })

  // Initialize row details and selection after populating table
  initializeRowDetails()
  initializeRowSelection()

  // After table is populated, replace feather icons
  if (window.feather && typeof window.feather.replace === "function") {
    window.feather.replace()
  }

  console.log("script.js: populateTable Finished.")
}

// ==================================
// FILTERING & UI UPDATING LOGIC
// ==================================
function initializeFilteringAndUpdates() {
  console.log("script.js: Initializing filters and update listeners...")
  const filterControls = document.querySelectorAll(".filter-control")
  const tableBody = document.getElementById("forecast-table-body")
  if (!tableBody) {
    console.error(
      "script.js: Cannot initialize filters - table body not found."
    )
    return
  }

  const salesRepFilterEl = document.getElementById("sales-rep-filter")
  const dealStageFilterEl = document.getElementById("deal-stage-filter")
  const forecastMonthFilterEl = document.getElementById("forecast-month-filter")
  const searchDealFilterEl = document.getElementById("search-deal-filter")
  const startDateFilterEl = document.getElementById("start-date-filter")
  const endDateFilterEl = document.getElementById("end-date-filter")

  function applyFiltersAndRefreshUI() {
    console.log("script.js: Applying filters to UI...")
    const salesRepFilter = salesRepFilterEl?.value.toLowerCase() || ""
    const dealStageFilter = dealStageFilterEl?.value.toLowerCase() || ""
    const forecastMonthFilter = forecastMonthFilterEl?.value || ""
    const searchFilter = searchDealFilterEl?.value.toLowerCase() || ""
    const startDate = startDateFilterEl?.value
    const endDate = endDateFilterEl?.value

    let filteredData = allDealsData.filter((deal) => {
      const salesRep = (deal.salesRep || "").toLowerCase()
      const dealStage = (deal.dealStage || "").toLowerCase()
      // Use the date string stored in the dataset for filtering comparison
      const closeDateStr =
        deal.expectedCloseDate instanceof Date
          ? deal.expectedCloseDate.toISOString().split("T")[0]
          : deal.expectedCloseDate || ""
      const customerName = (deal.customerName || "").toLowerCase()
      const projectName = (deal.projectName || "").toLowerCase()

      const salesRepMatch = !salesRepFilter || salesRep === salesRepFilter
      const dealStageMatch = !dealStageFilter || dealStage === dealStageFilter
      const closeMonth = closeDateStr ? closeDateStr.substring(0, 7) : "" // Extract YYYY-MM
      const forecastMonthMatch =
        !forecastMonthFilter || closeMonth === forecastMonthFilter
      const searchMatch =
        !searchFilter ||
        customerName.includes(searchFilter) ||
        projectName.includes(searchFilter)

      // Date range filtering (Expected Close Date)
      let dateInRange = true
      if (startDate || endDate) {
        let closeDateObj = null
        if (
          deal.expectedCloseDate instanceof Date &&
          !isNaN(deal.expectedCloseDate.getTime())
        ) {
          closeDateObj = deal.expectedCloseDate
        } else if (
          typeof deal.expectedCloseDate === "string" &&
          deal.expectedCloseDate.length >= 10
        ) {
          closeDateObj = new Date(deal.expectedCloseDate)
        }
        if (closeDateObj && !isNaN(closeDateObj.getTime())) {
          if (startDate) {
            const start = new Date(startDate)
            if (closeDateObj < start) dateInRange = false
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (closeDateObj > end) dateInRange = false
          }
        } else if (startDate || endDate) {
          dateInRange = false // If no valid date, exclude from range
        }
      }

      return (
        salesRepMatch &&
        dealStageMatch &&
        forecastMonthMatch &&
        searchMatch &&
        dateInRange
      )
    })
    filteredData = applySort(filteredData)
    console.log(
      `script.js: Filtering complete. Showing ${filteredData.length} of ${allDealsData.length} deals.`
    )
    populateTable(filteredData) // Re-populate table
    updatePaginationInfo(filteredData.length, allDealsData.length)
    updateSummaryCards(filteredData)
    updateCharts(filteredData, chartColors, salesRepColors)
    const tableRows = Array.from(tableBody.getElementsByTagName("tr"))
    tableRows.forEach((row) => applyRowFormatting(row)) // Apply formatting
    // Refresh Lucide icons if needed after table redraw
    if (
      typeof window.lucide === "object" &&
      typeof window.lucide.createIcons === "function"
    ) {
      // This call handles icons within the dynamic table rows
      window.lucide.createIcons()
    } else {
      // Only log once to avoid spamming the console
      if (!window.__lucideWarned) {
        console.error("Lucide library not found during filter refresh.")
        window.__lucideWarned = true
      }
    }
    // Replace feather icons after table redraw
    if (window.feather && typeof window.feather.replace === "function") {
      window.feather.replace()
    }
  }

  // Restore filters from storage
  const saved = loadFiltersFromStorage()
  if (saved) {
    if (salesRepFilterEl && saved.salesRep)
      salesRepFilterEl.value = saved.salesRep
    if (dealStageFilterEl && saved.dealStage)
      dealStageFilterEl.value = saved.dealStage
    if (forecastMonthFilterEl && saved.forecastMonth)
      forecastMonthFilterEl.value = saved.forecastMonth
    if (searchDealFilterEl && saved.search)
      searchDealFilterEl.value = saved.search
    if (startDateFilterEl && saved.startDate)
      startDateFilterEl.value = saved.startDate
    if (endDateFilterEl && saved.endDate) endDateFilterEl.value = saved.endDate
    if (saved.sortKey) currentSort.key = saved.sortKey
    if (saved.sortDir) currentSort.direction = saved.sortDir
    if (saved.page) currentPage = saved.page
  }

  filterControls.forEach((control) => {
    const eventType = control.tagName === "SELECT" ? "change" : "input"
    control.addEventListener(eventType, () => {
      resetPagination()
      saveFiltersToStorage({
        salesRep: salesRepFilterEl?.value,
        dealStage: dealStageFilterEl?.value,
        forecastMonth: forecastMonthFilterEl?.value,
        search: searchDealFilterEl?.value,
        startDate: startDateFilterEl?.value,
        endDate: endDateFilterEl?.value,
        sortKey: currentSort.key,
        sortDir: currentSort.direction,
        page: 1,
      })
      applyFiltersAndRefreshUI()
    })
  })
  // Save sort state on header click
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      saveFiltersToStorage({
        salesRep: salesRepFilterEl?.value,
        dealStage: dealStageFilterEl?.value,
        forecastMonth: forecastMonthFilterEl?.value,
        search: searchDealFilterEl?.value,
        startDate: startDateFilterEl?.value,
        endDate: endDateFilterEl?.value,
        sortKey: currentSort.key,
        sortDir: currentSort.direction,
        page: 1,
      })
    })
  })
  // --- Pagination Controls ---
  function setupPaginationControls(filteredCount) {
    const buttons = document.querySelectorAll(".pagination-button")
    if (buttons.length === 2) {
      buttons[0].onclick = () => {
        if (currentPage > 1) {
          currentPage--
          saveFiltersToStorage({
            salesRep: salesRepFilterEl?.value,
            dealStage: dealStageFilterEl?.value,
            forecastMonth: forecastMonthFilterEl?.value,
            search: searchDealFilterEl?.value,
            startDate: startDateFilterEl?.value,
            endDate: endDateFilterEl?.value,
            sortKey: currentSort.key,
            sortDir: currentSort.direction,
            page: currentPage,
          })
          applyFiltersAndRefreshUI()
        }
      }
      buttons[1].onclick = () => {
        if (currentPage * rowsPerPage < filteredCount) {
          currentPage++
          saveFiltersToStorage({
            salesRep: salesRepFilterEl?.value,
            dealStage: dealStageFilterEl?.value,
            forecastMonth: forecastMonthFilterEl?.value,
            search: searchDealFilterEl?.value,
            startDate: startDateFilterEl?.value,
            endDate: endDateFilterEl?.value,
            sortKey: currentSort.key,
            sortDir: currentSort.direction,
            page: currentPage,
          })
          applyFiltersAndRefreshUI()
        }
      }
    }
  }
  console.log("script.js: Applying initial filters...")
  applyFiltersAndRefreshUI() // Apply initial filter state
}

function resetPagination() {
  currentPage = 1
}

// --- Sorting State ---
let currentSort = { key: null, direction: "asc" }

function applySort(data) {
  if (!currentSort.key) return data
  const sorted = [...data].sort((a, b) => {
    let valA = a[currentSort.key]
    let valB = b[currentSort.key]
    // Handle dates
    if (valA instanceof Date && valB instanceof Date) {
      valA = valA.getTime()
      valB = valB.getTime()
    }
    // Handle numbers
    if (typeof valA === "number" && typeof valB === "number") {
      return currentSort.direction === "asc" ? valA - valB : valB - valA
    }
    // Fallback to string comparison
    valA = valA == null ? "" : String(valA).toLowerCase()
    valB = valB == null ? "" : String(valB).toLowerCase()
    if (valA < valB) return currentSort.direction === "asc" ? -1 : 1
    if (valA > valB) return currentSort.direction === "asc" ? 1 : -1
    return 0
  })
  return sorted
}

function updateSortIndicators() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    const indicator = th.querySelector(".sort-indicator")
    if (!indicator) return
    const key = th.getAttribute("data-sort")
    if (key === currentSort.key) {
      indicator.textContent = currentSort.direction === "asc" ? "▲" : "▼"
    } else {
      indicator.textContent = ""
    }
  })
}

// ==================================
// UI HELPER FUNCTIONS 
// ==================================
function showLoadingIndicator(show) {
  const overlay = document.getElementById("loading-overlay")
  if (overlay) {
    if (show) {
      overlay.style.display = "flex"
      // Add animation class if showing
      overlay.classList.add('fade-in')
    } else {
      // Add fade-out animation
      overlay.classList.add('fade-out')
      // Remove after animation completes
      setTimeout(() => {
        overlay.style.display = "none"
        overlay.classList.remove('fade-in', 'fade-out')
      }, 300)
    }
  }
}

function displayErrorMessage(message) {
  const errorArea = document.getElementById("error-message-area")
  if (!errorArea) return
  
  if (!message) {
    errorArea.innerHTML = ""
    return
  }
  
  // Create a dismissible error message
  errorArea.innerHTML = `
    <div class="error-message">
      <div class="error-content">
        <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>${message}</span>
      </div>
      <button class="error-dismiss" onclick="this.parentElement.remove()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `
  
  // Hide loading indicator when showing error
  if (message) showLoadingIndicator(false)
}
function applyRowFormatting(row) {
  const weightedValue = parseFloat(row.dataset.weightedValue) || 0
  const closeDateStr = row.dataset.closeDate // Date string YYYY-MM-DD from dataset
  const dealStage = row.dataset.dealStage?.toLowerCase() || ""
  const weightedValueCell = row.querySelector(".weighted-value-cell")
  const dateCell = row.querySelector(".close-date-cell")
  if (weightedValueCell) weightedValueCell.classList.remove("high-value-deal")
  if (dateCell) dateCell.classList.remove("past-due-deal")
  if (weightedValue >= 1000000 && weightedValueCell) {
    weightedValueCell.classList.add("high-value-deal")
  }
  if (closeDateStr && !dealStage.includes("closed") && dateCell) {
    try {
      const closeDate = new Date(closeDateStr + "T00:00:00") // Use stored YYYY-MM-DD string
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (!isNaN(closeDate.getTime()) && closeDate < today) {
        dateCell.classList.add("past-due-deal")
      }
    } catch (e) {
      console.warn("Could not parse date for past-due check:", closeDateStr, e)
    }
  }
}
function updatePaginationInfo(visibleCount, totalCount) {
  const paginationInfo = document.getElementById("pagination-info")
  if (paginationInfo) {
    const start = visibleCount > 0 ? 1 : 0
    // Update text to English
    paginationInfo.innerHTML = `
            Showing <span class="font-medium">${start}</span> to <span class="font-medium">${visibleCount}</span> of <span class="font-medium">${totalCount}</span> total entries (matching filters)
        `
    const buttons = document.querySelectorAll(".pagination-button")
    buttons.forEach((btn) => (btn.disabled = true)) // Keep pagination disabled for now
  }
}
function updateSummaryCards(filteredData) {
  console.log(
    `script.js: Updating summary cards with ${filteredData.length} filtered deals.`
  )
  let totalValue = 0,
    weightedValue = 0,
    pipelineDeals = 0,
    closedWonDeals = 0,
    closedLostDeals = 0
  filteredData.forEach((deal) => {
    totalValue += deal.totalValue || 0
    weightedValue += deal.weightedValue || 0
    const stageLower = (deal.dealStage || "").toLowerCase()
    if (!stageLower.includes("closed")) pipelineDeals++
    else if (stageLower === "closed won") closedWonDeals++
    else if (stageLower === "closed lost") closedLostDeals++
  })
  const totalClosed = closedWonDeals + closedLostDeals
  const winRate = totalClosed > 0 ? (closedWonDeals / totalClosed) * 100 : 0
  const prevWeightedValue = weightedValue / 1.1
  const prevPipelineDeals = pipelineDeals + 1
  const prevWinRate = winRate - 3
  const formatCurrency = (value) =>
    "฿" + (value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })
  document.getElementById("summary-total-value").textContent =
    formatCurrency(totalValue)
  document.getElementById(
    "summary-total-deals"
  ).textContent = `จากดีล ${filteredData.length} รายการ`
  updateTrend("summary-total", weightedValue, prevWeightedValue)
  document.getElementById("summary-weighted-value").textContent =
    formatCurrency(weightedValue)
  updateTrend("summary-weighted", weightedValue, prevWeightedValue)
  document.getElementById("summary-pipeline-deals").textContent = pipelineDeals
  updateTrend("summary-pipeline", pipelineDeals, prevPipelineDeals)
  document.getElementById("summary-win-rate").textContent =
    winRate.toFixed(0) + "%"
  updateTrend("summary-winrate", winRate, prevWinRate)
}
/**
 * Handle filter change events
 * This function is called whenever a filter is changed
 */
function handleFilterChange() {
  resetPagination()
  const filteredData = getCurrentFilteredData()
  populateTable(filteredData)
  updateSummaryCards(filteredData)
  updateCharts(filteredData)
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
  displayErrorMessage(message)
}

/**
 * Set up the filter toggle button to show/hide the filter panel
 */
function setupFilterToggle() {
  const filterToggleBtn = document.getElementById('filter-toggle-btn');
  const filterPanel = document.getElementById('filter-panel');
  
  if (filterToggleBtn && filterPanel) {
    filterToggleBtn.addEventListener('click', () => {
      filterPanel.classList.toggle('hidden');
      // Update button text based on visibility
      const isVisible = !filterPanel.classList.contains('hidden');
      filterToggleBtn.innerHTML = isVisible ? 
        '<i data-feather="chevron-up"></i> Hide Filters' : 
        '<i data-feather="chevron-down"></i> Show Filters';
      // Re-initialize feather icons
      if (window.feather) {
        window.feather.replace();
      }
    });
  }
}

/**
 * Set up the summary toggle button to show/hide the summary cards
 */
function setupSummaryToggle() {
  const summaryToggleBtn = document.getElementById('summary-toggle-btn');
  const summaryCards = document.getElementById('summary-cards');
  
  if (summaryToggleBtn && summaryCards) {
    summaryToggleBtn.addEventListener('click', () => {
      summaryCards.classList.toggle('hidden');
      // Update button text based on visibility
      const isVisible = !summaryCards.classList.contains('hidden');
      summaryToggleBtn.innerHTML = isVisible ? 
        '<i data-feather="chevron-up"></i> Hide Summary' : 
        '<i data-feather="chevron-down"></i> Show Summary';
      // Re-initialize feather icons
      if (window.feather) {
        window.feather.replace();
      }
    });
  }
}

function updateTrend(summaryId, currentValue, previousValue) {
  const trendElement = document.getElementById(`${summaryId}-trend`)
  const changeElement = document.getElementById(`${summaryId}-change`)
  const iconElement = trendElement?.querySelector(".trend-icon")
  if (!trendElement || !changeElement || !iconElement) return
  let changeText = "-- vs Prev."
  let iconType = "minus"
  let trendClass = "trend-neutral"
  if (previousValue != null && !isNaN(previousValue) && previousValue !== 0) {
    const percentageChange =
      ((currentValue - previousValue) / previousValue) * 100
    if (percentageChange > 0.1) {
      changeText = `▲ ${percentageChange.toFixed(0)}%`
      iconType = "trending-up"
      trendClass = "trend-up"
    } else if (percentageChange < -0.1) {
      changeText = `▼ ${Math.abs(percentageChange).toFixed(0)}%`
      iconType = "trending-down"
      trendClass = "trend-down"
    } else {
      changeText = `► ~0%`
      iconType = "minus"
      trendClass = "trend-neutral"
    }
    changeText += " vs Prev."
  } else if (previousValue === 0 && currentValue > 0) {
    changeText = `▲ New`
    iconType = "trending-up"
    trendClass = "trend-up"
  } else if (currentValue === 0 && previousValue > 0) {
    changeText = `▼ 100% vs Prev.`
    iconType = "trending-down"
    trendClass = "trend-down"
  }
  changeElement.textContent = changeText
  // Replace Lucide icon with Feather icon
  let featherIcon = "minus"
  if (iconType === "trending-up") featherIcon = "trending-up"
  else if (iconType === "trending-down") featherIcon = "trending-down"
  else if (iconType === "minus") featherIcon = "minus"
  // Replace icon markup
  if (iconElement) {
    iconElement.outerHTML = `<span class="trend-icon ${trendClass}" data-feather="${featherIcon}"></span>`
    // After DOM update, replace feather icons
    if (window.feather && typeof window.feather.replace === "function") {
      window.feather.replace()
    }
  }
}

/**
 * Show or hide the chart optimization notification
 * @param {boolean} show - Whether to show the notification
 */
function showChartOptimizationNotice(show) {
  const notice = document.getElementById('chart-optimization-notice');
  if (!notice) return;
  
  if (show) {
    notice.classList.add('active');
    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  } else {
    notice.classList.remove('active');
  }
}

/**
 * Initialize the chart optimization notification
 */
function initializeOptimizationNotice() {
  const closeBtn = document.getElementById('close-optimization-notice');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      showChartOptimizationNotice(false);
    });
  }
  
  // Check if optimization should be applied based on device and dataset size
  const optimizationActive = shouldOptimizeCharts() && allDealsData.length > 100;
  showChartOptimizationNotice(optimizationActive);
}

// ==================================
// CHART RESIZE HANDLER (NEW)
// ==================================
window.addEventListener("resize", () => {
  if (charts.monthlyForecastChart) charts.monthlyForecastChart.resize()
  if (charts.dealStageChart) charts.dealStageChart.resize()
  if (charts.salesPerformanceChart) charts.salesPerformanceChart.resize()
  if (charts.salesFunnelChart) charts.salesFunnelChart.resize()
  if (charts.forecastAccuracyChart) charts.forecastAccuracyChart.resize()
  if (charts.dealAgingChart) charts.dealAgingChart.resize()
})
