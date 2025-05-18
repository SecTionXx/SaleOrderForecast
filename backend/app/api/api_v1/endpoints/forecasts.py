from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date

from app.schemas.forecast import ForecastResponse, ForecastParameters
from app.services.forecast_service import ForecastService
from app.api.deps import get_current_user
from app.schemas.user import User

router = APIRouter()

@router.get("/", response_model=List[ForecastResponse])
async def get_forecasts(
    start_date: date = Query(..., description="Start date for forecast period"),
    end_date: date = Query(..., description="End date for forecast period"),
    sales_rep_id: Optional[int] = Query(None, description="Filter by sales rep ID"),
    category: Optional[str] = Query(None, description="Filter by deal category"),
    current_user: User = Depends(get_current_user),
    forecast_service: ForecastService = Depends()
):
    """
    Get sales forecasts for the specified period.
    
    Filters can be applied for specific sales reps or deal categories.
    Requires authentication.
    """
    try:
        # Create parameters object
        params = ForecastParameters(
            start_date=start_date,
            end_date=end_date,
            sales_rep_id=sales_rep_id,
            category=category
        )
        
        # Get forecasts using the service
        forecasts = await forecast_service.get_forecasts(params, current_user)
        return forecasts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating forecasts: {str(e)}"
        )

@router.post("/advanced", response_model=List[ForecastResponse])
async def generate_advanced_forecast(
    params: ForecastParameters,
    current_user: User = Depends(get_current_user),
    forecast_service: ForecastService = Depends()
):
    """
    Generate advanced forecasts with custom parameters.
    
    Allows for more complex forecasting options.
    Requires authentication.
    """
    try:
        forecasts = await forecast_service.generate_advanced_forecast(params, current_user)
        return forecasts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating advanced forecasts: {str(e)}"
        )
