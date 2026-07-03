from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import (
    ForbiddenException,
    RateLimitExceededException,
    UnauthorizedException,
)
from app.core.security import decode_token
from app.models.user import User, UserRole

TOKEN_PREFIX = "Bearer "


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> User:
    if not authorization:
        raise UnauthorizedException("Authorization header is required")

    if not authorization.startswith(TOKEN_PREFIX):
        raise UnauthorizedException("Invalid authorization scheme")

    token = authorization[len(TOKEN_PREFIX) :]
    payload = decode_token(token)

    if not payload or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("User account is deactivated")

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Admin privileges required")
    return current_user


async def get_optional_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> User | None:
    if not authorization:
        return None
    try:
        return await get_current_user(authorization=authorization, db=db)
    except (UnauthorizedException, HTTPException):
        return None


class RateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def __call__(self) -> None:
        if not hasattr(self, "_redis") or not self._redis:
            return
        raise RateLimitExceededException("Rate limit exceeded")


async def pagination_params(
    skip: int = 0,
    limit: int = 100,
) -> tuple[int, int]:
    return skip, min(limit, 500)


async def get_ai_client():
    from app.core.config import settings
    if settings.use_mock:
        from app.services.mock_ai_client import MockOpenAIClient
        return MockOpenAIClient()
    from openai import AsyncOpenAI
    return AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
    )


AiClient = Annotated[any, Depends(get_ai_client)]
