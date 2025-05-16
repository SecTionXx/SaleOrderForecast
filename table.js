// table.js - Enhanced table functionality for Order Forecast Dashboard

// --- Row Detail Expansion ---
function initializeRowDetails() {
  document.addEventListener("click", function (event) {
    // Check if the clicked element is a "View Details" action button
    if (event.target.closest(".action-button-view")) {
      const row = event.target.closest("tr")
      if (!row) return

      // Get or create the details row
      let detailsRow = row.nextElementSibling
      if (!detailsRow || !detailsRow.classList.contains("row-details")) {
        // Create a new details row if it doesn't exist
        detailsRow = createDetailsRow(row)
        row.parentNode.insertBefore(detailsRow, row.nextSibling)
      }

      // Toggle visibility
      if (detailsRow.classList.contains("expanded")) {
        detailsRow.classList.remove("expanded")
      } else {
        // Close any other open details rows
        document
          .querySelectorAll(".row-details.expanded")
          .forEach((openRow) => {
            openRow.classList.remove("expanded")
          })
        detailsRow.classList.add("expanded")
      }
    }
  })
}

// Create a details row with additional information
function createDetailsRow(parentRow) {
  const dealId = parentRow.dataset.dealId || "N/A"
  const dateCreated = parentRow.dataset.dateCreated || "N/A"
  const lastUpdated = parentRow.dataset.lastUpdated || "N/A"
  const notes = parentRow.dataset.notes || "No notes available."

  // Create the row
  const detailsRow = document.createElement("tr")
  detailsRow.className = "row-details"

  // Create the content cell that spans all columns
  const contentCell = document.createElement("td")
  contentCell.colSpan = 11 // Span all columns

  // Create the details content
  contentCell.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1">Deal ID: <span class="deal-id-chip">${dealId}</span></p>
        <p class="text-sm text-gray-600 mb-1">Created: <span>${dateCreated}</span></p>
        <p class="text-sm text-gray-600">Last Modified: <span>${lastUpdated}</span></p>
      </div>
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1">Notes:</p>
        <p class="text-sm text-gray-600 italic">${notes}</p>
      </div>
    </div>
  `

  detailsRow.appendChild(contentCell)
  return detailsRow
}

// --- Row Selection ---
function initializeRowSelection() {
  document.addEventListener("click", function (event) {
    const row = event.target.closest("tr")
    if (!row || row.classList.contains("row-details")) return

    // Don't select if clicking an action button
    if (event.target.closest(".action-button")) return

    // Toggle selection
    row.classList.toggle("selected-row")
  })
}

// --- Enhanced Pagination Functions ---
function initializePagination(totalItems, itemsPerPage = 50) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginationContainer = document.querySelector(".pagination-buttons")

  if (!paginationContainer) return

  // Clear previous pagination
  paginationContainer.innerHTML = ""

  // Previous button
  const prevButton = document.createElement("button")
  prevButton.className = "pagination-button"
  prevButton.id = "prev-page"
  prevButton.disabled = true
  prevButton.innerHTML = '<span data-feather="chevron-left"></span>'
  paginationContainer.appendChild(prevButton)

  // Page buttons - limit to max 5 pages
  const maxDisplayPages = 5
  const pagesToShow = Math.min(totalPages, maxDisplayPages)

  for (let i = 1; i <= pagesToShow; i++) {
    const pageButton = document.createElement(i === 1 ? "span" : "button")
    pageButton.className = "pagination-button" + (i === 1 ? " active" : "")
    pageButton.id = `page-${i}`
    pageButton.textContent = i
    paginationContainer.appendChild(pageButton)
  }

  // Add ellipsis if more pages exist
  if (totalPages > maxDisplayPages) {
    const ellipsis = document.createElement("span")
    ellipsis.className = "pagination-ellipsis"
    ellipsis.textContent = "..."
    paginationContainer.appendChild(ellipsis)
  }

  // Next button
  const nextButton = document.createElement("button")
  nextButton.className = "pagination-button"
  nextButton.id = "next-page"
  nextButton.disabled = totalPages <= 1
  nextButton.innerHTML = '<span data-feather="chevron-right"></span>'
  paginationContainer.appendChild(nextButton)

  // If we have feather icons, replace them
  if (window.feather && typeof window.feather.replace === "function") {
    window.feather.replace()
  }

  // Add event listeners
  setupPaginationListeners(totalPages, itemsPerPage)

  return {
    totalPages,
    currentPage: 1,
  }
}

function setupPaginationListeners(totalPages, itemsPerPage) {
  const prevButton = document.getElementById("prev-page")
  const nextButton = document.getElementById("next-page")

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      if (this.disabled) return
      const currentPage = getCurrentPage()
      if (currentPage > 1) {
        goToPage(currentPage - 1, totalPages, itemsPerPage)
      }
    })
  }

  if (nextButton) {
    nextButton.addEventListener("click", function () {
      if (this.disabled) return
      const currentPage = getCurrentPage()
      if (currentPage < totalPages) {
        goToPage(currentPage + 1, totalPages, itemsPerPage)
      }
    })
  }

  // Add listeners to page number buttons
  document.querySelectorAll(".pagination-button").forEach((button) => {
    if (button.id && button.id.startsWith("page-")) {
      button.addEventListener("click", function () {
        const pageNum = parseInt(this.textContent)
        if (!isNaN(pageNum)) {
          goToPage(pageNum, totalPages, itemsPerPage)
        }
      })
    }
  })
}

function getCurrentPage() {
  const activeButton = document.querySelector(".pagination-button.active")
  return activeButton ? parseInt(activeButton.textContent) : 1
}

function goToPage(pageNumber, totalPages, itemsPerPage) {
  // Update active state
  document.querySelectorAll(".pagination-button").forEach((button) => {
    if (button.textContent === pageNumber.toString()) {
      button.classList.add("active")
    } else {
      button.classList.remove("active")
    }
  })

  // Update disabled state for prev/next buttons
  const prevButton = document.getElementById("prev-page")
  const nextButton = document.getElementById("next-page")

  if (prevButton) prevButton.disabled = pageNumber === 1
  if (nextButton) nextButton.disabled = pageNumber === totalPages

  // Update pagination info text
  const startItem = (pageNumber - 1) * itemsPerPage + 1
  const endItem = Math.min(pageNumber * itemsPerPage, totalPages * itemsPerPage)
  const totalItems = totalPages * itemsPerPage

  const paginationInfo = document.getElementById("pagination-info")
  if (paginationInfo) {
    paginationInfo.innerHTML = `
      Showing <span class="font-medium">${startItem}</span> to 
      <span class="font-medium">${endItem}</span> of 
      <span class="font-medium">${totalItems}</span> entries
    `
  }

  // Custom event to notify other components about page change
  document.dispatchEvent(
    new CustomEvent("pageChanged", {
      detail: { page: pageNumber },
    })
  )
}

// --- Status Badge Formatter ---
function getStatusBadgeClass(dealStage) {
  const stageLower = (dealStage || "").toLowerCase()

  // Updated to match our new CSS classes with more refined styling
  if (stageLower === "proposal sent") return "deal-stage proposal-sent"
  if (stageLower.includes("negotiation")) return "deal-stage negotiation"
  if (stageLower === "verbal agreement") return "deal-stage verbal-agreement"
  if (stageLower === "closed won") return "deal-stage closed-won"
  if (stageLower === "closed lost") return "deal-stage closed-lost"
  if (stageLower === "lead") return "deal-stage lead"

  return "deal-stage" // Default
}

// --- Cell Formatters with Enhanced Styling ---
function formatDealStageCell(dealStage) {
  const stageClass = getStatusBadgeClass(dealStage)
  // Add icon based on stage type
  let icon = ""
  const stageLower = (dealStage || "").toLowerCase()

  if (stageLower === "closed won") {
    icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
  } else if (stageLower === "closed lost") {
    icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  } else if (stageLower === "proposal sent") {
    icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'
  } else if (stageLower.includes("negotiation")) {
    icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
  } else if (stageLower === "lead") {
    icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'
  }

  return `<span class="${stageClass}">${icon} ${dealStage}</span>`
}

function formatCurrencyCell(value) {
  // Format numeric values as currency with more refined styling
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '<span class="text-gray-400">-</span>'

  // Add classes based on value
  let valueClass = ""
  if (numValue >= 1000000) {
    valueClass = "high-value"
  } else if (numValue >= 500000) {
    valueClass = "medium-value"
  }

  const formattedValue = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)

  return `<span class="currency-value ${valueClass}">${formattedValue}</span>`
}

function formatPercentCell(value) {
  // Format numeric values as percentages with color coding
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '<span class="text-gray-400">-</span>'

  let percentClass = ""
  if (numValue >= 70) {
    percentClass = "high-percent"
  } else if (numValue >= 30) {
    percentClass = "medium-percent"
  } else {
    percentClass = "low-percent"
  }

  return `<span class="percent-value ${percentClass}">${numValue}%</span>`
}

function formatDateCell(dateStr) {
  // Format date values with better styling
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '<span class="text-gray-400">-</span>'

    // Check if date is past due (before today)
    let dateClass = ""
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) {
      dateClass = "past-due-date"
    } else if (date <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
      // Within next 14 days
      dateClass = "upcoming-date"
    }

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)

    return `<span class="date-value ${dateClass}">${formattedDate}</span>`
  } catch (e) {
    return '<span class="text-gray-400">-</span>'
  }
}

// --- Action Buttons with Enhanced Styling ---
function createActionButtons(dealId) {
  return `
    <div class="action-buttons">
      <button class="action-button action-button-view" title="View Details">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
      <button class="action-button action-button-edit edit-deal-btn" title="Edit Deal">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="action-button action-button-history view-history-btn" title="View History">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </button>
      <button class="action-button action-button-comment" title="Comment">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>
    </div>
  `
}

// --- Table Row Generator with Improved Styling ---
function generateTableRow(item, options = {}) {
  // Handle missing data gracefully
  if (!item) return ""

  // Extract options
  const { stageBadgeClass, displayCloseDate, ageDays, pastDueClass } = options;

  // Generate HTML for each cell with proper formatting
  return `
    <tr class="${pastDueClass || ''}" data-deal-id="${item.dealId || ""}" 
        data-date-created="${item.dateCreated || ""}" 
        data-last-updated="${item.lastUpdated || ""}"
        data-notes="${item.notes || ""}">
      <td class="td-style">${
        item.customerName || '<span class="text-gray-400">Unknown</span>'
      }</td>
      <td class="td-style">
        ${
          item.projectName ||
          '<span class="text-gray-400">Untitled Project</span>'
        }
        ${
          item.notes
            ? `<span class="notes-indicator" title="${item.notes}">📝</span>`
            : ""
        }
      </td>
      <td class="td-style text-right">${formatCurrencyCell(
        item.totalValue
      )}</td>
      <td class="td-style text-center">${formatPercentCell(
        item.probabilityPercent
      )}</td>
      <td class="td-style text-right">${formatCurrencyCell(
        item.weightedValue
      )}</td>
      <td class="td-style">${formatDealStageCell(item.dealStage)}</td>
      <td class="td-style text-center">${formatDateCell(
        item.expectedCloseDate
      )}</td>
      <td class="td-style">${
        item.salesRep || '<span class="text-gray-400">Unassigned</span>'
      }</td>
      <td class="td-style text-center">${formatDateCell(item.lastUpdated)}</td>
      <td class="td-style text-center">
        ${
          typeof item.ageDays === "number"
            ? `<span class="age-days ${item.ageDays > 45 ? "stale-age" : ""}">${
                item.ageDays
              }</span>`
            : '<span class="text-gray-400">-</span>'
        }
      </td>
      <td class="td-style text-center action-cell">${createActionButtons(
        item.id
      )}</td>
    </tr>
  `
}

// --- Export functions ---
export {
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
}
