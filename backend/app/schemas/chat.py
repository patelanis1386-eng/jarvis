from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str | None = None
    model: str = "gpt-4o"
    mode: str = Field(default="fast", pattern=r"^(fast|deep)$")
    system_prompt: str | None = None
    metadata: dict[str, Any] | None = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    model: str
    mode: str
    system_prompt: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    role: str = Field(default="user", pattern=r"^(user|assistant|system)$")
    content: str = Field(..., min_length=1)
    content_type: str = Field(default="text", pattern=r"^(text|image|code|audio)$")
    metadata: dict[str, Any] | None = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    content_type: str = "text"
    metadata: dict[str, Any] | None = None
    tokens_used: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(..., min_length=1)
    model: str | None = None
    mode: str | None = Field(None, pattern=r"^(fast|deep)$")
    stream: bool = False
    system_prompt: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1, le=16384)


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    tokens_used: int | None = None
    model: str | None = None


class StreamEvent(BaseModel):
    event: str = Field(..., pattern=r"^(token|done|error|metadata)$")
    data: Any
