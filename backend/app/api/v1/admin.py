from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.services.user_service import UserService

router = APIRouter()


@router.get("/users")
async def list_users(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_admin_user), db=Depends(get_db)):
    svc = UserService(db=db)
    users = await svc.get_all_users(skip=(page - 1) * per_page, limit=per_page)
    total = await db.execute(select(func.count(User.id)))
    return {"items": [{"id": u.id, "email": u.email, "username": u.username, "role": u.role.value if hasattr(u.role, "value") else u.role, "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else None} for u in users], "total": total.scalar(), "page": page, "per_page": per_page}


@router.patch("/users/{user_id}")
async def update_user(user_id: str, data: dict, current_user: User = Depends(get_current_admin_user), db=Depends(get_db)):
    svc = UserService(db=db)
    updated = await svc.update_user_by_admin(user_id, data)
    return updated


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_admin_user), db=Depends(get_db)):
    svc = UserService(db=db)
    await svc.delete_user_by_admin(user_id)
    return {"message": "Deleted"}


@router.get("/system")
async def system_stats(current_user: User = Depends(get_current_admin_user), db=Depends(get_db)):
    from app.models.conversation import Conversation
    from app.models.memory import Memory
    from app.models.plugin import Plugin
    from app.models.automation import Automation
    counts = {}
    for model, name in [(User, "users"), (Conversation, "conversations"), (Memory, "memories"), (Plugin, "plugins"), (Automation, "automations")]:
        result = await db.execute(select(func.count(model.id)))
        counts[name] = result.scalar()
    return {"status": "healthy", "counts": counts}
