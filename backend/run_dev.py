"""
Development server script for SaleOrderForecast FastAPI backend.
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Run the application with hot reload
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info"
    )
    print("FastAPI server running at http://localhost:8000")
