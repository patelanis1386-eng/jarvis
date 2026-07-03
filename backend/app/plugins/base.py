from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BasePlugin(ABC):
    name: str = ""
    description: str = ""
    version: str = "1.0.0"
    author: str = ""
    config_schema: Dict[str, Any] = {}
    actions: Dict[str, Dict[str, Any]] = {}

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self._initialized = False

    @abstractmethod
    async def initialize(self) -> bool:
        self._initialized = True
        return True

    @abstractmethod
    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        raise NotImplementedError

    @abstractmethod
    async def cleanup(self) -> bool:
        self._initialized = False
        return True

    def validate_config(self, config: Dict[str, Any]) -> bool:
        if not self.config_schema:
            return True
        required_fields = self.config_schema.get("required", [])
        for field in required_fields:
            if field not in config:
                return False
        return True

    def get_manifest(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "author": self.author,
            "actions": {k: v.get("description", k) for k, v in self.actions.items()},
            "config_schema": self.config_schema,
        }
