import pytest
import pandas as pd
import numpy as np
from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.services.forecast_service import ForecastService
from app.schemas.forecast import ForecastParameters, ForecastType
from app.schemas.user import User, UserRole


@pytest.fixture
def mock_sheets_service():
    """Create a mock sheets service for testing."""
    mock_service = AsyncMock()
    
    # Set up the mock to return test data
    async def get_sales_data(start_date, end_date, sales_rep_id=None, category=None):
        # Create sample historical data
        dates = pd.date_range(start=start_date, end=end_date)
        values = np.linspace(100, 200, len(dates))  # Linear trend from 100 to 200
        
        # Create DataFrame
        df = pd.DataFrame({
            'date': dates,
            'value': values,
            'sales_rep_id': 1,
            'category': 'test'
        })
        
        # Apply filters if provided
        if sales_rep_id is not None:
            df = df[df['sales_rep_id'] == sales_rep_id]
            
        if category is not None:
            df = df[df['category'] == category]
            
        return df
    
    mock_service.get_sales_data.side_effect = get_sales_data
    return mock_service


@pytest.fixture
def test_user():
    """Create a test user for testing."""
    return User(
        id=1,
        email="test@example.com",
        full_name="Test User",
        is_active=True,
        role=UserRole.EDITOR,
        created_at=datetime.now(),
        is_admin=False
    )


@pytest.mark.asyncio
async def test_basic_forecast_generation(mock_sheets_service, test_user):
    """Test basic forecast generation."""
    # Create forecast service with mock sheets service
    forecast_service = ForecastService(sheets_service=mock_sheets_service)
    
    # Create forecast parameters
    params = ForecastParameters(
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        forecast_type=ForecastType.BASIC
    )
    
    # Generate forecast
    forecasts = await forecast_service.get_forecasts(params, test_user)
    
    # Verify results
    assert len(forecasts) == 1
    forecast = forecasts[0]
    
    # Check forecast structure
    assert forecast.id is not None
    assert forecast.created_at is not None
    assert forecast.parameters == params
    assert len(forecast.data_points) == 31  # 31 days including today
    
    # Check data points
    for point in forecast.data_points:
        assert point.date is not None
        assert point.value is not None
        assert point.is_actual is False


@pytest.mark.asyncio
async def test_advanced_forecast_generation(mock_sheets_service, test_user):
    """Test advanced forecast generation."""
    # Create forecast service with mock sheets service
    forecast_service = ForecastService(sheets_service=mock_sheets_service)
    
    # Create forecast parameters
    params = ForecastParameters(
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        forecast_type=ForecastType.ADVANCED,
        confidence_level=0.95
    )
    
    # Generate forecast
    forecasts = await forecast_service.get_forecasts(params, test_user)
    
    # Verify results
    assert len(forecasts) == 1
    forecast = forecasts[0]
    
    # Check forecast structure
    assert forecast.id is not None
    assert forecast.created_at is not None
    assert forecast.parameters == params
    assert len(forecast.data_points) == 31  # 31 days including today
    
    # Check data points
    for point in forecast.data_points:
        assert point.date is not None
        assert point.value is not None
        assert point.confidence_lower is not None
        assert point.confidence_upper is not None
        assert point.confidence_lower < point.value < point.confidence_upper
        assert point.is_actual is False


@pytest.mark.asyncio
async def test_forecast_with_empty_data(mock_sheets_service, test_user):
    """Test forecast generation with empty historical data."""
    # Create forecast service with mock sheets service
    forecast_service = ForecastService(sheets_service=mock_sheets_service)
    
    # Override mock to return empty DataFrame
    mock_sheets_service.get_sales_data.side_effect = lambda *args, **kwargs: pd.DataFrame()
    
    # Create forecast parameters
    params = ForecastParameters(
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        forecast_type=ForecastType.BASIC
    )
    
    # Generate forecast
    forecasts = await forecast_service.get_forecasts(params, test_user)
    
    # Verify results
    assert len(forecasts) == 1
    forecast = forecasts[0]
    
    # Check forecast structure
    assert forecast.id is not None
    assert forecast.created_at is not None
    assert forecast.parameters == params
    assert len(forecast.data_points) == 31  # 31 days including today
    
    # Check data points - should all be zero
    for point in forecast.data_points:
        assert point.date is not None
        assert point.value == 0.0
        assert point.is_actual is False
