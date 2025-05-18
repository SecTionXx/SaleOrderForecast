from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import date

from app.services.sheets_service import SheetsService
from app.api.deps import get_current_active_user
from app.schemas.user import User

router = APIRouter()

@router.get("/data")
async def get_sheet_data(
    start_date: date = Query(..., description="Start date for data range"),
    end_date: date = Query(..., description="End date for data range"),
    sales_rep_id: Optional[int] = Query(None, description="Filter by sales rep ID"),
    category: Optional[str] = Query(None, description="Filter by deal category"),
    current_user: User = Depends(get_current_active_user),
    sheets_service: SheetsService = Depends()
):
    """
    Get data from Google Sheets for the specified date range.
    
    Filters can be applied for specific sales reps or deal categories.
    Requires authentication.
    """
    try:
        # Get data from Google Sheets
        df = await sheets_service.get_sales_data(
            start_date=start_date,
            end_date=end_date,
            sales_rep_id=sales_rep_id,
            category=category
        )
        
        # Convert DataFrame to list of dictionaries
        result = df.to_dict(orient="records")
        
        return {
            "data": result,
            "count": len(result),
            "filters": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "sales_rep_id": sales_rep_id,
                "category": category
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sheet data: {str(e)}"
        )
