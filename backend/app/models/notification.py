from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="info")
    title = Column(String(300), nullable=False)
    message = Column(Text, default="")
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)

    user = relationship("User", back_populates="notifications")
