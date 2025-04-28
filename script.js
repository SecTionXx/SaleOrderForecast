// script.js

// --- Import the data fetching function ---
import { fetchDataFromSheet } from "./data.js"

// --- Global Variables ---
let allDealsData = [] // Holds the data fetched from the sheet
let monthlyForecastChart = null
let dealStageChart = null
let salesPerformanceChart = null
let currentPage = 1
const rowsPerPage = 50

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
const FILTERS_KEY = 'orderforecast_filters';
function saveFiltersToStorage(filters) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}
function loadFiltersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_KEY)) || {};
  } catch {
    return {};
  }
}

// --- Main Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js: DOM Loaded. Initializing Dashboard...")
  initializeCharts()
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
      updateCharts([])
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
    updateCharts([])
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
// CHART INITIALIZATION (Setup Structure - Unchanged from previous fix)
// ==================================
function initializeCharts() {
  console.log("script.js: Initializing chart structures...")
  Chart.defaults.font.family = "'Inter', 'Sarabun', sans-serif"
  const currencyFormatter = (value) => "฿" + (value || 0).toLocaleString()
  const shortCurrencyFormatter = (value) => {
    value = value || 0
    if (value >= 1000000) return "฿" + (value / 1000000).toFixed(1) + "M"
    if (value >= 1000) return "฿" + (value / 1000).toFixed(0) + "K"
    return "฿" + value.toLocaleString()
  }

  // --- Monthly Forecast Chart ---
  const monthlyCtx = document.getElementById("monthlyForecastChart")
  if (monthlyCtx && !monthlyForecastChart) {
    const months = ["Apr-25", "May-25", "Jun-25", "Jul-25"]
    const staticActuals = [350000, 750000, null, null]
    monthlyForecastChart = new Chart(monthlyCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Forecast (ถ่วงน้ำหนัก)",
            data: [0, 0, 0, 0],
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            order: 2,
          },
          {
            label: "Actual Sales",
            data: staticActuals,
            type: "line",
            borderColor: "rgba(22, 163, 74, 1)",
            backgroundColor: "rgba(22, 163, 74, 0.2)",
            tension: 0.1,
            fill: false,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                value.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                  maximumFractionDigits: 0,
                }),
            },
          },
        },
        plugins: {
          datalabels: {
            formatter: (value) =>
              value != null ? value.toLocaleString("en-US") : "",
            color: "#6b7280",
            font: { weight: "bold" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ` +
                (ctx.parsed.y != null
                  ? ctx.parsed.y.toLocaleString("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    })
                  : ""),
            },
          },
          legend: { position: "top" },
        },
        interaction: { mode: "index", intersect: false },
      },
    })
  }
  // --- Deal Stage Chart ---
  const stageCtx = document.getElementById("dealStageChart")
  if (stageCtx && !dealStageChart) {
    dealStageChart = new Chart(stageCtx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            label: "จำนวนดีล",
            data: [],
            backgroundColor: [],
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { padding: 15 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label || ""}: ${ctx.parsed || 0} Deals`,
            },
          },
          doughnutlabel: {
            labels: [
              {
                text: "฿0",
                font: { size: "20", weight: "bold" },
                color: "#1f2937",
              },
              {
                text: "Pipeline Value",
                font: { size: "12" },
                color: "#6b7280",
              },
            ],
          },
          datalabels: {
            formatter: (val, ctx) => {
              let sum = ctx.dataset.data.reduce((a, b) => a + b, 0)
              let pct = sum > 0 ? (val * 100) / sum : 0
              return pct > 5 ? pct.toFixed(0) + "%" : ""
            },
            color: "#fff",
            font: { weight: "bold" },
          },
        },
      },
    })
  }
  // --- Sales Performance Chart ---
  const performanceCtx = document.getElementById("salesPerformanceChart")
  if (performanceCtx && !salesPerformanceChart) {
    salesPerformanceChart = new Chart(performanceCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "มูลค่าถ่วงน้ำหนัก (บาท)",
            data: [],
            backgroundColor: salesRepColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                value.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                  maximumFractionDigits: 0,
                }),
            },
          },
          y: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.parsed.x != null
                  ? ctx.parsed.x.toLocaleString("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    })
                  : "",
            },
          },
          datalabels: {
            formatter: (value) =>
              value != null ? value.toLocaleString("en-US") : "",
            color: "#6b7280",
            font: { weight: "bold" },
          },
        },
      },
    })
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
    return
  }

  data.forEach((deal, index) => {
    try {
      const row = document.createElement("tr")
      // Add data-* attributes
      row.dataset.salesRep = deal.salesRep || ""
      row.dataset.dealStage = deal.dealStage || ""
      // Store date as ISO string if it's a Date object, otherwise store original string/null
      row.dataset.closeDate =
        deal.expectedCloseDate instanceof Date
          ? deal.expectedCloseDate.toISOString().split("T")[0]
          : deal.expectedCloseDate || ""
      row.dataset.value = deal.totalValue || "0"
      row.dataset.weightedValue = deal.weightedValue || "0"

      // Determine stage badge class
      let stageClass = "bg-gray-100 text-gray-800" // Default fallback
      const stageLower = (deal.dealStage || "").toLowerCase()
      if (stageLower === "proposal sent")
        stageClass = "bg-blue-100 text-blue-800"
      else if (stageLower.includes("negotiation"))
        stageClass = "bg-yellow-100 text-yellow-800"
      else if (stageLower === "verbal agreement")
        stageClass = "bg-yellow-100 text-yellow-800"
      else if (stageLower === "closed won")
        stageClass = "bg-green-100 text-green-800"
      else if (stageLower === "closed lost")
        stageClass = "bg-red-100 text-red-800"

      // Format values for display
      const formatCurrency = (value) =>
        (value || 0).toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      const displayTotalValue = formatCurrency(deal.totalValue)
      const displayWeightedValue = formatCurrency(deal.weightedValue)
      const displayProb = (deal.probabilityPercent || 0).toFixed(0) + "%"

      // --- **Updated Date Formatting Helper** ---
      const formatDate = (dateInput) => {
        if (!dateInput) return "N/A" // Handle null/undefined/empty string

        let date
        if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
          // If it's already a valid Date object (likely from serial number conversion)
          date = dateInput
        } else if (typeof dateInput === "string") {
          // Try to parse common string formats (YYYY-MM-DD is most likely from sheets)
          // Add T00:00:00 to help parser interpret as local time start
          const parsedDate = new Date(
            dateInput + (dateInput.includes("T") ? "" : "T00:00:00")
          )
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate // Use parsed date if valid
          } else {
            // console.warn(`formatDate: Could not parse date string: ${dateInput}`);
            return dateInput // Return original string if parsing fails
          }
        } else {
          // If it's neither a parsable string nor a Date object
          // console.warn(`formatDate: Unexpected date input type: ${typeof dateInput}`, dateInput);
          return String(dateInput) // Return string representation
        }

        // Format the valid Date object to DD/MM/YY
        try {
          const day = String(date.getDate()).padStart(2, "0")
          const month = String(date.getMonth() + 1).padStart(2, "0") // Month is 0-indexed
          const year = String(date.getFullYear()).slice(-2)
          return `${day}/${month}/${year}`
        } catch (formatError) {
          console.error(
            "formatDate: Error formatting date object:",
            date,
            formatError
          )
          return "Invalid Date" // Fallback if formatting fails
        }
      }
      // --- End Updated Date Formatting Helper ---

      const displayCloseDate = formatDate(deal.expectedCloseDate)
      const displayLastUpdated = formatDate(deal.lastUpdated)

      row.innerHTML = `
                <td class="td-style customer-name">${
                  deal.customerName || "N/A"
                }</td>
                <td class="td-style project-name">${
                  deal.projectName || "N/A"
                }</td>
                <td class="td-style text-right">${displayTotalValue}</td>
                <td class="td-style text-center">${displayProb}</td>
                <td class="td-style font-medium text-right weighted-value-cell">${displayWeightedValue}</td>
                <td class="td-style deal-stage-cell"><span class="status-badge ${stageClass}">${
        deal.dealStage || "Unknown"
      }</span></td>
                <td class="td-style text-center close-date-cell">${displayCloseDate}</td>
                <td class="td-style sales-rep-cell">${
                  deal.salesRep || "Unknown"
                }</td>
                <td class="td-style text-center">${displayLastUpdated}</td>
                <td class="td-style text-center action-cell">
                    <button class="action-button" title="Edit (Not Implemented)"><span data-feather="edit-2"></span></button>
                    <button class="action-button ml-2" title="Comment (Not Implemented)"><span data-feather="message-square"></span></button>
                </td>
            `
      tableBody.appendChild(row)
    } catch (error) {
      console.error(
        `script.js: Error populating row for deal index ${index}:`,
        deal,
        error
      )
    }
  })
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
    updateCharts(filteredData)
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
  const saved = loadFiltersFromStorage();
  if (saved) {
    if (salesRepFilterEl && saved.salesRep) salesRepFilterEl.value = saved.salesRep;
    if (dealStageFilterEl && saved.dealStage) dealStageFilterEl.value = saved.dealStage;
    if (forecastMonthFilterEl && saved.forecastMonth) forecastMonthFilterEl.value = saved.forecastMonth;
    if (searchDealFilterEl && saved.search) searchDealFilterEl.value = saved.search;
    if (startDateFilterEl && saved.startDate) startDateFilterEl.value = saved.startDate;
    if (endDateFilterEl && saved.endDate) endDateFilterEl.value = saved.endDate;
    if (saved.sortKey) currentSort.key = saved.sortKey;
    if (saved.sortDir) currentSort.direction = saved.sortDir;
    if (saved.page) currentPage = saved.page;
  }

  filterControls.forEach((control) => {
    const eventType = control.tagName === "SELECT" ? "change" : "input"
    control.addEventListener(eventType, () => {
      resetPagination();
      saveFiltersToStorage({
        salesRep: salesRepFilterEl?.value,
        dealStage: dealStageFilterEl?.value,
        forecastMonth: forecastMonthFilterEl?.value,
        search: searchDealFilterEl?.value,
        startDate: startDateFilterEl?.value,
        endDate: endDateFilterEl?.value,
        sortKey: currentSort.key,
        sortDir: currentSort.direction,
        page: 1
      });
      applyFiltersAndRefreshUI();
    })
  })
  // Save sort state on header click
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      saveFiltersToStorage({
        salesRep: salesRepFilterEl?.value,
        dealStage: dealStageFilterEl?.value,
        forecastMonth: forecastMonthFilterEl?.value,
        search: searchDealFilterEl?.value,
        startDate: startDateFilterEl?.value,
        endDate: endDateFilterEl?.value,
        sortKey: currentSort.key,
        sortDir: currentSort.direction,
        page: 1
      });
    });
  });
  // --- Pagination Controls ---
  function setupPaginationControls(filteredCount) {
    const buttons = document.querySelectorAll(".pagination-button");
    if (buttons.length === 2) {
      buttons[0].onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          saveFiltersToStorage({
            salesRep: salesRepFilterEl?.value,
            dealStage: dealStageFilterEl?.value,
            forecastMonth: forecastMonthFilterEl?.value,
            search: searchDealFilterEl?.value,
            startDate: startDateFilterEl?.value,
            endDate: endDateFilterEl?.value,
            sortKey: currentSort.key,
            sortDir: currentSort.direction,
            page: currentPage
          });
          applyFiltersAndRefreshUI();
        }
      };
      buttons[1].onclick = () => {
        if (currentPage * rowsPerPage < filteredCount) {
          currentPage++;
          saveFiltersToStorage({
            salesRep: salesRepFilterEl?.value,
            dealStage: dealStageFilterEl?.value,
            forecastMonth: forecastMonthFilterEl?.value,
            search: searchDealFilterEl?.value,
            startDate: startDateFilterEl?.value,
            endDate: endDateFilterEl?.value,
            sortKey: currentSort.key,
            sortDir: currentSort.direction,
            page: currentPage
          });
          applyFiltersAndRefreshUI();
        }
      };
    }
  }
  console.log("script.js: Applying initial filters...")
  applyFiltersAndRefreshUI() // Apply initial filter state
}

