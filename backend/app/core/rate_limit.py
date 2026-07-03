from functools import wraps
from typing import Callable

from fastapi import HTTPException, Request


def rate_limit(max_requests: int = 60, window_seconds: int = 60) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                for val in kwargs.values():
                    if isinstance(val, Request):
                        request = val
                        break
            return await func(*args, **kwargs)
        return wrapper
    return decorator
