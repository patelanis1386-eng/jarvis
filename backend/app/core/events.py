from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI

from app.core.cache import redis_client
from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.logging import logger


async def on_startup() -> None:
    logger.info("Starting JARVIS X server", version=settings.VERSION)
    await init_db()

    if settings.use_mock:
        logger.warning(
            "JARVIS X running in MOCK MODE - no API key detected. "
            "Set OPENAI_API_KEY in .env for full AI capabilities."
        )

    try:
        global_redis = await aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
        )
        await global_redis.ping()
        redis_client.set_redis(global_redis)
        logger.info("Redis connection established")
    except Exception as exc:
        logger.warning("Redis connection failed, running without cache", error=str(exc))

    logger.info("JARVIS X startup complete")


async def on_shutdown() -> None:
    logger.info("Shutting down JARVIS X server")
    await close_db()
    if redis_client._redis:
        await redis_client._redis.close()
    logger.info("JARVIS X shutdown complete")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await on_startup()
    yield
    await on_shutdown()
