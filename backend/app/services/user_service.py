from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext
import uuid

from app.core.config import settings
from app.schemas.user import User, UserCreate, UserUpdate, UserRole
from app.schemas.token import Token


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """
    Service for user management and authentication.
    
    Handles user CRUD operations and authentication.
    """
    
    def __init__(self):
        """Initialize the user service."""
        # In a real application, this would use a database
        # For now, we'll use an in-memory store
        self._users: Dict[int, Dict[str, Any]] = {
            1: {
                "id": 1,
                "email": "admin@example.com",
                "full_name": "Admin User",
                "hashed_password": self._get_password_hash("adminpassword"),
                "is_active": True,
                "role": UserRole.ADMIN,
                "created_at": datetime(2025, 1, 1),
                "updated_at": datetime(2025, 5, 1),
                "is_admin": True
            },
            2: {
                "id": 2,
                "email": "editor@example.com",
                "full_name": "Editor User",
                "hashed_password": self._get_password_hash("editorpassword"),
                "is_active": True,
                "role": UserRole.EDITOR,
                "created_at": datetime(2025, 1, 15),
                "updated_at": datetime(2025, 5, 10),
                "is_admin": False
            },
            3: {
                "id": 3,
                "email": "viewer@example.com",
                "full_name": "Viewer User",
                "hashed_password": self._get_password_hash("viewerpassword"),
                "is_active": True,
                "role": UserRole.VIEWER,
                "created_at": datetime(2025, 2, 1),
                "updated_at": None,
                "is_admin": False
            }
        }
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        
        Args:
            user_id: The user ID to look up
            
        Returns:
            User object if found, None otherwise
        """
        user_data = self._users.get(user_id)
        if not user_data:
            return None
        
        return User(**user_data)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get a user by email.
        
        Args:
            email: The email to look up
            
        Returns:
            User object if found, None otherwise
        """
        for user_data in self._users.values():
            if user_data["email"] == email:
                return User(**user_data)
        
        return None
    
    async def create_user(self, user_in: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            user_in: User creation data
            
        Returns:
            The created user
        """
        # Check if email already exists
        existing_user = await self.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = max(self._users.keys()) + 1 if self._users else 1
        
        user_data = {
            "id": user_id,
            "email": user_in.email,
            "full_name": user_in.full_name,
            "hashed_password": self._get_password_hash(user_in.password),
            "is_active": user_in.is_active,
            "role": user_in.role,
            "created_at": datetime.now(),
            "updated_at": None,
            "is_admin": user_in.role == UserRole.ADMIN
        }
        
        self._users[user_id] = user_data
        
        return User(**user_data)
    
    async def update_user(self, user_id: int, user_in: UserUpdate) -> User:
        """
        Update an existing user.
        
        Args:
            user_id: ID of the user to update
            user_in: User update data
            
        Returns:
            The updated user
        """
        user_data = self._users.get(user_id)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user data
        update_data = user_in.dict(exclude_unset=True)
        
        if "password" in update_data:
            update_data["hashed_password"] = self._get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            user_data[field] = value
        
        user_data["updated_at"] = datetime.now()
        
        # Update is_admin based on role
        if "role" in update_data:
            user_data["is_admin"] = user_data["role"] == UserRole.ADMIN
        
        self._users[user_id] = user_data
        
        return User(**user_data)
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            User object if authentication succeeds, None otherwise
        """
        user = await self.get_by_email(email)
        if not user:
            return None
        
        # Get user data to access hashed_password
        user_data = self._users.get(user.id)
        if not user_data:
            return None
        
        if not self._verify_password(password, user_data["hashed_password"]):
            return None
        
        return user
    
    async def create_access_token(self, user_id: int) -> Token:
        """
        Create a JWT access token for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Token object with access token and expiration
        """
        # Set expiration time
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta
        
        # Create JWT payload
        to_encode = {
            "sub": user_id,
            "exp": expire.timestamp(),
            "iat": datetime.utcnow().timestamp(),
            "jti": str(uuid.uuid4())
        }
        
        # Create JWT token
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
        
        return Token(
            access_token=encoded_jwt,
            token_type="bearer",
            expires_at=expire
        )
    
    def _get_password_hash(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against a hash.
        
        Args:
            plain_password: Plain text password
            hashed_password: Hashed password
            
        Returns:
            True if password matches hash, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
