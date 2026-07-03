from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MemoryType(str, enum.Enum):
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"
    SEMANTIC = "semantic"


class Memory(BaseModel):
    __tablename__ = "memories"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[MemoryType] = mapped_column(
        Enum(MemoryType, name="memory_type"),
        default=MemoryType.SHORT_TERM,
        nullable=False,
    )
    key: Mapped[str] = mapped_column(
        String(256), nullable=False, index=True
    )
    value: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[str | None] = mapped_column(
        Text().with_variant(Text, "sqlite"), nullable=True
    )
    meta: Mapped[dict[str, Any] | None] = mapped_column(
        type_=Text().with_variant(Text, "sqlite"),
        nullable=True,
    )
    importance: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user = relationship("User", back_populates="memories")

    def __repr__(self) -> str:
        return f"<Memory {self.type}: {self.key}>"
