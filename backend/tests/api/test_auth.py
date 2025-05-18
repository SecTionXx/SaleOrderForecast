import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.core.config import settings


def test_login_success(test_client: TestClient):
    """Test successful login with valid credentials."""
    response = test_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_at" in data


def test_login_invalid_credentials(test_client: TestClient):
    """Test login failure with invalid credentials."""
    response = test_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "admin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect email or password"


def test_login_inactive_user(test_client: TestClient, monkeypatch):
    """Test login failure with inactive user."""
    # This would require mocking the user_service to return an inactive user
    # Implementation would depend on how dependency injection is set up
    pass


def test_refresh_token(test_client: TestClient, admin_token: str):
    """Test token refresh endpoint."""
    response = test_client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_at" in data
