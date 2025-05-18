from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SaleOrderForecast"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Security settings
    SECRET_KEY: str = "dev-secret-key"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=True,
        extra='ignore'
    )

# Create settings instance
settings = Settings()
