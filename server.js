// server.js - Local development server
const express = require("express")
const cors = require("cors")
const path = require("path")
const apiHandler = require("./api/getSheetData")

const app = express()
const PORT = process.env.PORT || 3000

// Enable CORS
app.use(cors())

// Serve static files
app.use(express.static(path.join(__dirname)))

// Handle API requests
app.get("/api/getSheetData", (req, res) => {
  apiHandler(req, res)
})

// Serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(
    `API endpoint available at http://localhost:${PORT}/api/getSheetData`
  )
})
