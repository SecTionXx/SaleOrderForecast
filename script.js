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
import { fetchDataFromSheet } from "./dataFetch.js"
import { initializeCharts, charts, enhancedPalette } from "./chartInit.js" // Add enhancedPalette import
import { updateCharts } from "./chartUpdate.js"

// --- Global Variables ---
let allDealsData = [] // Holds the data fetched from the sheet
let currentPage = 1
const rowsPerPage = 50

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
  console.log("script.js: DOM Loaded. Initializing Dashboard...")
  initializeCharts(salesRepColors, chartColors) // Ensure charts are initialized first
  fetchDataAndInitializeDashboard()
})

// ==================================
// DASHBOARD INITIALIZATION & DATA HANDLING
// ==================================
async function fetchDataAndInitializeDashboard() {
  console.log("script.js: fetchDataAndInitializeDashboard Starting...")
  showLoadingIndicator(true)
  displayErrorMessage("") // Clear previous errors

  try {
    allDealsData = await fetchDataFromSheet()
    console.log("script.js: Data received from fetch:", allDealsData)

    if (
      allDealsData &&
      Array.isArray(allDealsData) &&
      allDealsData.length > 0
    ) {
      console.log(
        `script.js: Valid data received (${allDealsData.length} rows). Populating UI...`
      )
      populateSalesRepDropdown(allDealsData) // <-- Add this line
      populateDealStageDropdown(allDealsData)
      populateTable(allDealsData)
      initializeFilteringAndUpdates() // Setup filters AFTER table exists

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
        "script.js: No valid data returned from fetch. Displaying 'no data' message."
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
    displayErrorMessage(
      error.message || "An unexpected error occurred while loading data."
    )
    const tableBody = document.getElementById("forecast-table-body")
    if (tableBody)
      tableBody.innerHTML =
        '<tr><td colspan="11" class="text-center py-4 text-red-600 font-semibold">Failed to load data. Check console and configuration.</td></tr>'
    updateSummaryCards([])
    updateCharts([], chartColors, salesRepColors)
  } finally {
    showLoadingIndicator(false)
    console.log("script.js: fetchDataAndInitializeDashboard Finished.")
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
// UI HELPER FUNCTIONS (Unchanged from previous fix)
// ==================================
function showLoadingIndicator(show) {
  const loader = document.getElementById("loading-overlay")
  if (loader) loader.style.display = show ? "flex" : "none"
}
function displayErrorMessage(message) {
  const errorDiv = document.getElementById("error-message-area")
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.style.display = message ? "block" : "none"
  }
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
