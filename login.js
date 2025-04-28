// login.js
// Simple authentication for demo
const AUTH_USER = "bgrimmtech"
const AUTH_PASS = "lifecycle"
const AUTH_KEY = "orderforecast_auth"

document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault()
  const username = document.getElementById("username").value.trim()
  const password = document.getElementById("password").value
  const errorDiv = document.getElementById("login-error")
  if (username === AUTH_USER && password === AUTH_PASS) {
    localStorage.setItem(AUTH_KEY, "1")
    window.location.href = "index.html"
  } else {
    errorDiv.textContent = "Invalid username or password."
    errorDiv.style.display = "block"
  }
})

// If already logged in, redirect to index.html
if (localStorage.getItem(AUTH_KEY) === "1") {
  window.location.href = "index.html"
}
