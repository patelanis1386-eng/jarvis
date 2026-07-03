from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional


class BaseAgent(ABC):
    name: str = "base_agent"
    description: str = "Base agent class"
    version: str = "1.0.0"
    capabilities: List[str] = []

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.context: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []

    @abstractmethod
    async def process(self, input_data: Any, **kwargs) -> Any:
        raise NotImplementedError

    async def stream(self, input_data: Any, **kwargs) -> AsyncGenerator[str, None]:
        result = await self.process(input_data, **kwargs)
        if isinstance(result, str):
            chunk_size = kwargs.get("chunk_size", 100)
            for i in range(0, len(result), chunk_size):
                yield result[i : i + chunk_size]
        else:
            yield str(result)

    async def think(self, context: Dict[str, Any]) -> Dict[str, Any]:
        reasoning_steps = []
        thought = "Analyzing input and determining approach"
        reasoning_steps.append({"step": 1, "thought": thought})
        return {
            "reasoning": reasoning_steps,
            "conclusion": "Ready to act",
            "confidence": 0.8,
        }

    async def act(self, plan: Dict[str, Any]) -> Any:
        action = plan.get("action", "process")
        params = plan.get("parameters", {})
        return await self.process(**params)

    def update_context(self, key: str, value: Any):
        self.context[key] = value

    def get_context(self, key: str, default: Any = None) -> Any:
        return self.context.get(key, default)

    def add_to_history(self, role: str, content: str, metadata: Optional[Dict] = None):
        self.history.append({
            "role": role,
            "content": content,
            "metadata": metadata or {},
        })

    def clear_history(self):
        self.history.clear()

    def get_recent_history(self, n: int = 10) -> List[Dict[str, Any]]:
        return self.history[-n:]
