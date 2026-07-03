from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Plugin(BaseModel):
    __tablename__ = "plugins"

    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(32), default="1.0.0", nullable=False)
    author: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    config_schema: Mapped[dict[str, Any] | None] = mapped_column(
        type_=Text().with_variant(Text, "sqlite"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_official: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    permissions: Mapped[dict[str, Any] | None] = mapped_column(
        type_=Text().with_variant(Text, "sqlite"),
        nullable=True,
    )

    user = relationship("User", back_populates="plugins")

    def __repr__(self) -> str:
        return f"<Plugin {self.name} v{self.version}>"
