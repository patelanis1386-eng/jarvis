import asyncio
import subprocess
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

import httpx


class BaseAction(ABC):
    @abstractmethod
    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Any:
        raise NotImplementedError


class HttpAction(BaseAction):
    def __init__(
        self,
        url: str,
        method: str = "POST",
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Dict[str, Any]] = None,
        timeout: float = 30.0,
    ):
        self.url = url
        self.method = method.upper()
        self.headers = headers or {}
        self.body = body or {}
        self.timeout = timeout

    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=self.method,
                    url=self.url,
                    headers=self.headers,
                    json=self.body,
                    timeout=self.timeout,
                )
                return {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "body": response.text[:5000],
                    "success": response.is_success,
                }
            except httpx.TimeoutException:
                return {"status_code": 0, "error": "Request timeout", "success": False}
            except httpx.RequestError as e:
                return {"status_code": 0, "error": str(e), "success": False}


class ScriptAction(BaseAction):
    def __init__(
        self,
        command: str,
        shell: bool = True,
        cwd: Optional[str] = None,
        timeout: float = 60.0,
    ):
        self.command = command
        self.shell = shell
        self.cwd = cwd
        self.timeout = timeout

    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            process = await asyncio.create_subprocess_shell(
                self.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.cwd,
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=self.timeout
                )
                return {
                    "return_code": process.returncode,
                    "stdout": stdout.decode("utf-8", errors="replace")[:5000],
                    "stderr": stderr.decode("utf-8", errors="replace")[:5000],
                    "success": process.returncode == 0,
                }
            except asyncio.TimeoutError:
                process.kill()
                return {"return_code": -1, "error": "Script timeout", "success": False}
        except Exception as e:
            return {"return_code": -1, "error": str(e), "success": False}


class EmailAction(BaseAction):
    def __init__(self, to: str, subject: str, body: str, cc: Optional[str] = None):
        self.to = to
        self.subject = subject
        self.body = body
        self.cc = cc

    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if context:
            self.subject = self._format_template(self.subject, context)
            self.body = self._format_template(self.body, context)

        try:
            import smtplib
            from email.message import EmailMessage

            msg = EmailMessage()
            msg.set_content(self.body)
            msg["Subject"] = self.subject
            msg["To"] = self.to
            if self.cc:
                msg["Cc"] = self.cc

            return {
                "to": self.to,
                "subject": self.subject,
                "status": "ready",
                "message": "Email prepared for sending (configure SMTP in settings)",
            }
        except Exception as e:
            return {"to": self.to, "subject": self.subject, "error": str(e), "success": False}

    def _format_template(self, template: str, context: Dict[str, Any]) -> str:
        try:
            return template.format(**context)
        except KeyError:
            return template


class NotificationAction(BaseAction):
    def __init__(
        self,
        title: str,
        message: str,
        notification_type: str = "info",
        link: Optional[str] = None,
    ):
        self.title = title
        self.message = message
        self.notification_type = notification_type
        self.link = link

    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if context:
            self.title = self.title.format(**context)
            self.message = self.message.format(**context)

        return {
            "title": self.title,
            "message": self.message,
            "type": self.notification_type,
            "link": self.link,
            "status": "created",
        }


class PluginAction(BaseAction):
    def __init__(self, plugin_id: str, action: str, params: Optional[Dict[str, Any]] = None):
        self.plugin_id = plugin_id
        self.action = action
        self.params = params or {}

    async def execute(self, context: Optional[Dict[str, Any]] = None) -> Any:
        from app.plugins.registry import PluginRegistry

        registry = PluginRegistry()
        plugin = registry.get_plugin(self.plugin_id)
        if not plugin:
            return {"error": f"Plugin '{self.plugin_id}' not found", "success": False}

        merged_params = dict(self.params)
        if context:
            merged_params.update(context)

        try:
            result = await plugin.execute(self.action, merged_params)
            return {"result": result, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}
