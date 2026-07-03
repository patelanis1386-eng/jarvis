import base64
from email.message import EmailMessage
from typing import Any, Dict, List, Optional

from google.auth.exceptions import GoogleAuthError
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.plugins.base import BasePlugin


class GmailPlugin(BasePlugin):
    name = "gmail"
    description = "Gmail integration - read, send, and search emails"
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
        "read_emails": {"description": "Read emails from inbox", "params": {"max_results": 10, "query": ""}},
        "send_email": {"description": "Send an email", "params": {"to": "", "subject": "", "body": ""}},
        "search_emails": {"description": "Search emails", "params": {"query": "", "max_results": 10}},
        "get_unread_count": {"description": "Get unread email count", "params": {}},
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
                scopes=["https://www.googleapis.com/auth/gmail.modify"],
            )
            self.service = build("gmail", "v1", credentials=creds, static_discovery=False)
            return await super().initialize()
        except Exception as e:
            raise RuntimeError(f"Gmail initialization failed: {str(e)}")

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        if not self.service:
            raise RuntimeError("Gmail plugin not initialized")

        handlers = {
            "read_emails": self._read_emails,
            "send_email": self._send_email,
            "search_emails": self._search_emails,
            "get_unread_count": self._get_unread_count,
        }

        handler = handlers.get(action)
        if not handler:
            raise ValueError(f"Unknown action: {action}")
        return await handler(**params)

    async def _read_emails(self, max_results: int = 10, query: str = "") -> List[Dict[str, Any]]:
        try:
            query_str = query or "in:inbox"
            results = self.service.users().messages().list(
                userId="me", q=query_str, maxResults=max_results
            ).execute()

            emails = []
            for msg in results.get("messages", []):
                msg_data = self.service.users().messages().get(
                    userId="me", id=msg["id"], format="metadata",
                    metadataHeaders=["From", "Subject", "Date"]
                ).execute()

                headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
                emails.append({
                    "id": msg["id"],
                    "from": headers.get("From", ""),
                    "subject": headers.get("Subject", ""),
                    "date": headers.get("Date", ""),
                    "snippet": msg_data.get("snippet", ""),
                    "label_ids": msg_data.get("labelIds", []),
                })
            return emails
        except HttpError as e:
            raise RuntimeError(f"Failed to read emails: {str(e)}")

    async def _send_email(self, to: str, subject: str, body: str) -> Dict[str, Any]:
        try:
            message = EmailMessage()
            message.set_content(body)
            message["To"] = to
            message["Subject"] = subject

            encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
            sent = self.service.users().messages().send(
                userId="me", body={"raw": encoded}
            ).execute()
            return {"id": sent["id"], "status": "sent", "to": to, "subject": subject}
        except HttpError as e:
            raise RuntimeError(f"Failed to send email: {str(e)}")

    async def _search_emails(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        return await self._read_emails(max_results=max_results, query=query)

    async def _get_unread_count(self) -> Dict[str, int]:
        try:
            results = self.service.users().messages().list(
                userId="me", q="is:unread", maxResults=0
            ).execute()
            return {"unread_count": results.get("resultSizeEstimate", 0)}
        except HttpError as e:
            raise RuntimeError(f"Failed to get unread count: {str(e)}")

    async def cleanup(self) -> bool:
        self.service = None
        return await super().cleanup()
