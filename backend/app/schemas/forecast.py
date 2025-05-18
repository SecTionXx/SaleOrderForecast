from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, ClassVar
from datetime import date, datetime
from enum import Enum
from typing_extensions import Annotated


class ForecastType(str, Enum):
    """Enumeration of available forecast types."""
    BASIC = "basic"
    ADVANCED = "advanced"
    PREDICTIVE = "predictive"


class ForecastParameters(BaseModel):
    """
    Parameters for generating a forecast.
    
    Contains all necessary filters and configuration options.
    """
    start_date: date = Field(..., description="Start date for forecast period")
    end_date: date = Field(..., description="End date for forecast period")
    sales_rep_id: Optional[int] = Field(None, description="Filter by sales rep ID")
    category: Optional[str] = Field(None, description="Filter by deal category")
    forecast_type: str = Field("basic", description="Type of forecast to generate")
    include_historical: bool = Field(False, description="Include historical data in response")
    confidence_level: Optional[float] = Field(None, description="Confidence level for forecast (0.0-1.0)")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "start_date": "2025-06-01",
                    "end_date": "2025-08-31",
                    "sales_rep_id": 42,
                    "category": "enterprise",
                    "forecast_type": "advanced",
                    "include_historical": True,
                    "confidence_level": 0.95
                }
            ]
        }


class ForecastDataPoint(BaseModel):
    """A single data point in a forecast.
    
    Represents forecasted value for a specific date.
    """
    date: date = Field(description="Date of this forecast point")
    value: float = Field(description="Forecasted value")
    confidence_lower: Optional[float] = Field(default=None, description="Lower bound of confidence interval")
    confidence_upper: Optional[float] = Field(default=None, description="Upper bound of confidence interval")
    is_actual: bool = Field(default=False, description="Whether this is actual data or a forecast")

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "date": "2025-06-01",
                    "value": 125000.0,
                    "confidence_lower": 115000.0,
                    "confidence_upper": 135000.0,
                    "is_actual": False
                }
            ]
        }


class ForecastResponse(BaseModel):
    """Complete forecast response.
    
    Contains metadata and the actual forecast data points.
    """
    id: str = Field(description="Unique identifier for this forecast")
    created_at: datetime = Field(description="When this forecast was generated")
    parameters: ForecastParameters = Field(description="Parameters used to generate this forecast")
    data_points: List[ForecastDataPoint] = Field(description="The forecast data points")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata about the forecast")

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "id": "forecast-2025-05-18-001",
                    "created_at": "2025-05-18T10:00:00Z",
                    "parameters": {
                        "start_date": "2025-06-01",
                        "end_date": "2025-08-31",
                        "sales_rep_id": 42,
                        "category": "enterprise",
                        "forecast_type": "advanced",
                        "include_historical": True,
                        "confidence_level": 0.95
                    },
                    "data_points": [
                        {
                            "date": "2025-06-01",
                            "value": 125000.0,
                            "confidence_lower": 115000.0,
                            "confidence_upper": 135000.0,
                            "is_actual": False
                        }
                    ],
                    "metadata": {
                        "model_version": "1.2.0",
                        "accuracy_score": 0.87
                    }
                }
            ]
        }
