import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    return salt + ":" + hashlib.sha256((salt + password).encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    salt, pw_hash = hashed.split(":", 1)
    return pw_hash == hashlib.sha256((salt + password).encode()).hexdigest()


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(
        self,
        email: str,
        password: str,
        username: str,
        full_name: Optional[str] = None,
    ) -> User:
        existing = await self.db.execute(
            select(User).where(or_(User.email == email, User.username == username))
        )
        if existing.scalar_one_or_none():
            raise AuthError("Username or email already registered")

        user = User(
            id=str(uuid4()),
            username=username,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise AuthError("Invalid email or password")
        if not user.is_active:
            raise AuthError("Account is deactivated")
        return user

    async def create_tokens(self, user_id: str) -> dict:
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": settings.token_expire_seconds,
        }

    async def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        payload = decode_token(refresh_token)
        if not payload or "sub" not in payload:
            return None
        user_id = payload["sub"]
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            return None
        return await self.create_tokens(user_id)

    async def revoke_refresh_token(self, refresh_token: str) -> None:
        pass

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not verify_password(current_password, user.hashed_password):
            return False
        user.hashed_password = hash_password(new_password)
        await self.db.commit()
        return True
