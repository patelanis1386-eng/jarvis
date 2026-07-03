import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from app.automation.triggers import BaseTrigger
from app.automation.actions import BaseAction

logger = logging.getLogger(__name__)


class AutomationEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._triggers: Dict[str, BaseTrigger] = {}
        self._actions: Dict[str, BaseAction] = {}
        self._user_map: Dict[str, str] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._webhook_routes: Dict[str, str] = {}
        self._event_handlers: Dict[str, List[str]] = {}
        self._lock = asyncio.Lock()
        self._initialized = True

    def register_trigger(
        self, automation_id: str, trigger: BaseTrigger, action: BaseAction, user_id: str
    ):
        self._triggers[automation_id] = trigger
        self._actions[automation_id] = action
        self._user_map[automation_id] = user_id

        if isinstance(trigger, WebhookTrigger):
            self._webhook_routes[trigger.webhook_id] = automation_id

        if isinstance(trigger, EventTrigger):
            for event_type in trigger.event_types:
                if event_type not in self._event_handlers:
                    self._event_handlers[event_type] = []
                self._event_handlers[event_type].append(automation_id)

    def unregister_trigger(self, automation_id: str):
        self._triggers.pop(automation_id, None)
        self._actions.pop(automation_id, None)
        self._user_map.pop(automation_id, None)

        for route, aid in list(self._webhook_routes.items()):
            if aid == automation_id:
                del self._webhook_routes[route]

        for event_type in list(self._event_handlers.keys()):
            self._event_handlers[event_type] = [
                aid for aid in self._event_handlers[event_type]
                if aid != automation_id
            ]
            if not self._event_handlers[event_type]:
                del self._event_handlers[event_type]

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Automation engine started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Automation engine stopped")

    async def _run_loop(self):
        while self._running:
            try:
                await self._check_schedule_triggers()
            except Exception as e:
                logger.error(f"Error checking triggers: {e}")
            await asyncio.sleep(30)

    async def _check_schedule_triggers(self):
        now = datetime.now(timezone.utc)
        async with self._lock:
            for automation_id, trigger in list(self._triggers.items()):
                if isinstance(trigger, ScheduleTrigger):
                    if trigger.should_fire(now):
                        action = self._actions.get(automation_id)
                        if action:
                            logger.info(f"Firing schedule trigger for automation {automation_id}")
                            asyncio.create_task(
                                self._execute_action(automation_id, action)
                            )

    async def handle_webhook(self, webhook_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            automation_id = self._webhook_routes.get(webhook_id)
            if not automation_id:
                return {"status": "error", "message": "Webhook not found"}

            trigger = self._triggers.get(automation_id)
            action = self._actions.get(automation_id)

            if not trigger or not action:
                return {"status": "error", "message": "Automation not found"}

        logger.info(f"Webhook triggered automation {automation_id}")
        asyncio.create_task(self._execute_action(automation_id, action, data))
        return {"status": "accepted", "automation_id": automation_id}

    async def handle_event(self, event_type: str, event_data: Dict[str, Any]):
        async with self._lock:
            automation_ids = self._event_handlers.get(event_type, [])

        for automation_id in automation_ids:
            trigger = self._triggers.get(automation_id)
            action = self._actions.get(automation_id)
            if trigger and action and isinstance(trigger, EventTrigger):
                if trigger.matches(event_data):
                    logger.info(f"Event triggered automation {automation_id}")
                    asyncio.create_task(
                        self._execute_action(automation_id, action, event_data)
                    )

    async def _execute_action(
        self, automation_id: str, action: BaseAction, data: Optional[Dict[str, Any]] = None
    ):
        try:
            await action.execute(data)
        except Exception as e:
            logger.error(f"Automation {automation_id} execution failed: {e}")

    def get_status(self) -> Dict[str, Any]:
        return {
            "running": self._running,
            "registered_triggers": len(self._triggers),
            "scheduled_count": sum(
                1 for t in self._triggers.values() if isinstance(t, ScheduleTrigger)
            ),
            "webhook_count": len(self._webhook_routes),
            "event_handlers": len(self._event_handlers),
        }


from app.automation.triggers import ScheduleTrigger, WebhookTrigger, EventTrigger
from app.automation.actions import BaseAction
