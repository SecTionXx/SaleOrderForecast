import pytest
from fastapi.testclient import TestClient
from typing import Generator, Dict, Any

from app.main import app
from app.services.user_service import UserService
from app.schemas.user import User, UserRole


@pytest.fixture
def test_client() -> Generator[TestClient, None, None]:
    """
    Create a FastAPI TestClient for testing API endpoints.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture
def user_service() -> UserService:
    """
    Create a UserService instance for testing.
    """
    return UserService()


@pytest.fixture
def admin_user() -> User:
    """
    Create a test admin user.
    """
    return User(
        id=1,
        email="admin@example.com",
        full_name="Admin User",
        is_active=True,
        role=UserRole.ADMIN,
        created_at="2025-01-01T00:00:00",
        is_admin=True
    )


@pytest.fixture
def editor_user() -> User:
    """
    Create a test editor user.
    """
    return User(
        id=2,
        email="editor@example.com",
        full_name="Editor User",
        is_active=True,
        role=UserRole.EDITOR,
        created_at="2025-01-15T00:00:00",
        is_admin=False
    )


@pytest.fixture
def viewer_user() -> User:
    """
    Create a test viewer user.
    """
    return User(
        id=3,
        email="viewer@example.com",
        full_name="Viewer User",
        is_active=True,
        role=UserRole.VIEWER,
        created_at="2025-02-01T00:00:00",
        is_admin=False
    )


@pytest.fixture
def admin_token(user_service: UserService, admin_user: User) -> str:
    """
    Create a valid admin token for testing.
    """
    token = user_service.create_access_token(admin_user.id)
    return token.access_token


@pytest.fixture
def editor_token(user_service: UserService, editor_user: User) -> str:
    """
    Create a valid editor token for testing.
    """
    token = user_service.create_access_token(editor_user.id)
    return token.access_token


@pytest.fixture
def viewer_token(user_service: UserService, viewer_user: User) -> str:
    """
    Create a valid viewer token for testing.
    """
    token = user_service.create_access_token(viewer_user.id)
    return token.access_token
