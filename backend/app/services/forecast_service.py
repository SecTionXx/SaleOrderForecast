from typing import List, Optional
import numpy as np
import pandas as pd
from datetime import date, datetime, timedelta
import uuid

from app.schemas.forecast import ForecastParameters, ForecastResponse, ForecastDataPoint, ForecastType
from app.schemas.user import User
from app.services.sheets_service import SheetsService


class ForecastService:
    """
    Service for generating sales forecasts.
    
    Handles different forecasting methods and data processing.
    """
    
    def __init__(self, sheets_service: SheetsService = None):
        """
        Initialize the forecast service with dependencies.
        
        Args:
            sheets_service: Service for accessing Google Sheets data
        """
        self.sheets_service = sheets_service or SheetsService()
    
    async def get_forecasts(self, params: ForecastParameters, user: User) -> List[ForecastResponse]:
        """
        Generate forecasts based on the provided parameters.
        
        Args:
            params: Forecast parameters including date range and filters
            user: Current authenticated user
            
        Returns:
            List of forecast responses
        """
        # Fetch historical data from Google Sheets
        historical_data = await self.sheets_service.get_sales_data(
            start_date=params.start_date - timedelta(days=90),  # Get 90 days of history
            end_date=params.start_date - timedelta(days=1),
            sales_rep_id=params.sales_rep_id,
            category=params.category
        )
        
        # Generate forecast based on the type
        if params.forecast_type == ForecastType.BASIC:
            return await self._generate_basic_forecast(historical_data, params)
        elif params.forecast_type == ForecastType.ADVANCED:
            return await self._generate_advanced_forecast(historical_data, params)
        elif params.forecast_type == ForecastType.PREDICTIVE:
            return await self._generate_predictive_forecast(historical_data, params)
        else:
            # Default to basic forecast
            return await self._generate_basic_forecast(historical_data, params)
    
    async def generate_advanced_forecast(self, params: ForecastParameters, user: User) -> List[ForecastResponse]:
        """
        Generate advanced forecasts with more options.
        
        Args:
            params: Forecast parameters with advanced options
            user: Current authenticated user
            
        Returns:
            List of forecast responses
        """
        # This is just a wrapper around the internal method
        historical_data = await self.sheets_service.get_sales_data(
            start_date=params.start_date - timedelta(days=180),  # Get more history for advanced
            end_date=params.start_date - timedelta(days=1),
            sales_rep_id=params.sales_rep_id,
            category=params.category
        )
        
        return await self._generate_advanced_forecast(historical_data, params)
    
    async def _generate_basic_forecast(self, historical_data: pd.DataFrame, params: ForecastParameters) -> List[ForecastResponse]:
        """
        Generate a basic forecast using simple moving average.
        
        Args:
            historical_data: DataFrame with historical sales data
            params: Forecast parameters
            
        Returns:
            List containing a single forecast response
        """
        # Calculate date range for forecast
        date_range = pd.date_range(start=params.start_date, end=params.end_date)
        
        # Simple moving average forecast
        if historical_data.empty:
            # No historical data, use zeros
            forecast_values = np.zeros(len(date_range))
        else:
            # Use mean of historical data
            mean_value = historical_data['value'].mean()
            forecast_values = np.ones(len(date_range)) * mean_value
        
        # Create data points
        data_points = []
        for i, d in enumerate(date_range):
            data_points.append(
                ForecastDataPoint(
                    date=d.date(),
                    value=float(forecast_values[i]),
                    is_actual=False
                )
            )
        
        # Create forecast response
        forecast_id = f"forecast-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"
        forecast = ForecastResponse(
            id=forecast_id,
            created_at=datetime.now(),
            parameters=params,
            data_points=data_points,
            metadata={
                "model_type": "simple_moving_average",
                "data_points_count": len(data_points)
            }
        )
        
        return [forecast]
    
    async def _generate_advanced_forecast(self, historical_data: pd.DataFrame, params: ForecastParameters) -> List[ForecastResponse]:
        """
        Generate an advanced forecast using linear regression.
        
        Args:
            historical_data: DataFrame with historical sales data
            params: Forecast parameters
            
        Returns:
            List containing a single forecast response
        """
        # Calculate date range for forecast
        date_range = pd.date_range(start=params.start_date, end=params.end_date)
        
        # Advanced forecast using linear regression
        if historical_data.empty or len(historical_data) < 5:
            # Not enough data for regression, fall back to basic
            return await self._generate_basic_forecast(historical_data, params)
        
        # Prepare data for regression
        historical_data['days'] = (historical_data['date'] - historical_data['date'].min()).dt.days
        
        # Simple linear regression
        X = historical_data['days'].values.reshape(-1, 1)
        y = historical_data['value'].values
        
        # Calculate slope and intercept manually
        mean_x = np.mean(X)
        mean_y = np.mean(y)
        slope = np.sum((X - mean_x) * (y - mean_y)) / np.sum((X - mean_x) ** 2)
        intercept = mean_y - slope * mean_x
        
        # Generate forecast
        forecast_days = [(pd.Timestamp(d) - historical_data['date'].min()).days for d in date_range]
        forecast_values = intercept + slope * np.array(forecast_days)
        
        # Calculate confidence intervals if requested
        confidence_lower = None
        confidence_upper = None
        
        if params.confidence_level:
            # Simple approximation of confidence intervals
            residuals = y - (intercept + slope * X.flatten())
            std_error = np.std(residuals)
            z_score = 1.96  # Approximately 95% confidence
            
            margin = z_score * std_error
            confidence_lower = forecast_values - margin
            confidence_upper = forecast_values + margin
        
        # Create data points
        data_points = []
        for i, d in enumerate(date_range):
            data_point = ForecastDataPoint(
                date=d.date(),
                value=float(forecast_values[i]),
                is_actual=False
            )
            
            if confidence_lower is not None and confidence_upper is not None:
                data_point.confidence_lower = float(confidence_lower[i])
                data_point.confidence_upper = float(confidence_upper[i])
            
            data_points.append(data_point)
        
        # Create forecast response
        forecast_id = f"forecast-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"
        forecast = ForecastResponse(
            id=forecast_id,
            created_at=datetime.now(),
            parameters=params,
            data_points=data_points,
            metadata={
                "model_type": "linear_regression",
                "slope": float(slope),
                "intercept": float(intercept),
                "data_points_count": len(data_points)
            }
        )
        
        return [forecast]
    
    async def _generate_predictive_forecast(self, historical_data: pd.DataFrame, params: ForecastParameters) -> List[ForecastResponse]:
        """
        Generate a predictive forecast using more advanced statistical methods.
        
        Args:
            historical_data: DataFrame with historical sales data
            params: Forecast parameters
            
        Returns:
            List containing a single forecast response
        """
        # This would use more advanced methods like ARIMA, Prophet, etc.
        # For now, we'll just use the advanced forecast as a placeholder
        return await self._generate_advanced_forecast(historical_data, params)
