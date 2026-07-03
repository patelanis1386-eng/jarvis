from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/")
async def list_notifications(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = NotificationService(db=db)
    notifications = await svc.get_notifications(user_id=current_user.id)
    return {"items": [{"id": n.id, "type": n.type, "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else None} for n in notifications]}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = NotificationService(db=db)
    await svc.mark_read(notification_id)
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = NotificationService(db=db)
    await svc.mark_all_read(user_id=current_user.id)
    return {"message": "All marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = NotificationService(db=db)
    await svc.delete_notification(notification_id)
    return {"message": "Deleted"}
