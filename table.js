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

  if (stageLower === "proposal sent") return "status-badge proposal-sent"
  if (stageLower.includes("negotiation")) return "status-badge negotiation"
  if (stageLower === "verbal agreement") return "status-badge verbal-agreement"
  if (stageLower === "closed won") return "status-badge closed-won"
  if (stageLower === "closed lost") return "status-badge closed-lost"

  return "status-badge" // Default
}

// --- Export functions ---
export {
  initializeRowDetails,
  initializeRowSelection,
  initializePagination,
  getStatusBadgeClass,
}
