from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.api_v1.api import api_router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Sales Order Forecast API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Custom OpenAPI documentation
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} - Swagger UI",
        oauth2_redirect_url=None,
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )

@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint():
    return get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Sales Order Forecast API",
        routes=app.routes,
    )

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "message": "Service is healthy"}
