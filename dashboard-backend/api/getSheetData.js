// api/getSheetData.js
// Using node-fetch v2 for broader compatibility (CommonJS)
const fetch = require("node-fetch")

// Load environment variables locally using dotenv (optional but recommended for local dev)
// npm install dotenv
// Run locally with: node -r dotenv/config api/getSheetData.js (or use nodemon)
// For deployment, environment variables are set directly on the platform.
require("dotenv").config()

// Environment variables (use process.env)
const apiKey = process.env.GOOGLE_API_KEY
const sheetId = process.env.GOOGLE_SHEET_ID
const sheetName = process.env.SHEET_NAME || "Sheet1" // Default if not set
const sheetRange = process.env.SHEET_RANGE || "A2:M" // Default if not set

// --- Serverless Function Handler ---
// The exact signature might vary slightly based on platform (Vercel, Netlify, GCP, AWS)
// This example uses a common pattern compatible with Vercel/Netlify.
exports.getSheetData = async (req, res) => {
  console.log("Backend function invoked...")

  // --- Security: Check Environment Variables ---
  if (!apiKey || !sheetId) {
    console.error(
      "Error: Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID environment variables on the server."
    )
    // Send a generic error to the client, log specific error server-side
    res.status(500).json({ error: "Server configuration error." })
    return
  }

  console.log("GOOGLE_API_KEY exists:", !!apiKey)
  console.log("GOOGLE_SHEET_ID:", sheetId)
  console.log("SHEET_NAME:", sheetName)
  console.log("SHEET_RANGE:", sheetRange)

  // --- CORS Headers ---
  // IMPORTANT: In production, restrict this to your actual frontend domain
  // e.g., res.setHeader('Access-Control-Allow-Origin', 'https://your-dashboard-domain.com');
  res.setHeader("Access-Control-Allow-Origin", "*") // Allow all origins (for development)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS") // Allow GET and preflight OPTIONS requests
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle OPTIONS preflight request (important for CORS)
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request.")
    res.status(200).end()
    return
  }

  // Only proceed for GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "OPTIONS"])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    return
  }

  // --- Call Google Sheets API ---
  const range = `${sheetName}!${sheetRange}`
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}`
  const params = new URLSearchParams({
    key: apiKey,
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  })
  const apiUrl = `${baseUrl}?${params}`

  console.log(`Backend fetching from Google Sheets API (Range: ${range})...`)

  try {
    const googleResponse = await fetch(apiUrl)
    const data = await googleResponse.json() // Always try to parse JSON

    console.log("Google Sheets API Status:", googleResponse.status)

    if (!googleResponse.ok) {
      // Forward the error from Google Sheets API if possible
      const errorMessage =
        data?.error?.message ||
        `Google Sheets API error! Status: ${googleResponse.status}`
      console.error("Google Sheets API Error:", data?.error)
      // Send appropriate status code back to client
      res.status(googleResponse.status || 500).json({ error: errorMessage })
      return
    }

    // --- Success ---
    console.log(
      `Successfully fetched ${data.values ? data.values.length : 0} rows.`
    )
    // Send only the relevant 'values' array back to the frontend
    res.status(200).json({ values: data.values || [] }) // Send empty array if values missing
  } catch (error) {
    console.error(
      "Backend Error fetching or processing Google Sheet data:",
      error,
      error.stack
    )
    res.status(500).json({ error: `Internal Server Error: ${error.message}` })
  }
}
