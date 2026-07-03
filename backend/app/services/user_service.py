from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserNotFoundError(Exception):
    pass


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError(f"User {user_id} not found")
        return user

    async def update_user(self, user_id: str, updates: dict) -> User:
        user = await self.get_user(user_id)
        allowed = {"full_name", "avatar_url", "email"}
        for key, value in updates.items():
            if key in allowed:
                setattr(user, key, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_preferences(self, user_id: str, updates: dict) -> dict:
        user = await self.get_user(user_id)
        prefs = user.preferences or {}
        prefs.update(updates)
        user.preferences = prefs
        await self.db.commit()
        return prefs

    async def delete_user(self, user_id: str) -> bool:
        user = await self.get_user(user_id)
        await self.db.delete(user)
        await self.db.commit()
        return True

    async def get_all_users(self, skip: int = 0, limit: int = 50, search: Optional[str] = None) -> List[User]:
        query = select(User)
        if search:
            query = query.where(
                or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
            )
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_user_by_admin(self, user_id: str, updates: dict) -> User:
        user = await self.get_user(user_id)
        allowed = {"full_name", "email", "is_active", "is_verified", "role"}
        for key, value in updates.items():
            if key in allowed:
                setattr(user, key, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user_by_admin(self, user_id: str) -> bool:
        await self.db.execute(delete(User).where(User.id == user_id))
        await self.db.commit()
        return True
