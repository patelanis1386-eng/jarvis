from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AutomationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    description: str | None = None
    trigger_type: str = Field(
        ..., pattern=r"^(schedule|webhook|event)$"
    )
    trigger_config: dict[str, Any] | None = None
    action_type: str = Field(..., min_length=1, max_length=32)
    action_config: dict[str, Any] | None = None


class AutomationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None = None
    trigger_type: str
    trigger_config: dict[str, Any] | None = None
    action_type: str
    action_config: dict[str, Any] | None = None
    is_active: bool = True
    last_run: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationRun(BaseModel):
    automation_id: str
    payload: dict[str, Any] | None = None
