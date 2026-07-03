import importlib
import inspect
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

from app.plugins.base import BasePlugin


class PluginRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._plugins: Dict[str, BasePlugin] = {}
        self._plugin_classes: Dict[str, Type[BasePlugin]] = {}
        self._plugin_dirs: List[str] = []
        self._initialized = True

    def register_plugin(self, plugin_id: str, plugin_class: Type[BasePlugin]) -> BasePlugin:
        if plugin_id in self._plugins:
            raise ValueError(f"Plugin '{plugin_id}' is already registered")

        plugin = plugin_class()
        plugin.name = plugin.name or plugin_id
        self._plugins[plugin_id] = plugin
        self._plugin_classes[plugin_id] = plugin_class
        return plugin

    def get_plugin(self, plugin_id: str) -> Optional[BasePlugin]:
        return self._plugins.get(plugin_id)

    def list_plugins(self) -> Dict[str, BasePlugin]:
        return dict(self._plugins)

    def load_plugins(self, plugin_dir: Optional[str] = None):
        if plugin_dir and plugin_dir not in self._plugin_dirs:
            self._plugin_dirs.append(plugin_dir)

        for directory in self._plugin_dirs:
            if not os.path.isdir(directory):
                continue

            sys.path.insert(0, os.path.dirname(directory))
            for file in os.listdir(directory):
                if file.endswith("_plugin.py") or file.endswith("_service.py"):
                    module_name = file[:-3]
                    module_path = f"{os.path.basename(directory)}.{module_name}"

                    try:
                        module = importlib.import_module(module_path)
                        for name, obj in inspect.getmembers(module):
                            if (
                                inspect.isclass(obj)
                                and issubclass(obj, BasePlugin)
                                and obj is not BasePlugin
                                and not getattr(obj, "_base_plugin", False)
                            ):
                                plugin_id = getattr(obj, "name", name.lower().replace("plugin", ""))
                                self.register_plugin(plugin_id, obj)
                    except Exception as e:
                        print(f"Failed to load plugin {module_name}: {e}")

            if sys.path and sys.path[0] == os.path.dirname(directory):
                sys.path.pop(0)

    def install_plugin(self, plugin_id: str, plugin_class: Type[BasePlugin]) -> BasePlugin:
        return self.register_plugin(plugin_id, plugin_class)

    def uninstall_plugin(self, plugin_id: str) -> bool:
        if plugin_id not in self._plugins:
            return False

        plugin = self._plugins[plugin_id]
        import asyncio
        try:
            asyncio.get_event_loop().run_until_complete(plugin.cleanup())
        except Exception:
            pass

        del self._plugins[plugin_id]
        if plugin_id in self._plugin_classes:
            del self._plugin_classes[plugin_id]
        return True

    def get_plugin_class(self, plugin_id: str) -> Optional[Type[BasePlugin]]:
        return self._plugin_classes.get(plugin_id)
