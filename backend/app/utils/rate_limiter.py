import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional


class RateLimiter:
    def __init__(
        self,
        redis_url: Optional[str] = None,
        storage_path: str = "data/rate_limits",
    ):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self._redis_client = None
        self._use_redis = False
        self._file_lock = asyncio.Lock()

        if redis_url:
            try:
                import redis.asyncio as aioredis
                self._redis_client = aioredis.from_url(redis_url)
                self._use_redis = True
            except Exception:
                pass

    async def check_rate_limit(
        self,
        key: str,
        max_requests: int = 60,
        window_seconds: int = 60,
    ) -> bool:
        if self._use_redis:
            return await self._check_redis(key, max_requests, window_seconds)
        return await self._check_file(key, max_requests, window_seconds)

    async def _check_redis(self, key: str, max_requests: int, window_seconds: int) -> bool:
        try:
            current = await self._redis_client.get(f"ratelimit:{key}")
            count = int(current) if current else 0

            if count >= max_requests:
                return False

            pipe = self._redis_client.pipeline()
            pipe.incr(f"ratelimit:{key}")
            pipe.expire(f"ratelimit:{key}", window_seconds)
            await pipe.execute()
            return True
        except Exception:
            return await self._check_file(key, max_requests, window_seconds)

    async def _check_file(self, key: str, max_requests: int, window_seconds: int) -> bool:
        async with self._file_lock:
            file_path = self.storage_path / f"{key.replace('/', '_').replace(':', '_')}.json"
            now = time.time()
            data = {"requests": []}

            if file_path.exists():
                try:
                    with open(file_path, "r") as f:
                        data = json.load(f)
                except Exception:
                    data = {"requests": []}

            cutoff = now - window_seconds
            data["requests"] = [t for t in data["requests"] if t > cutoff]

            if len(data["requests"]) >= max_requests:
                return False

            data["requests"].append(now)

            with open(file_path, "w") as f:
                json.dump(data, f)

            return True

    async def get_remaining(self, key: str, max_requests: int = 60, window_seconds: int = 60) -> int:
        if self._use_redis:
            return await self._get_remaining_redis(key, max_requests)
        return await self._get_remaining_file(key, max_requests, window_seconds)

    async def _get_remaining_redis(self, key: str, max_requests: int) -> int:
        try:
            current = await self._redis_client.get(f"ratelimit:{key}")
            count = int(current) if current else 0
            return max(0, max_requests - count)
        except Exception:
            return max_requests

    async def _get_remaining_file(self, key: str, max_requests: int, window_seconds: int) -> int:
        async with self._file_lock:
            file_path = self.storage_path / f"{key.replace('/', '_').replace(':', '_')}.json"
            if not file_path.exists():
                return max_requests

            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                now = time.time()
                cutoff = now - window_seconds
                active = [t for t in data.get("requests", []) if t > cutoff]
                return max(0, max_requests - len(active))
            except Exception:
                return max_requests

    async def reset(self, key: str):
        if self._use_redis:
            try:
                await self._redis_client.delete(f"ratelimit:{key}")
            except Exception:
                pass

        async with self._file_lock:
            file_path = self.storage_path / f"{key.replace('/', '_').replace(':', '_')}.json"
            if file_path.exists():
                file_path.unlink()
