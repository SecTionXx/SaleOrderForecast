from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import date

from app.api.deps import get_current_active_user, get_current_admin_user
from app.schemas.user import User

router = APIRouter()

@router.get("/")
async def get_deals(
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    sales_rep_id: Optional[int] = Query(None, description="Filter by sales rep ID"),
    category: Optional[str] = Query(None, description="Filter by deal category"),
    status: Optional[str] = Query(None, description="Filter by deal status"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get deals with optional filtering.
    
    Requires authentication.
    """
    # This would normally fetch from a database
    # For now, return mock data
    return {
        "data": [
            {
                "id": 1,
                "title": "Enterprise Deal A",
                "value": 150000,
                "sales_rep_id": 1,
                "category": "enterprise",
                "status": "negotiation",
                "created_at": "2025-01-15T10:00:00Z",
                "expected_close_date": "2025-06-30"
            },
            {
                "id": 2,
                "title": "SMB Deal B",
                "value": 45000,
                "sales_rep_id": 2,
                "category": "smb",
                "status": "proposal",
                "created_at": "2025-02-20T14:30:00Z",
                "expected_close_date": "2025-05-25"
            }
        ],
        "count": 2,
        "filters": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "sales_rep_id": sales_rep_id,
            "category": category,
            "status": status
        }
    }

@router.post("/")
async def create_deal(
    deal_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new deal.
    
    Requires authentication.
    """
    # This would normally save to a database
    return {
        "id": 3,
        "title": deal_data.get("title", "New Deal"),
        "value": deal_data.get("value", 0),
        "sales_rep_id": deal_data.get("sales_rep_id", current_user.id),
        "category": deal_data.get("category", "unknown"),
        "status": deal_data.get("status", "new"),
        "created_at": "2025-05-18T17:00:00Z",
        "expected_close_date": deal_data.get("expected_close_date", "2025-12-31")
    }

@router.get("/{deal_id}")
async def get_deal(
    deal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific deal by ID.
    
    Requires authentication.
    """
    # This would normally fetch from a database
    if deal_id == 1:
        return {
            "id": 1,
            "title": "Enterprise Deal A",
            "value": 150000,
            "sales_rep_id": 1,
            "category": "enterprise",
            "status": "negotiation",
            "created_at": "2025-01-15T10:00:00Z",
            "expected_close_date": "2025-06-30"
        }
    elif deal_id == 2:
        return {
            "id": 2,
            "title": "SMB Deal B",
            "value": 45000,
            "sales_rep_id": 2,
            "category": "smb",
            "status": "proposal",
            "created_at": "2025-02-20T14:30:00Z",
            "expected_close_date": "2025-05-25"
        }
    else:
        raise HTTPException(status_code=404, detail="Deal not found")

@router.put("/{deal_id}")
async def update_deal(
    deal_id: int,
    deal_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing deal.
    
    Requires authentication.
    """
    # This would normally update in a database
    if deal_id not in [1, 2]:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {
        "id": deal_id,
        "title": deal_data.get("title", f"Deal {deal_id}"),
        "value": deal_data.get("value", 0),
        "sales_rep_id": deal_data.get("sales_rep_id", 1),
        "category": deal_data.get("category", "unknown"),
        "status": deal_data.get("status", "updated"),
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-05-18T17:00:00Z",
        "expected_close_date": deal_data.get("expected_close_date", "2025-12-31")
    }

@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: int,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a deal.
    
    Requires admin privileges.
    """
    # This would normally delete from a database
    if deal_id not in [1, 2]:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {"message": f"Deal {deal_id} deleted successfully"}
