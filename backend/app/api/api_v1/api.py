from fastapi import APIRouter

from app.api.api_v1.endpoints import forecasts, sheets, auth, deals

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(sheets.router, prefix="/sheets", tags=["google sheets"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
