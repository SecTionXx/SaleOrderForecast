const fetch = require("node-fetch")
require("dotenv").config()

const apiKey = process.env.GOOGLE_API_KEY
const sheetId = process.env.GOOGLE_SHEET_ID
const sheetName = process.env.SHEET_NAME || "Sheet1"
const sheetRange = process.env.SHEET_RANGE || "A2:M"

module.exports = async (req, res) => {
  console.log("Backend function invoked...")

  if (!apiKey || !sheetId) {
    console.error(
      "Error: Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID environment variables on the server."
    )
    res.status(500).json({ error: "Server configuration error." })
    return
  }

  console.log("GOOGLE_API_KEY exists:", !!apiKey)
  console.log("GOOGLE_SHEET_ID:", sheetId)
  console.log("SHEET_NAME:", sheetName)
  console.log("SHEET_RANGE:", sheetRange)

  // Debug: Log all environment variables (do NOT log secrets in production)
  console.log("DEBUG ENV:", {
    GOOGLE_API_KEY_EXISTS: !!apiKey,
    GOOGLE_SHEET_ID: sheetId,
    SHEET_NAME: sheetName,
    SHEET_RANGE: sheetRange,
    NODE_ENV: process.env.NODE_ENV,
    ALL_ENV: Object.keys(process.env),
  })

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request.")
    res.status(200).end()
    return
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "OPTIONS"])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    return
  }

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
    const data = await googleResponse.json()

    console.log("Google Sheets API Status:", googleResponse.status)

    if (!googleResponse.ok) {
      const errorMessage =
        data?.error?.message ||
        `Google Sheets API error! Status: ${googleResponse.status}`
      console.error("Google Sheets API Error:", data?.error)
      res.status(googleResponse.status || 500).json({ error: errorMessage })
      return
    }

    console.log(
      `Successfully fetched ${data.values ? data.values.length : 0} rows.`
    )
    res.status(200).json({ values: data.values || [] })
  } catch (error) {
    console.error(
      "Backend Error fetching or processing Google Sheet data:",
      error,
      error.stack
    )
    res.status(500).json({ error: `Internal Server Error: ${error.message}` })
  }
}
