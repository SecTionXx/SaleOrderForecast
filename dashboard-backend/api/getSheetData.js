// api/getSheetData.js
// (Assumes placement in `api` folder for platforms like Vercel/Netlify)

// Using node-fetch v2 for broader compatibility (CommonJS)
// npm install node-fetch@2
const fetch = require("node-fetch")

// Load environment variables locally using dotenv
// npm install dotenv
// Run locally with: node -r dotenv/config api/getSheetData.js
require("dotenv").config()

// --- Environment Variables ---
const apiKey = process.env.GOOGLE_API_KEY
const sheetId = process.env.GOOGLE_SHEET_ID
const sheetName = process.env.SHEET_NAME || "Sheet1" // Default sheet name
const sheetRange = process.env.SHEET_RANGE || "A2:M" // Default range (adjust as needed)

// --- Serverless Function Handler ---
// Using module.exports for common compatibility (Vercel, Netlify, etc.)
// For GCP, you might need to adjust export based on entry point config.
module.exports = async (req, res) => {
  console.log("Backend: /api/getSheetData invoked...")

  // --- Security: Validate Environment Variables ---
  if (!apiKey || !sheetId) {
    console.error(
      "Backend Error: Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID environment variables."
    )
    res
      .status(500)
      .json({ error: "Server configuration error. Please check logs." })
    return
  }
  // Optional: Log existence confirmation locally but not in production if sensitive
  // console.log("Backend: Required environment variables loaded.");

  // --- CORS Headers ---
  // In production, replace '*' with your specific frontend domain for security
  // Example: const allowedOrigin = 'https://your-dashboard.com';
  const allowedOrigin = "*" // For development or simple cases (less secure)
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // --- Handle CORS Preflight (OPTIONS) Request ---
  if (req.method === "OPTIONS") {
    console.log("Backend: Handling OPTIONS preflight request.")
    res.status(200).end()
    return
  }

  // --- Handle Incorrect Method ---
  if (req.method !== "GET") {
    console.warn(`Backend: Method ${req.method} not allowed.`)
    res.setHeader("Allow", ["GET", "OPTIONS"])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    return
  }

  // --- Prepare Google Sheets API Request ---
  const range = `${sheetName}!${sheetRange}` // e.g., "Sheet1!A2:M"
  // **Revised URL construction: range is part of the path, no extra encoding needed**
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`
  const params = new URLSearchParams({
    key: apiKey,
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  })
  const apiUrl = `${baseUrl}?${params}`

  console.log(`Backend: Fetching from Google Sheets API (Range: ${range})...`)

  try {
    // --- Make the API Call ---
    const googleResponse = await fetch(apiUrl)
    const data = await googleResponse.json() // Try parsing JSON regardless of status

    console.log("Backend: Google Sheets API Status:", googleResponse.status)

    // --- Handle Google API Errors ---
    if (!googleResponse.ok) {
      const errorMessage =
        data?.error?.message ||
        `Google Sheets API error! Status: ${googleResponse.status}`
      console.error(
        "Backend: Google Sheets API Error Response:",
        JSON.stringify(data?.error, null, 2)
      )
      res.status(googleResponse.status || 500).json({ error: errorMessage })
      return
    }

    // --- Success: Send Data to Frontend ---
    console.log(
      `Backend: Successfully fetched ${
        data.values ? data.values.length : 0
      } rows.`
    )
    // Respond with only the 'values' array, defaulting to empty array if missing
    res.status(200).json({ values: data.values || [] })
  } catch (error) {
    // --- Handle Network or Other Unexpected Errors ---
    console.error(
      "Backend: Internal Server Error fetching/processing Google Sheet data:",
      error
    )
    res.status(500).json({ error: `Internal Server Error: ${error.message}` })
  }
}
