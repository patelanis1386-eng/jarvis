from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PluginCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str | None = None
    version: str = Field(default="1.0.0", pattern=r"^\d+\.\d+\.\d+$")
    author: str | None = None
    category: str | None = None
    icon_url: str | None = None
    config_schema: dict[str, Any] | None = None
    permissions: list[str] | None = None


class PluginResponse(BaseModel):
    id: str
    user_id: str | None = None
    name: str
    description: str | None = None
    version: str
    author: str | None = None
    category: str | None = None
    icon_url: str | None = None
    config_schema: dict[str, Any] | None = None
    is_active: bool = True
    is_official: bool = False
    permissions: dict[str, Any] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PluginInstall(BaseModel):
    plugin_id: str
    config: dict[str, Any] | None = None
