from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select, delete, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationNotFoundError(Exception):
    pass


NOTIFICATION_TYPES = {"info", "success", "warning", "error"}


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        if notification_type not in NOTIFICATION_TYPES:
            raise ValueError(
                f"Invalid notification type '{notification_type}'. Must be one of: {NOTIFICATION_TYPES}"
            )

        notification = Notification(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
            metadata=metadata or {},
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def get_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        if notification_type:
            query = query.where(Notification.notification_type == notification_type)
        query = (
            query
            .offset(skip)
            .limit(limit)
            .order_by(desc(Notification.created_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def mark_read(self, notification_id: str) -> Notification:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise NotificationNotFoundError(
                f"Notification {notification_id} not found"
            )
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def mark_all_read(self, user_id: str) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        notifications = result.scalars().all()
        now = datetime.now(timezone.utc)
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        await self.db.commit()
        return len(notifications)

    async def delete_notification(self, notification_id: str) -> bool:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalar_one_or_none()
        if not notification:
            raise NotificationNotFoundError(
                f"Notification {notification_id} not found"
            )
        await self.db.delete(notification)
        await self.db.commit()
        return True

    async def get_unread_count(self, user_id: str) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return len(result.scalars().all())
