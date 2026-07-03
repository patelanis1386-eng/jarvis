from __future__ import annotations

from typing import Any, List, Optional

from sqlalchemy import Column, Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class KnowledgeItem(BaseModel):
    __tablename__ = "knowledge_items"

    user_id: str = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: str = Column(String(512), nullable=False)
    content: str = Column(Text, nullable=False)
    source: str = Column(String(64), default="manual")
    category: str = Column(String(100), default="general")
    tags: list = Column(JSON, default=list)
    source_url: str | None = Column(String(1024), nullable=True)
    embedding: Any = Column(Text, nullable=True)
    meta: dict = Column(JSON, default=dict)

    user = relationship("User", back_populates="knowledge_items")


class KnowledgeRelation(BaseModel):
    __tablename__ = "knowledge_relations"

    source_id: str = Column(String(36), ForeignKey("knowledge_items.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id: str = Column(String(36), ForeignKey("knowledge_items.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type: str = Column(String(100), nullable=False)
    weight: float = Column(Float, default=1.0)
    meta: dict = Column(JSON, default=dict)
