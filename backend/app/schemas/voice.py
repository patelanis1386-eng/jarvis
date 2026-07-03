from __future__ import annotations

from pydantic import BaseModel, Field


class TranscriptionRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64-encoded audio data")
    language: str | None = Field(None, max_length=8)
    model: str = Field(default="whisper-1", max_length=64)
    prompt: str | None = Field(None, max_length=512)
    response_format: str = Field(default="json", pattern=r"^(json|text|srt|vtt)$")
    temperature: float | None = Field(None, ge=0.0, le=1.0)


class TranscriptionResponse(BaseModel):
    text: str
    language: str | None = None
    duration: float | None = None
    segments: list[dict] | None = None


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    model: str = Field(default="tts-1", max_length=64)
    voice: str = Field(default="alloy", max_length=32)
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    response_format: str = Field(default="mp3", pattern=r"^(mp3|opus|aac|flac)$")
