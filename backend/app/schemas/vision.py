from __future__ import annotations

from pydantic import BaseModel, Field


class VisionRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image data")
    prompt: str = Field(default="Describe this image in detail", max_length=2048)
    model: str = Field(default="gpt-4o", max_length=64)
    max_tokens: int = Field(default=1024, ge=1, le=16384)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    detail: str = Field(default="auto", pattern=r"^(low|high|auto)$")


class VisionResponse(BaseModel):
    description: str
    model: str
    tokens_used: int | None = None
    processing_time: float | None = None


class OCRResponse(BaseModel):
    text: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    language: str | None = None
    regions: list[dict] | None = None
    processing_time: float | None = None
