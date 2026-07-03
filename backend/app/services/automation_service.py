from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import Automation
from app.automation.engine import AutomationEngine
from app.automation.triggers import ScheduleTrigger, WebhookTrigger, EventTrigger
from app.automation.actions import HttpAction, ScriptAction, EmailAction, NotificationAction


class AutomationNotFoundError(Exception):
    pass


class AutomationService:
    def __init__(self, db: AsyncSession, engine: Optional[AutomationEngine] = None):
        self.db = db
        self.engine = engine or AutomationEngine()

    async def create_automation(
        self,
        user_id: str,
        name: str,
        description: str,
        trigger_type: str,
        trigger_config: Dict[str, Any],
        action_type: str,
        action_config: Dict[str, Any],
        enabled: bool = True,
    ) -> Automation:
        automation = Automation(
            id=str(uuid4()),
            user_id=user_id,
            name=name,
            description=description,
            trigger_type=trigger_type,
            trigger_config=trigger_config,
            action_type=action_type,
            action_config=action_config,
            enabled=enabled,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            last_run_at=None,
            run_count=0,
        )
        self.db.add(automation)
        await self.db.commit()
        await self.db.refresh(automation)

        if enabled:
            await self._register_trigger(automation)

        return automation

    async def _register_trigger(self, automation: Automation):
        trigger = self._build_trigger(automation)
        action = self._build_action(automation)
        if trigger and action:
            self.engine.register_trigger(
                automation.id, trigger, action, automation.user_id
            )

    def _build_trigger(self, automation: Automation):
        config = automation.trigger_config
        if automation.trigger_type == "schedule":
            return ScheduleTrigger(
                cron_expression=config.get("cron", "0 * * * *"),
                timezone=config.get("timezone", "UTC"),
            )
        elif automation.trigger_type == "webhook":
            return WebhookTrigger(
                webhook_id=automation.id,
                secret=config.get("secret", ""),
            )
        elif automation.trigger_type == "event":
            return EventTrigger(
                event_type=config.get("event_type", "custom"),
                filters=config.get("filters", {}),
            )
        return None

    def _build_action(self, automation: Automation):
        config = automation.action_config
        if automation.action_type == "http":
            return HttpAction(
                url=config["url"],
                method=config.get("method", "POST"),
                headers=config.get("headers", {}),
                body=config.get("body", {}),
            )
        elif automation.action_type == "script":
            return ScriptAction(
                command=config["command"],
                shell=config.get("shell", True),
                cwd=config.get("cwd"),
            )
        elif automation.action_type == "email":
            return EmailAction(
                to=config["to"],
                subject=config.get("subject", ""),
                body=config.get("body", ""),
            )
        elif automation.action_type == "notification":
            return NotificationAction(
                title=config.get("title", "Automation"),
                message=config.get("message", ""),
                notification_type=config.get("type", "info"),
            )
        return None

    async def get_automations(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Automation]:
        query = (
            select(Automation)
            .where(Automation.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(Automation.created_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_automation(self, automation_id: str, updates: Dict[str, Any]) -> Automation:
        result = await self.db.execute(
            select(Automation).where(Automation.id == automation_id)
        )
        automation = result.scalar_one_or_none()
        if not automation:
            raise AutomationNotFoundError(f"Automation {automation_id} not found")

        allowed_fields = {
            "name", "description", "trigger_type", "trigger_config",
            "action_type", "action_config", "enabled",
        }
        for key, value in updates.items():
            if key in allowed_fields:
                setattr(automation, key, value)
        automation.updated_at = datetime.now(timezone.utc)

        self.engine.unregister_trigger(automation.id)
        if automation.enabled:
            await self._register_trigger(automation)

        await self.db.commit()
        await self.db.refresh(automation)
        return automation

    async def delete_automation(self, automation_id: str) -> bool:
        result = await self.db.execute(
            select(Automation).where(Automation.id == automation_id)
        )
        automation = result.scalar_one_or_none()
        if not automation:
            raise AutomationNotFoundError(f"Automation {automation_id} not found")

        self.engine.unregister_trigger(automation_id)
        await self.db.execute(
            delete(AutomationRunLog).where(AutomationRunLog.automation_id == automation_id)
        )
        await self.db.delete(automation)
        await self.db.commit()
        return True

    async def execute_automation(self, automation_id: str) -> Dict[str, Any]:
        result = await self.db.execute(
            select(Automation).where(Automation.id == automation_id)
        )
        automation = result.scalar_one_or_none()
        if not automation:
            raise AutomationNotFoundError(f"Automation {automation_id} not found")

        action = self._build_action(automation)
        if not action:
            raise ValueError(f"No action configured for automation {automation_id}")

        log = AutomationRunLog(
            id=str(uuid4()),
            automation_id=automation_id,
            user_id=automation.user_id,
            status="running",
            trigger_type="manual",
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        await self.db.commit()

        try:
            result_data = await action.execute()
            log.status = "success"
            log.result = result_data
            log.completed_at = datetime.now(timezone.utc)
            automation.last_run_at = datetime.now(timezone.utc)
            automation.run_count += 1
            await self.db.commit()
            return {"status": "success", "result": result_data}
        except Exception as e:
            log.status = "failed"
            log.error = str(e)
            log.completed_at = datetime.now(timezone.utc)
            await self.db.commit()
            return {"status": "failed", "error": str(e)}

    async def get_run_logs(
        self, automation_id: str, skip: int = 0, limit: int = 50
    ) -> List[AutomationRunLog]:
        query = (
            select(AutomationRunLog)
            .where(AutomationRunLog.automation_id == automation_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(AutomationRunLog.started_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
