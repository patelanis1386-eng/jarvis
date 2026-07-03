from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserPreferences(BaseModel):
    theme: str = "dark"
    language: str = "en"
    notifications_enabled: bool = True
    auto_save: bool = True


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    is_active: bool = True
    is_verified: bool = False
    preferences: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)
    full_name: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=64)
    full_name: str | None = None
    avatar_url: str | None = None
    preferences: dict | None = None


class UserInDB(UserResponse):
    hashed_password: str

    model_config = {"from_attributes": True}
