import pytest
from datetime import date, datetime, timedelta
from pydantic import ValidationError

from app.schemas.forecast import (
    ForecastParameters,
    ForecastDataPoint,
    ForecastResponse,
    ForecastType
)


def test_forecast_parameters_validation():
    """Test validation of ForecastParameters model."""
    # Test valid parameters
    start_date = date.today()
    end_date = start_date + timedelta(days=30)
    
    params = ForecastParameters(
        start_date=start_date,
        end_date=end_date,
        sales_rep_id=1,
        category="enterprise",
        forecast_type=ForecastType.ADVANCED,
        include_historical=True,
        confidence_level=0.95
    )
    
    assert params.start_date == start_date
    assert params.end_date == end_date
    assert params.sales_rep_id == 1
    assert params.category == "enterprise"
    assert params.forecast_type == ForecastType.ADVANCED
    assert params.include_historical is True
    assert params.confidence_level == 0.95
    
    # Test default values
    params = ForecastParameters(
        start_date=start_date,
        end_date=end_date
    )
    
    assert params.forecast_type == ForecastType.BASIC
    assert params.include_historical is False
    assert params.confidence_level is None
    
    # Test end_date validation
    with pytest.raises(ValidationError):
        ForecastParameters(
            start_date=start_date,
            end_date=start_date - timedelta(days=1)  # End date before start date
        )
    
    # Test confidence_level validation
    with pytest.raises(ValidationError):
        ForecastParameters(
            start_date=start_date,
            end_date=end_date,
            confidence_level=1.5  # Greater than 1.0
        )
    
    with pytest.raises(ValidationError):
        ForecastParameters(
            start_date=start_date,
            end_date=end_date,
            confidence_level=-0.1  # Less than 0.0
        )


def test_forecast_data_point():
    """Test ForecastDataPoint model."""
    # Test valid data point
    point_date = date.today()
    
    point = ForecastDataPoint(
        date=point_date,
        value=100.0,
        confidence_lower=90.0,
        confidence_upper=110.0,
        is_actual=True
    )
    
    assert point.date == point_date
    assert point.value == 100.0
    assert point.confidence_lower == 90.0
    assert point.confidence_upper == 110.0
    assert point.is_actual is True
    
    # Test default values
    point = ForecastDataPoint(
        date=point_date,
        value=100.0
    )
    
    assert point.confidence_lower is None
    assert point.confidence_upper is None
    assert point.is_actual is False


def test_forecast_response():
    """Test ForecastResponse model."""
    # Test valid forecast response
    start_date = date.today()
    end_date = start_date + timedelta(days=2)
    created_at = datetime.now()
    
    params = ForecastParameters(
        start_date=start_date,
        end_date=end_date
    )
    
    data_points = [
        ForecastDataPoint(
            date=start_date,
            value=100.0
        ),
        ForecastDataPoint(
            date=start_date + timedelta(days=1),
            value=110.0
        ),
        ForecastDataPoint(
            date=end_date,
            value=120.0
        )
    ]
    
    forecast = ForecastResponse(
        id="test-forecast-1",
        created_at=created_at,
        parameters=params,
        data_points=data_points,
        metadata={"model_type": "test"}
    )
    
    assert forecast.id == "test-forecast-1"
    assert forecast.created_at == created_at
    assert forecast.parameters == params
    assert len(forecast.data_points) == 3
    assert forecast.metadata == {"model_type": "test"}
    
    # Test default values
    forecast = ForecastResponse(
        id="test-forecast-2",
        created_at=created_at,
        parameters=params,
        data_points=data_points
    )
    
    assert forecast.metadata == {}
