from fastapi import APIRouter

from app.api.v1 import (
    admin,
    analytics,
    auth,
    automation,
    chat,
    coding,
    knowledge,
    memory,
    notifications,
    plugins,
    research,
    users,
    vision,
    voice,
)

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(voice.router, prefix="/voice", tags=["voice"])
router.include_router(vision.router, prefix="/vision", tags=["vision"])
router.include_router(automation.router, prefix="/automation", tags=["automation"])
router.include_router(memory.router, prefix="/memory", tags=["memory"])
router.include_router(plugins.router, prefix="/plugins", tags=["plugins"])
router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
router.include_router(research.router, prefix="/research", tags=["research"])
router.include_router(coding.router, prefix="/coding", tags=["coding"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
