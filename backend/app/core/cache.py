from __future__ import annotations

import functools
import hashlib
import json
from typing import Any, Callable, TypeVar

import redis.asyncio as aioredis

from app.core.config import settings

T = TypeVar("T")


class RedisClient:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None

    def set_redis(self, client: aioredis.Redis) -> None:
        self._redis = client

    async def get(self, key: str) -> Any | None:
        if not self._redis:
            return None
        val = await self._redis.get(key)
        if val is not None:
            return json.loads(val)
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 300,
    ) -> None:
        if not self._redis:
            return
        await self._redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str) -> None:
        if not self._redis:
            return
        await self._redis.delete(key)

    async def invalidate_pattern(self, pattern: str) -> None:
        if not self._redis:
            return
        cursor = 0
        while True:
            cursor, keys = await self._redis.scan(
                cursor=cursor, match=pattern, count=100
            )
            if keys:
                await self._redis.delete(*keys)
            if cursor == 0:
                break

    async def exists(self, key: str) -> bool:
        if not self._redis:
            return False
        return bool(await self._redis.exists(key))

    async def ttl(self, key: str) -> int:
        if not self._redis:
            return -2
        return await self._redis.ttl(key)

    def cached(
        self,
        ttl: int = 300,
        key_prefix: str = "",
    ) -> Callable:
        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            @functools.wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                if not self._redis:
                    return await func(*args, **kwargs)
                raw = f"{func.__module__}.{func.__qualname__}:{key_prefix}:{args}:{sorted(kwargs.items())}"
                cache_key = hashlib.md5(raw.encode()).hexdigest()
                cached_val = await self.get(cache_key)
                if cached_val is not None:
                    return cached_val
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl=ttl)
                return result
            return wrapper
        return decorator


redis_client = RedisClient()
