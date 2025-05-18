"""
Minimal FastAPI application to test the setup.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

# Create a simple Pydantic model
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

# Initialize FastAPI app
app = FastAPI(
    title="Minimal FastAPI App",
    description="A minimal FastAPI application for testing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for testing
items = []

# Root endpoint with API documentation
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    # Get all registered routes
    url_list = [
        {"path": route.path, "name": route.name, "methods": list(route.methods)}
        for route in request.app.routes
    ]
    
    # Filter out non-API routes (like static files)
    api_routes = [
        route for route in url_list 
        if not route["path"].startswith("/static") and route["path"] != "/"
    ]
    
    # Generate HTML response
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sale Order Forecast API</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                color: #333;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            .endpoint {
                background: #f5f5f5;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #4CAF50;
            }
            .method {
                display: inline-block;
                background: #4CAF50;
                color: white;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 0.9em;
                margin-right: 10px;
                font-family: monospace;
            }
            .path {
                font-family: monospace;
                font-size: 1.1em;
                font-weight: bold;
            }
            .description {
                margin-top: 10px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <h1>Sale Order Forecast API</h1>
        <p>Welcome to the Sale Order Forecast API. Below are the available endpoints:</p>
        <div id="endpoints">
    """
    
    # Add each endpoint to the HTML
    for route in api_routes:
        methods = ", ".join(route["methods"])
        path = route["path"]
        name = route["name"].replace("_", " ").title() if route["name"] else ""
        
        # Add description based on path
        description = ""
        if "health" in path:
            description = "Check if the API is running"
        elif "/items" in path and "{" not in path:
            if "GET" in methods:
                description = "Get all items"
            elif "POST" in methods:
                description = "Create a new item"
        elif "/items/{" in path:
            description = "Get a specific item by ID"
        
        html_content += f"""
        <div class="endpoint">
            <div>
                <span class="method">{methods}</span>
                <span class="path">{path}</span>
            </div>
            <div class="description">
                {name}: {description}
            </div>
        </div>
        """
    
    # Close HTML
    html_content += """
        </div>
        <p>For detailed API documentation, visit the <a href="/docs">API documentation</a>.</p>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content, status_code=200)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Create item endpoint
@app.post("/items/")
async def create_item(item: Item):
    items.append(item)
    return item

# Get items endpoint
@app.get("/items/", response_model=List[Item])
async def read_items():
    return items

# Get item by ID endpoint
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    if item_id < 0 or item_id >= len(items):
        raise HTTPException(status_code=404, detail="Item not found")
    return items[item_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("minimal_fastapi:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
