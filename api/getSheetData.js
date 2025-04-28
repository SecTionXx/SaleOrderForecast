const fetch = require("node-fetch")
require("dotenv").config()

const apiKey = process.env.GOOGLE_API_KEY
const sheetId = process.env.GOOGLE_SHEET_ID
const sheetName = process.env.SHEET_NAME || "Sheet1"
const sheetRange = process.env.SHEET_RANGE || "A2:M"

module.exports = async (req, res) => {
  if (!apiKey || !sheetId) {
    res.status(500).json({ error: "Server configuration error." })
    return
  }

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
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

  try {
    const googleResponse = await fetch(apiUrl)
    const data = await googleResponse.json()
    if (!googleResponse.ok) {
      const errorMessage =
        data?.error?.message ||
        `Google Sheets API error! Status: ${googleResponse.status}`
      res.status(googleResponse.status || 500).json({ error: errorMessage })
      return
    }
    res.status(200).json({ values: data.values || [] })
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` })
  }
}
