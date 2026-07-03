from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(
        self,
        message: str = "An error occurred",
        status_code: int = 500,
        detail: Any = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", detail: Any = None) -> None:
        super().__init__(message=message, status_code=404, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Not authorized", detail: Any = None) -> None:
        super().__init__(message=message, status_code=401, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", detail: Any = None) -> None:
        super().__init__(message=message, status_code=403, detail=detail)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", detail: Any = None) -> None:
        super().__init__(message=message, status_code=400, detail=detail)


class RateLimitExceededException(AppException):
    def __init__(self, message: str = "Rate limit exceeded", detail: Any = None) -> None:
        super().__init__(message=message, status_code=429, detail=detail)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", detail: Any = None) -> None:
        super().__init__(message=message, status_code=409, detail=detail)


class ServiceUnavailableException(AppException):
    def __init__(
        self, message: str = "Service unavailable", detail: Any = None
    ) -> None:
        super().__init__(message=message, status_code=503, detail=detail)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if __debug__ else None,
            "status_code": 500,
        },
    )


EXCEPTION_HANDLERS: dict[int | type[Exception], Any] = {
    AppException: app_exception_handler,
    Exception: generic_exception_handler,
}


def register_exception_handlers(app) -> None:
    from fastapi import FastAPI
    for exc_class, handler in EXCEPTION_HANDLERS.items():
        app.add_exception_handler(exc_class, handler)
