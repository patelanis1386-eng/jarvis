from __future__ import annotations

import os
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "JARVIS X"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./jarvis.db",
        description="Database connection string. Use postgresql+asyncpg://user:pass@host/db for production.",
    )
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    SECRET_KEY: str = Field(
        default=os.urandom(32).hex(),
        description="JWT signing secret key. MUST be overridden in production.",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str | None = None
    USE_MOCK_AI: bool = True

    @property
    def use_mock(self) -> bool:
        return self.USE_MOCK_AI or not self.OPENAI_API_KEY

    CORS_ORIGINS: List[str] = ["*"]

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    MAX_UPLOAD_SIZE_MB: int = 50

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None

    QDRANT_URL: str | None = None
    QDRANT_API_KEY: str | None = None

    CHROMA_PERSIST_DIR: str = str(Path.cwd() / "chroma_db")

    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    WHISPER_MODEL: str = "base"
    TTS_MODEL: str = "tts-1"
    TTS_VOICE: str = "alloy"

    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.7

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def sqlite_db_path(self) -> str | None:
        if self.is_sqlite:
            raw = self.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
            return raw
        return None

    @property
    def token_expire_seconds(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    @property
    def refresh_token_expire_seconds(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE_DAYS * 86400


settings = Settings()
