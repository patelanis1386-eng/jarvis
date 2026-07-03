from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.core.events import on_startup, on_shutdown
from app.core.exceptions import register_exception_handlers
from app.core.middleware import RequestTimingMiddleware, RequestIDMiddleware, AuditLoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    await on_startup()
    yield
    await on_shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Operating System - JARVIS X",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestTimingMiddleware)
app.add_middleware(AuditLoggingMiddleware)

register_exception_handlers(app)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "mode": "mock" if settings.use_mock else "live",
        "docs": "/docs" if settings.DEBUG else None,
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "version": settings.VERSION, "mode": "mock" if settings.use_mock else "live"}
