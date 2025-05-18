from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration for access control."""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class UserBase(BaseModel):
    """Base user schema with common attributes."""
    model_config = {"from_attributes": True}
    
    email: EmailStr = Field(description="User email address")
    full_name: Optional[str] = Field(default=None, description="Full name of the user")
    is_active: bool = Field(default=True, description="Whether the user account is active")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    model_config = {"from_attributes": True}
    
    password: str = Field(description="User password (min 8 characters)", min_length=8)
    role: UserRole = Field(default=UserRole.VIEWER, description="User role for access control")


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    model_config = {"from_attributes": True}
    
    email: Optional[EmailStr] = Field(default=None, description="User email address")
    full_name: Optional[str] = Field(default=None, description="Full name of the user")
    password: Optional[str] = Field(default=None, min_length=8, description="User password (min 8 characters)")
    is_active: Optional[bool] = Field(default=None, description="Whether the user account is active")
    role: Optional[UserRole] = Field(default=None, description="User role for access control")


class User(UserBase):
    """Complete user schema with all attributes."""
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "is_active": True,
                    "role": "editor",
                    "created_at": "2025-01-15T10:30:00Z",
                    "updated_at": "2025-05-18T14:20:00Z",
                    "is_admin": False
                }
            ]
        }
    }
    
    id: int = Field(description="Unique user identifier")
    role: UserRole = Field(description="User role for access control")
    created_at: datetime = Field(description="When the user was created")
    updated_at: Optional[datetime] = Field(default=None, description="When the user was last updated")
    is_admin: bool = Field(default=False, description="Whether the user has admin privileges")