function resetPagination() {
  currentPage = 1;
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
// CHART UPDATING LOGIC (Unchanged from previous fix)
// ==================================
function updateCharts(filteredData) {
  // --- 1. Monthly Forecast Chart Update ---
  if (monthlyForecastChart) {
    // Aggregate forecast and actuals by month
    const monthlyForecastTotals = {}
    const monthlyActualTotals = {}
    filteredData.forEach((deal) => {
      const stageLower = (deal.dealStage || "").toLowerCase()
      const expectedCloseDateInput = deal.expectedCloseDate
      const actualCloseDateInput = deal.actualCloseDate
      const weightedVal = deal.weightedValue || 0
      const totalVal = deal.totalValue || 0
      // Forecast Totals (Open Deals)
      if (
        expectedCloseDateInput &&
        !stageLower.includes("closed") &&
        weightedVal > 0
      ) {
        let monthYear = ""
        if (
          expectedCloseDateInput instanceof Date &&
          !isNaN(expectedCloseDateInput.getTime())
        ) {
          monthYear = expectedCloseDateInput.toISOString().substring(0, 7)
        } else if (
          typeof expectedCloseDateInput === "string" &&
          expectedCloseDateInput.length >= 7
        ) {
          monthYear = expectedCloseDateInput.substring(0, 7)
        }
        if (/^\d{4}-\d{2}$/.test(monthYear)) {
          monthlyForecastTotals[monthYear] =
            (monthlyForecastTotals[monthYear] || 0) + weightedVal
        }
      }
      // Actual Sales Totals (Closed Won Deals)
      if (stageLower === "closed won") {
        if (actualCloseDateInput && totalVal > 0) {
          let monthYear = ""
          if (
            actualCloseDateInput instanceof Date &&
            !isNaN(actualCloseDateInput.getTime())
          ) {
            monthYear = actualCloseDateInput.toISOString().substring(0, 7)
          } else if (
            typeof actualCloseDateInput === "string" &&
            actualCloseDateInput.length >= 7
          ) {
            monthYear = actualCloseDateInput.substring(0, 7)
          }
          if (/^\d{4}-\d{2}$/.test(monthYear)) {
            monthlyActualTotals[monthYear] =
              (monthlyActualTotals[monthYear] || 0) + totalVal
          }
        }
      }
    })
    // Map totals to the specific chart labels
    const monthMap = {
      "Apr-25": "2025-04",
      "May-25": "2025-05",
      "Jun-25": "2025-06",
      "Jul-25": "2025-07",
    }
    const forecastDataArray = monthlyForecastChart.data.labels.map((label) => {
      const targetMonth = monthMap[label]
      return monthlyForecastTotals[targetMonth] || 0
    })
    const actualDataArray = monthlyForecastChart.data.labels.map((label) => {
      const targetMonth = monthMap[label]
      return monthlyActualTotals[targetMonth] !== undefined
        ? monthlyActualTotals[targetMonth]
        : null
    })
    monthlyForecastChart.data.datasets[0].data = forecastDataArray
    monthlyForecastChart.data.datasets[1].data = actualDataArray
    monthlyForecastChart.update()
  }
  // --- 2. Deal Stage Chart Update ---
  if (dealStageChart) {
    const stageCounts = {}
    let pipelineValue = 0
    filteredData.forEach((deal) => {
      const stage = deal.dealStage || "Unknown"
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
      if (!(stage || "").toLowerCase().includes("closed")) {
        pipelineValue += deal.weightedValue || 0
      }
    })
    const sortedStages = Object.keys(stageCounts).sort(
      (a, b) => stageCounts[b] - stageCounts[a]
    )
    dealStageChart.data.labels = sortedStages
    dealStageChart.data.datasets[0].data = sortedStages.map(
      (stage) => stageCounts[stage]
    )
    dealStageChart.data.datasets[0].backgroundColor = sortedStages.map(
      (stage) => chartColors[stage] || chartColors.default
    )
    if (dealStageChart.options.plugins.doughnutlabel) {
      dealStageChart.options.plugins.doughnutlabel.labels[0].text =
        "฿" + (pipelineValue || 0).toLocaleString("en-US")
      dealStageChart.options.plugins.doughnutlabel.labels[1].text =
        "Pipeline Value"
    }
    dealStageChart.update()
  }
  // --- 3. Sales Performance Chart Update ---
  if (salesPerformanceChart) {
    const repTotals = {}
    filteredData.forEach((deal) => {
      const rep = deal.salesRep || "Unknown"
      repTotals[rep] = (repTotals[rep] || 0) + (deal.weightedValue || 0)
    })
    const sortedReps = Object.keys(repTotals).sort(
      (a, b) => repTotals[b] - repTotals[a]
    )
    salesPerformanceChart.data.labels = sortedReps
    salesPerformanceChart.data.datasets[0].data = sortedReps.map(
      (rep) => repTotals[rep]
    )
    salesPerformanceChart.data.datasets[0].backgroundColor = sortedReps.map(
      (_, i) => salesRepColors[i % salesRepColors.length]
    )
    salesPerformanceChart.update()
  }
}
