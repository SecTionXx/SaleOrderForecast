from typing import Optional, Dict, Any, List
import pandas as pd
from datetime import date, datetime
import httpx
from fastapi import HTTPException

from app.core.config import settings


class SheetsService:
    """
    Service for interacting with Google Sheets API.
    
    Handles fetching and processing data from Google Sheets.
    """
    
    def __init__(self):
        """Initialize the Google Sheets service."""
        self.api_key = settings.GOOGLE_SHEETS_API_KEY
        self.sheet_id = settings.GOOGLE_SHEETS_ID
        
        if not self.api_key or not self.sheet_id:
            raise ValueError("Google Sheets API key and Sheet ID must be configured")
    
    async def get_sales_data(
        self,
        start_date: date,
        end_date: date,
        sales_rep_id: Optional[int] = None,
        category: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Fetch sales data from Google Sheets.
        
        Args:
            start_date: Start date for data range
            end_date: End date for data range
            sales_rep_id: Optional filter by sales rep ID
            category: Optional filter by deal category
            
        Returns:
            DataFrame containing the requested sales data
        """
        try:
            # Fetch raw data from Google Sheets
            raw_data = await self._fetch_sheet_data()
            
            # Convert to DataFrame
            df = pd.DataFrame(raw_data)
            
            # Parse dates
            df['date'] = pd.to_datetime(df['date'])
            
            # Filter by date range
            mask = (df['date'] >= pd.Timestamp(start_date)) & (df['date'] <= pd.Timestamp(end_date))
            df = df[mask]
            
            # Apply additional filters if provided
            if sales_rep_id is not None:
                df = df[df['sales_rep_id'] == sales_rep_id]
                
            if category is not None:
                df = df[df['category'] == category]
            
            return df
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching data from Google Sheets: {str(e)}"
            )
    
    async def _fetch_sheet_data(self) -> List[Dict[str, Any]]:
        """
        Fetch raw data from Google Sheets API.
        
        Returns:
            List of dictionaries containing the sheet data
        """
        # Construct the Google Sheets API URL
        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/{self.sheet_id}/values/A:Z"
            f"?key={self.api_key}"
        )
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Google Sheets API error: {response.text}"
                )
            
            # Process the response
            data = response.json()
            
            if 'values' not in data:
                return []
            
            # Convert to list of dictionaries
            values = data['values']
            if not values:
                return []
            
            headers = values[0]
            result = []
            
            for row in values[1:]:
                # Pad row if needed
                padded_row = row + [''] * (len(headers) - len(row))
                result.append(dict(zip(headers, padded_row)))
            
            return result
