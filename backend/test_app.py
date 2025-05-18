import sys
import asyncio
from fastapi import FastAPI
from app.core.config import settings

def test_app():
    try:
        app = FastAPI(
            title=settings.PROJECT_NAME,
            description="Sales Order Forecast API",
            version="1.0.0",
            docs_url=None,
            redoc_url=None,
            openapi_url=f"{settings.API_V1_STR}/openapi.json"
        )
        print("✅ Successfully created FastAPI app with settings:")
        print(f"  - PROJECT_NAME: {settings.PROJECT_NAME}")
        print(f"  - API_V1_STR: {settings.API_V1_STR}")
        print(f"  - CORS_ORIGINS: {settings.CORS_ORIGINS}")
        print(f"  - GOOGLE_SHEETS_API_KEY: {'*' * 8 if settings.GOOGLE_SHEETS_API_KEY else 'Not set'}")
        print(f"  - GOOGLE_SHEETS_ID: {settings.GOOGLE_SHEETS_ID}")
        return True
    except Exception as e:
        print(f"❌ Error creating FastAPI app: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    test_app()
