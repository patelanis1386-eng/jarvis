from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ContentType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    CODE = "code"
    AUDIO = "audio"


class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MessageRole] = mapped_column(
        Enum(MessageRole, name="message_role"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[ContentType] = mapped_column(
        Enum(ContentType, name="content_type"),
        default=ContentType.TEXT,
        nullable=False,
    )
    meta: Mapped[dict[str, Any] | None] = mapped_column(
        type_=Text().with_variant(Text, "sqlite"),
        nullable=True,
    )
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message {self.role}: {self.content[:50]}...>"
