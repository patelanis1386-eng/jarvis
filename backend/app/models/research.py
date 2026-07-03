from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Boolean, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base


class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String(500), nullable=False)
    status = Column(String(20), default="in_progress")
    depth = Column(String(20), default="standard")
    include_images = Column(Boolean, default=False)
    progress = Column(Integer, default=0)
    research_plan = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="research_projects")
    sources = relationship("ResearchSource", back_populates="project", cascade="all, delete-orphan")
    findings = relationship("ResearchFinding", back_populates="project", cascade="all, delete-orphan")


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("research_projects.id"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    title = Column(String(500), default="")
    snippet = Column(Text, default="")
    relevance_score = Column(Float, default=0.5)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("ResearchProject", back_populates="sources")


class ResearchFinding(Base):
    __tablename__ = "research_findings"

    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("research_projects.id"), nullable=False, index=True)
    claim = Column(Text, nullable=False)
    evidence = Column(Text, default="")
    confidence = Column(Float, default=0.5)
    source_urls = Column(JSON, default=list)
    category = Column(String(100), default="general")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("ResearchProject", back_populates="findings")
