// data.js

// --- Use backend API endpoint ---
const BACKEND_API_URL = "/api/getSheetData"

/**
 * Converts a Google Sheet/Excel serial number date to a JavaScript Date object.
 */
function serialNumberToDate(serial) {
  if (typeof serial !== "number" || isNaN(serial) || serial <= 0) {
    return null
  }
  const daysToMilliseconds = 24 * 60 * 60 * 1000
  const epochAdjustment = serial > 60 ? 25569 : 25568
  const utcMilliseconds = (serial - epochAdjustment) * daysToMilliseconds
  return new Date(utcMilliseconds)
}

// --- Data Fetching Function ---
async function fetchDataFromSheet() {
  console.log("data.js: Fetching data from backend API:", BACKEND_API_URL)
  try {
    const response = await fetch(BACKEND_API_URL)
    const data = await response.json()
    console.log("data.js: Backend Response Status:", response.status)

    if (!response.ok) {
      const errorMessage =
        data?.error || `HTTP error! Status: ${response.status}`
      console.error("data.js: Backend API Error:", errorMessage)
      throw new Error(errorMessage)
    }
    if (
      !data.values ||
      !Array.isArray(data.values) ||
      data.values.length === 0
    ) {
      console.warn("data.js: No data rows found in backend response.")
      return []
    }
    console.log(`data.js: Processing ${data.values.length} rows from backend.`)

    // --- Data Transformation ---
    return data.values.map((row, index) => {
      const totalValue = parseFloat(row[4]) || 0
      const probabilityPercent = parseFloat(row[5]) || 0
      const weightedValue =
        parseFloat(row[6]) || (totalValue * probabilityPercent) / 100

      const processDateValue = (rawValue) => {
        if (typeof rawValue === "number" && rawValue > 0)
          return serialNumberToDate(rawValue)
        if (typeof rawValue === "string" && rawValue.trim())
          return rawValue.trim()
        return null
      }
      const dateCreated = processDateValue(row[1])
      const expectedCloseDate = processDateValue(row[8])
      const lastUpdated = processDateValue(row[10])
      const actualCloseDate = processDateValue(row[12])

      return {
        dealId: String(row[0] || `GEN-${index + 1}`).trim(),
        customerName: String(row[2] || "N/A").trim(),
        projectName: String(row[3] || "N/A").trim(),
        dealStage: String(row[7] || "Unknown").trim(),
        salesRep: String(row[9] || "Unknown").trim(),
        notes: String(row[11] || "").trim(),
        totalValue: totalValue,
        probabilityPercent: probabilityPercent,
        weightedValue: weightedValue,
        dateCreated: dateCreated,
        expectedCloseDate: expectedCloseDate,
        lastUpdated: lastUpdated,
        actualCloseDate: actualCloseDate,
      }
    })
  } catch (error) {
    console.error(
      "data.js: Failed to fetch or process data from backend:",
      error
    )
    throw error
  }
}

// --- Export ---
export { fetchDataFromSheet }
