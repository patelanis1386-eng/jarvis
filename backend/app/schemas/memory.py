from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    type: str = Field(default="short_term", pattern=r"^(short_term|long_term|semantic)$")
    key: str = Field(..., min_length=1, max_length=256)
    value: str = Field(..., min_length=1)
    metadata: dict[str, Any] | None = None
    importance: float = Field(default=0.0, ge=0.0, le=1.0)
    expires_at: datetime | None = None


class MemoryResponse(BaseModel):
    id: str
    user_id: str
    type: str
    key: str
    value: str
    metadata: dict[str, Any] | None = None
    importance: float = 0.0
    created_at: datetime
    expires_at: datetime | None = None

    model_config = {"from_attributes": True}


class MemorySearch(BaseModel):
    query: str = Field(..., min_length=1)
    type: str | None = Field(None, pattern=r"^(short_term|long_term|semantic)$")
    limit: int = Field(default=10, ge=1, le=100)
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
