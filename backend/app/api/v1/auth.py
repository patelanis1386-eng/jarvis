from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest, PasswordChangeRequest
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


def get_auth_service(db=Depends(get_db)):
    return AuthService(db=db)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, auth: AuthService = Depends(get_auth_service)):
    user = await auth.register_user(
        email=payload.email,
        password=payload.password,
        username=payload.username,
        full_name=getattr(payload, "full_name", None),
    )
    tokens = await auth.create_tokens(user.id)
    return {"access_token": tokens["access_token"], "refresh_token": tokens["refresh_token"], "token_type": "bearer", "user": {"id": user.id, "email": user.email, "username": user.username, "full_name": user.full_name, "role": user.role.value if hasattr(user.role, "value") else user.role}}


@router.post("/login")
async def login(payload: LoginRequest, auth: AuthService = Depends(get_auth_service)):
    user = await auth.authenticate(email=payload.email, password=payload.password)
    tokens = await auth.create_tokens(user.id)
    return {"access_token": tokens["access_token"], "refresh_token": tokens["refresh_token"], "token_type": "bearer", "user": {"id": user.id, "email": user.email, "username": user.username, "full_name": user.full_name, "role": user.role.value if hasattr(user.role, "value") else user.role}}


@router.post("/refresh")
async def refresh(payload: RefreshTokenRequest, auth: AuthService = Depends(get_auth_service)):
    result = await auth.refresh_access_token(payload.refresh_token)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return {"access_token": result["access_token"], "refresh_token": result["refresh_token"], "token_type": "bearer"}


@router.post("/logout")
async def logout(payload: RefreshTokenRequest, auth: AuthService = Depends(get_auth_service)):
    await auth.revoke_refresh_token(payload.refresh_token)
    return {"message": "Logged out"}


@router.post("/change-password")
async def change_password(payload: PasswordChangeRequest, current_user: User = Depends(get_current_user), auth: AuthService = Depends(get_auth_service)):
    success = await auth.change_password(current_user.id, payload.current_password, payload.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password changed"}
