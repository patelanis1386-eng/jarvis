from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.plugins.base import BasePlugin


class CalendarPlugin(BasePlugin):
    name = "calendar"
    description = "Google Calendar integration - manage events"
    version = "1.0.0"
    author = "JARVIS X"
    config_schema = {
        "type": "object",
        "properties": {
            "client_id": {"type": "string"},
            "client_secret": {"type": "string"},
            "refresh_token": {"type": "string"},
        },
        "required": ["refresh_token"],
    }
    actions = {
        "get_events": {"description": "Get upcoming events", "params": {"max_results": 10, "time_min": "", "time_max": ""}},
        "create_event": {"description": "Create a calendar event", "params": {"summary": "", "start_time": "", "end_time": "", "description": ""}},
        "update_event": {"description": "Update an event", "params": {"event_id": "", "updates": {}}},
        "delete_event": {"description": "Delete an event", "params": {"event_id": ""}},
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.service = None

    async def initialize(self) -> bool:
        try:
            creds = Credentials(
                token=None,
                refresh_token=self.config.get("refresh_token"),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.config.get("client_id", "default"),
                client_secret=self.config.get("client_secret", "default"),
                scopes=["https://www.googleapis.com/auth/calendar"],
            )
            self.service = build("calendar", "v3", credentials=creds, static_discovery=False)
            return await super().initialize()
        except Exception as e:
            raise RuntimeError(f"Calendar initialization failed: {str(e)}")

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        if not self.service:
            raise RuntimeError("Calendar plugin not initialized")

        handlers = {
            "get_events": self._get_events,
            "create_event": self._create_event,
            "update_event": self._update_event,
            "delete_event": self._delete_event,
        }

        handler = handlers.get(action)
        if not handler:
            raise ValueError(f"Unknown action: {action}")
        return await handler(**params)

    async def _get_events(
        self, max_results: int = 10, time_min: Optional[str] = None, time_max: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            now = datetime.now(timezone.utc).isoformat()
            events_result = self.service.events().list(
                calendarId="primary",
                timeMin=time_min or now,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            events = []
            for event in events_result.get("items", []):
                start = event["start"].get("dateTime", event["start"].get("date"))
                end = event["end"].get("dateTime", event["end"].get("date"))
                events.append({
                    "id": event["id"],
                    "summary": event.get("summary", ""),
                    "description": event.get("description", ""),
                    "location": event.get("location", ""),
                    "start": start,
                    "end": end,
                    "status": event.get("status", ""),
                    "html_link": event.get("htmlLink", ""),
                })
            return events
        except HttpError as e:
            raise RuntimeError(f"Failed to get events: {str(e)}")

    async def _create_event(
        self, summary: str, start_time: str, end_time: str, description: str = "",
        location: str = "", timezone_str: str = "UTC"
    ) -> Dict[str, Any]:
        try:
            event = {
                "summary": summary,
                "description": description,
                "location": location,
                "start": {"dateTime": start_time, "timeZone": timezone_str},
                "end": {"dateTime": end_time, "timeZone": timezone_str},
            }
            created = self.service.events().insert(
                calendarId="primary", body=event
            ).execute()
            return {
                "id": created["id"],
                "summary": created.get("summary", ""),
                "start": created["start"].get("dateTime"),
                "end": created["end"].get("dateTime"),
                "html_link": created.get("htmlLink", ""),
                "status": "created",
            }
        except HttpError as e:
            raise RuntimeError(f"Failed to create event: {str(e)}")

    async def _update_event(self, event_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        try:
            event = self.service.events().get(
                calendarId="primary", eventId=event_id
            ).execute()

            for key, value in updates.items():
                if key in ("summary", "description", "location"):
                    event[key] = value
                elif key == "start_time":
                    event["start"] = {"dateTime": value, "timeZone": updates.get("timezone", "UTC")}
                elif key == "end_time":
                    event["end"] = {"dateTime": value, "timeZone": updates.get("timezone", "UTC")}

            updated = self.service.events().update(
                calendarId="primary", eventId=event_id, body=event
            ).execute()
            return {"id": updated["id"], "status": "updated"}
        except HttpError as e:
            raise RuntimeError(f"Failed to update event: {str(e)}")

    async def _delete_event(self, event_id: str) -> Dict[str, str]:
        try:
            self.service.events().delete(
                calendarId="primary", eventId=event_id
            ).execute()
            return {"id": event_id, "status": "deleted"}
        except HttpError as e:
            raise RuntimeError(f"Failed to delete event: {str(e)}")

    async def cleanup(self) -> bool:
        self.service = None
        return await super().cleanup()
