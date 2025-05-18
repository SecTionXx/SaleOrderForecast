from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    """
    Token response schema.
    
    Contains the access token and token type.
    """
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_at: datetime = Field(description="Token expiration timestamp")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_at": "2025-05-26T17:00:00Z"
                }
            ]
        }
    }


class TokenPayload(BaseModel):
    """
    JWT token payload schema.
    
    Contains the subject (user ID) and expiration time.
    """
    sub: int = Field(description="Subject (user ID)")
    exp: int = Field(description="Expiration timestamp")
    iat: Optional[int] = Field(default=None, description="Issued at timestamp")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sub": 1,
                    "exp": 1747251600,
                    "iat": 1716715600
                }
            ]
        }
    }
    

class TokenData(BaseModel):
    """
    Token data extracted from JWT.
    
    Used for authentication and authorization.
    """
    user_id: int = Field(description="User ID from token")
    expires_at: datetime = Field(description="Token expiration timestamp")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "user_id": 1,
                    "expires_at": "2025-05-26T17:00:00Z"
                }
            ]
        }
    }
