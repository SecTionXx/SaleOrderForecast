// api/getSheetData.js
// (Serverless API for Vercel/Netlify)

// Using node-fetch v2 for compatibility
const fetch = require("node-fetch")

// Load environment variables
require("dotenv").config()

// --- Environment Variables ---
const apiKey = process.env.GOOGLE_API_KEY
const sheetId = process.env.GOOGLE_SHEET_ID
const sheetName = process.env.SHEET_NAME || "Sheet1"
const sheetRange = process.env.SHEET_RANGE || "A2:M"

// --- Serverless Function Handler ---
module.exports = async (req, res) => {
  console.log("Backend: /api/getSheetData invoked...")

  // Debug environment for troubleshooting
  console.log("Backend: Environment Check:", {
    nodeEnv: process.env.NODE_ENV,
    hasApiKey: !!apiKey,
    hasSheetId: !!sheetId,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 4) + "..." : "undefined",
    sheetId: sheetId || "undefined",
    sheetName,
    sheetRange,
  })

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

  // --- CORS Headers ---
  const allowedOrigin = "*" // For development
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
  const range = `${sheetName}!${sheetRange}`
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`
  const params = new URLSearchParams({
    key: apiKey,
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  })
  const apiUrl = `${baseUrl}?${params}`

  console.log(`Backend: Fetching Google Sheets data from range: ${range}...`)

  try {
    // --- Make the API Call ---
    const googleResponse = await fetch(apiUrl)
    const data = await googleResponse.json()

    console.log("Backend: Google Sheets API Status:", googleResponse.status)

    // --- Handle Google API Errors ---
    if (!googleResponse.ok) {
      const errorMessage =
        data?.error?.message ||
        `Google Sheets API error! Status: ${googleResponse.status}`
      console.error(
        "Backend: Google Sheets API Error Response:",
        JSON.stringify(data?.error || {}, null, 2)
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
    res.status(200).json({ values: data.values || [] })
  } catch (error) {
    // --- Handle Network or Other Unexpected Errors ---
    console.error(
      "Backend: Error fetching/processing Google Sheet data:",
      error
    )
    res.status(500).json({ error: `Internal Server Error: ${error.message}` })
  }
}
