import importlib
import inspect
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import aiofiles
import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.plugin import Plugin
from app.plugins.base import BasePlugin
from app.plugins.registry import PluginRegistry


class PluginError(Exception):
    pass


PLUGIN_MARKETPLACE_URL = "https://api.jarvis-x.ai/plugins"


class PluginService:
    def __init__(
        self,
        db: AsyncSession,
        registry: Optional[PluginRegistry] = None,
        plugin_dir: str = "app/plugins/installed",
    ):
        self.db = db
        self.registry = registry or PluginRegistry()
        self.plugin_dir = Path(plugin_dir)
        self.plugin_dir.mkdir(parents=True, exist_ok=True)

    async def list_plugins(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        plugins = self.registry.list_plugins()
        return [
            {
                "id": plugin_id,
                "name": plugin.name,
                "description": plugin.description,
                "version": plugin.version,
                "author": plugin.author,
                "actions": list(plugin.actions.keys()) if hasattr(plugin, "actions") else [],
                "installed": True,
            }
            for plugin_id, plugin in plugins.items()
        ][skip : skip + limit]

    async def list_installed(self, user_id: str) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(PluginInstallation).where(PluginInstallation.user_id == user_id)
        )
        installations = result.scalars().all()
        installed = []
        for inst in installations:
            plugin = self.registry.get_plugin(inst.plugin_id)
            if plugin:
                installed.append({
                    "id": inst.plugin_id,
                    "name": plugin.name,
                    "description": plugin.description,
                    "version": plugin.version,
                    "author": plugin.author,
                    "config": inst.config,
                    "enabled": inst.enabled,
                    "installed_at": inst.installed_at.isoformat(),
                })
        return installed

    async def install_plugin(self, user_id: str, plugin_id: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        plugin = self.registry.get_plugin(plugin_id)
        if not plugin:
            raise PluginError(f"Plugin '{plugin_id}' not found in registry")

        existing = await self.db.execute(
            select(PluginInstallation).where(
                PluginInstallation.plugin_id == plugin_id,
                PluginInstallation.user_id == user_id,
            )
        )
        if existing.scalar_one_or_none():
            raise PluginError(f"Plugin '{plugin_id}' is already installed")

        installation = PluginInstallation(
            id=str(uuid4()),
            user_id=user_id,
            plugin_id=plugin_id,
            config=config or {},
            enabled=True,
            installed_at=datetime.now(timezone.utc),
        )
        self.db.add(installation)

        try:
            await plugin.initialize()
        except Exception as e:
            raise PluginError(f"Plugin initialization failed: {str(e)}")

        await self.db.commit()
        return {
            "id": plugin_id,
            "name": plugin.name,
            "version": plugin.version,
            "status": "installed",
        }

    async def uninstall_plugin(self, user_id: str, plugin_id: str) -> bool:
        result = await self.db.execute(
            select(PluginInstallation).where(
                PluginInstallation.plugin_id == plugin_id,
                PluginInstallation.user_id == user_id,
            )
        )
        installation = result.scalar_one_or_none()
        if not installation:
            raise PluginError(f"Plugin '{plugin_id}' is not installed")

        plugin = self.registry.get_plugin(plugin_id)
        if plugin:
            try:
                await plugin.cleanup()
            except Exception:
                pass

        await self.db.delete(installation)
        await self.db.commit()
        return True

    async def update_plugin_config(self, user_id: str, plugin_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        result = await self.db.execute(
            select(PluginInstallation).where(
                PluginInstallation.plugin_id == plugin_id,
                PluginInstallation.user_id == user_id,
            )
        )
        installation = result.scalar_one_or_none()
        if not installation:
            raise PluginError(f"Plugin '{plugin_id}' is not installed")

        installation.config = config
        await self.db.commit()
        return {"id": plugin_id, "config": config}

    async def execute_plugin_action(
        self, user_id: str, plugin_id: str, action: str, params: Dict[str, Any]
    ) -> Any:
        result = await self.db.execute(
            select(PluginInstallation).where(
                PluginInstallation.plugin_id == plugin_id,
                PluginInstallation.user_id == user_id,
                PluginInstallation.enabled == True,
            )
        )
        installation = result.scalar_one_or_none()
        if not installation:
            raise PluginError(f"Plugin '{plugin_id}' is not installed or disabled")

        plugin = self.registry.get_plugin(plugin_id)
        if not plugin:
            raise PluginError(f"Plugin '{plugin_id}' not found in registry")

        if action not in plugin.actions:
            raise PluginError(f"Action '{action}' not available for plugin '{plugin_id}'")

        try:
            result_data = await plugin.execute(action, params)
            return result_data
        except Exception as e:
            raise PluginError(f"Plugin action failed: {str(e)}")

    async def browse_marketplace(self, category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            params = {}
            if category:
                params["category"] = category
            if search:
                params["search"] = search

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    PLUGIN_MARKETPLACE_URL, params=params, timeout=10
                )
                response.raise_for_status()
                return response.json()
        except Exception:
            return [
                {
                    "id": "example-plugin",
                    "name": "Example Plugin",
                    "description": "A sample marketplace plugin",
                    "version": "1.0.0",
                    "author": "JARVIS X",
                    "category": "utility",
                    "downloads": 100,
                    "rating": 4.5,
                }
            ]


from datetime import datetime
