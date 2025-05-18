from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, Field, model_validator
from typing import List, Optional, Union, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    Uses Pydantic for validation and type checking.
    """
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SaleOrderForecast"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Security settings
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Google Sheets API settings
    GOOGLE_SHEETS_API_KEY: Optional[str] = None
    GOOGLE_SHEETS_ID: Optional[str] = None
    
    # Database settings (if needed in the future)
    DATABASE_URL: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=True,
        extra='ignore'
    )
    
    @model_validator(mode='after')
    def validate_settings(self) -> 'Settings':
        # Validate required settings
        if not self.SECRET_KEY:
            self.SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
        
        # Validate Google Sheets settings
        if not self.GOOGLE_SHEETS_API_KEY:
            self.GOOGLE_SHEETS_API_KEY = os.getenv("GOOGLE_SHEETS_API_KEY")
        if not self.GOOGLE_SHEETS_ID:
            self.GOOGLE_SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID")
            
        # Convert CORS_ORIGINS from string to list if needed
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
        return self

# Create settings instance
settings = Settings()
