import hashlib
import hmac
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class BaseTrigger(ABC):
    @abstractmethod
    async def evaluate(self, context: Dict[str, Any]) -> bool:
        raise NotImplementedError


class ScheduleTrigger(BaseTrigger):
    def __init__(self, cron_expression: str, timezone: str = "UTC"):
        self.cron_expression = cron_expression
        self.timezone = timezone
        self._last_fired: Optional[datetime] = None
        self._parsed = self._parse_cron(cron_expression)

    def _parse_cron(self, cron: str) -> Dict[str, Any]:
        parts = cron.strip().split()
        if len(parts) != 5:
            raise ValueError(f"Invalid cron expression: {cron}. Expected 5 fields.")

        def parse_field(field: str, min_val: int, max_val: int) -> set:
            if field == "*":
                return set(range(min_val, max_val + 1))

            values = set()
            for part in field.split(","):
                if "/" in part:
                    base, step = part.split("/")
                    step = int(step)
                    if base == "*":
                        base_range = range(min_val, max_val + 1)
                    else:
                        start, end = [int(x) for x in base.split("-")]
                        base_range = range(start, end + 1)
                    values.update(base_range[::step])
                elif "-" in part:
                    start, end = [int(x) for x in part.split("-")]
                    values.update(range(start, end + 1))
                else:
                    values.add(int(part))
            return values

        return {
            "minute": parse_field(parts[0], 0, 59),
            "hour": parse_field(parts[1], 0, 23),
            "day_of_month": parse_field(parts[2], 1, 31),
            "month": parse_field(parts[3], 1, 12),
            "day_of_week": parse_field(parts[4], 0, 6),
        }

    def should_fire(self, now: Optional[datetime] = None) -> bool:
        now = now or datetime.now(timezone.utc)

        if self._last_fired and (now - self._last_fired).total_seconds() < 60:
            return False

        if now.month not in self._parsed["month"]:
            return False
        if now.day not in self._parsed["day_of_month"]:
            return False
        if now.weekday() not in self._parsed["day_of_week"]:
            return False
        if now.hour not in self._parsed["hour"]:
            return False
        if now.minute not in self._parsed["minute"]:
            return False

        self._last_fired = now
        return True

    async def evaluate(self, context: Dict[str, Any]) -> bool:
        current_time = context.get("current_time", datetime.now(timezone.utc))
        return self.should_fire(current_time)


class WebhookTrigger(BaseTrigger):
    def __init__(self, webhook_id: str, secret: str = ""):
        self.webhook_id = webhook_id
        self.secret = secret

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        if not self.secret:
            return True
        expected = hmac.new(
            self.secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def evaluate(self, context: Dict[str, Any]) -> bool:
        received_id = context.get("webhook_id", "")
        return received_id == self.webhook_id


class EventTrigger(BaseTrigger):
    def __init__(self, event_type: str, filters: Optional[Dict[str, Any]] = None):
        self.event_type = event_type
        self.event_types = [event_type]
        self.filters = filters or {}

    def matches(self, event_data: Dict[str, Any]) -> bool:
        for key, value in self.filters.items():
            if key in event_data:
                if event_data[key] != value:
                    return False
            else:
                nested = event_data
                for part in key.split("."):
                    if isinstance(nested, dict):
                        nested = nested.get(part, {})
                    else:
                        return False
                if nested != value:
                    return False
        return True

    async def evaluate(self, context: Dict[str, Any]) -> bool:
        event_type = context.get("event_type", "")
        event_data = context.get("event_data", {})

        if event_type != self.event_type:
            return False

        return self.matches(event_data)
