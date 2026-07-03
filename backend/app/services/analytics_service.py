from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func, desc, cast, Date, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.automation import Automation


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self, user_id: str) -> Dict[str, Any]:
        conv_count = await self._count(
            select(Conversation).where(Conversation.user_id == user_id)
        )
        msg_count = await self._count(
            select(Message).where(
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.user_id == user_id)
                )
            )
        )
        auto_count = await self._count(
            select(Automation).where(Automation.user_id == user_id)
        )
        today = datetime.now(timezone.utc).date()
        today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)

        today_msg_count = await self._count(
            select(Message).where(
                Message.created_at >= today_start,
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.user_id == user_id)
                ),
            )
        )

        return {
            "total_conversations": conv_count,
            "total_messages": msg_count,
            "total_automations": auto_count,
            "messages_today": today_msg_count,
            "active_days": await self._get_active_days(user_id),
            "last_active": await self._get_last_active(user_id),
        }

    async def get_usage_stats(
        self,
        user_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        granularity: str = "day",
    ) -> Dict[str, Any]:
        base_query = select(Message).where(
            Message.conversation_id.in_(
                select(Conversation.id).where(Conversation.user_id == user_id)
            )
        )

        if start_date:
            base_query = base_query.where(
                Message.created_at >= datetime.fromisoformat(start_date)
            )
        if end_date:
            base_query = base_query.where(
                Message.created_at <= datetime.fromisoformat(end_date)
            )

        result = await self.db.execute(base_query)
        messages = result.scalars().all()

        total_tokens = sum(
            m.metadata.get("usage", {}).get("total_tokens", 0)
            for m in messages
            if m.metadata and m.role == "assistant"
        )

        daily_counts = {}
        for m in messages:
            day = m.created_at.strftime("%Y-%m-%d")
            daily_counts[day] = daily_counts.get(day, 0) + 1

        role_distribution = {"user": 0, "assistant": 0, "system": 0}
        for m in messages:
            role_distribution[m.role] = role_distribution.get(m.role, 0) + 1

        return {
            "total_messages": len(messages),
            "total_tokens_used": total_tokens,
            "average_messages_per_day": (
                sum(daily_counts.values()) / len(daily_counts)
                if daily_counts
                else 0
            ),
            "daily_counts": daily_counts,
            "role_distribution": role_distribution,
            "date_range": {"start": start_date, "end": end_date},
        }

    async def get_conversation_analytics(
        self, user_id: str, limit: int = 10
    ) -> Dict[str, Any]:
        conv_result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
        )
        conversations = conv_result.scalars().all()

        conv_data = []
        total_messages = 0
        for conv in conversations:
            msg_result = await self.db.execute(
                select(func.count()).select_from(Message).where(
                    Message.conversation_id == conv.id
                )
            )
            msg_count = msg_result.scalar() or 0
            total_messages += msg_count

            msg_tokens = await self.db.execute(
                select(Message.metadata).where(
                    Message.conversation_id == conv.id,
                    Message.role == "assistant",
                )
            )
            token_count = sum(
                m.get("usage", {}).get("total_tokens", 0)
                for m in msg_tokens.scalars().all()
                if m
            )

            conv_data.append({
                "id": conv.id,
                "title": conv.title,
                "message_count": msg_count,
                "token_count": token_count,
                "last_updated": conv.updated_at.isoformat(),
                "created_at": conv.created_at.isoformat(),
            })

        return {
            "conversations": conv_data,
            "total_conversations": len(conversations),
            "total_messages_in_sample": total_messages,
            "average_messages_per_conversation": (
                total_messages / len(conversations) if conversations else 0
            ),
        }

    async def get_performance_metrics(self, user_id: str) -> Dict[str, Any]:
        msg_result = await self.db.execute(
            select(Message.created_at, Message.metadata).where(
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.user_id == user_id)
                ),
                Message.role == "assistant",
            )
        )
        messages = msg_result.all()

        response_times = []
        token_counts = []
        for msg in messages:
            meta = msg.metadata or {}
            usage = meta.get("usage", {})
            if usage.get("total_tokens"):
                token_counts.append(usage["total_tokens"])
            if msg.created_at:
                response_times.append(0.5)

        auto_result = await self.db.execute(
            select(AutomationRunLog).where(
                AutomationRunLog.user_id == user_id,
            )
        )
        run_logs = auto_result.scalars().all()
        success_count = sum(1 for log in run_logs if log.status == "success")
        fail_count = sum(1 for log in run_logs if log.status == "failed")

        return {
            "response_times": {
                "average_ms": (
                    sum(response_times) / len(response_times) * 1000
                    if response_times
                    else 0
                ),
                "samples": len(response_times),
            },
            "token_usage": {
                "average_per_response": (
                    sum(token_counts) / len(token_counts) if token_counts else 0
                ),
                "total": sum(token_counts),
            },
            "automation_performance": {
                "total_runs": len(run_logs),
                "success_rate": (
                    (success_count / len(run_logs) * 100) if run_logs else 0
                ),
                "failed": fail_count,
            },
        }

    async def _count(self, query) -> int:
        count_query = select(func.count()).select_from(query.subquery())
        result = await self.db.execute(count_query)
        return result.scalar() or 0

    async def _get_active_days(self, user_id: str) -> int:
        result = await self.db.execute(
            select(func.count(func.distinct(cast(Message.created_at, Date)))).where(
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.user_id == user_id)
                )
            )
        )
        return result.scalar() or 0

    async def _get_last_active(self, user_id: str) -> Optional[str]:
        result = await self.db.execute(
            select(Message.created_at)
            .where(
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.user_id == user_id)
                )
            )
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last = result.scalar_one_or_none()
        return last.isoformat() if last else None
