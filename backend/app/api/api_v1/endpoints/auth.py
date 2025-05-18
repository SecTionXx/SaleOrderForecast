from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.token import Token
from app.services.user_service import UserService

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: UserService = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await user_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return await user_service.create_access_token(user.id)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    user_service: UserService = Depends(),
    current_user_id: int = Depends(lambda: 0)  # This would normally use a dependency
):
    """
    Refresh access token.
    """
    return await user_service.create_access_token(current_user_id)
