import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional, Type

from app.agents.base import BaseAgent


class AgentNotFoundError(Exception):
    pass


class AgentOrchestrator:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._registry: Dict[str, BaseAgent] = {}
        self._agent_configs: Dict[str, Dict[str, Any]] = {}
        self._initialized = True

    def register_agent(
        self, agent_id: str, agent_class: Type[BaseAgent], config: Optional[Dict[str, Any]] = None
    ) -> BaseAgent:
        if agent_id in self._registry:
            raise ValueError(f"Agent '{agent_id}' is already registered")
        agent = agent_class(config=config or {})
        self._registry[agent_id] = agent
        self._agent_configs[agent_id] = config or {}
        return agent

    def get_agent(self, agent_id: str) -> BaseAgent:
        agent = self._registry.get(agent_id)
        if not agent:
            raise AgentNotFoundError(f"Agent '{agent_id}' not found in registry")
        return agent

    def list_agents(self) -> Dict[str, Dict[str, Any]]:
        return {
            agent_id: {
                "name": agent.name,
                "description": agent.description,
                "version": agent.version,
                "capabilities": agent.capabilities,
                "config": self._agent_configs.get(agent_id, {}),
            }
            for agent_id, agent in self._registry.items()
        }

    async def route_task(self, task: str, input_data: Any = None, **kwargs) -> Any:
        agent_id = self._determine_agent(task)
        agent = self.get_agent(agent_id)
        return await agent.process(
            input_data or task,
            task_type=self._classify_task(task),
            **kwargs,
        )

    def _determine_agent(self, task: str) -> str:
        task_lower = task.lower()

        code_keywords = ["code", "program", "function", "algorithm", "debug", "refactor", "script"]
        research_keywords = ["research", "search", "find", "investigate", "analyze", "study"]
        vision_keywords = ["image", "photo", "picture", "visual", "see", "look", "chart", "diagram"]
        chat_keywords = ["hello", "hi", "how", "what", "who", "where", "why", "tell", "think", "opinion"]

        if any(kw in task_lower for kw in code_keywords):
            if any(kw in task_lower for kw in research_keywords):
                return "research"
            return "coding"
        if any(kw in task_lower for kw in vision_keywords):
            return "vision"
        if any(kw in task_lower for kw in research_keywords):
            return "research"
        return "chat"

    def _classify_task(self, task: str) -> str:
        task_lower = task.lower()
        if any(kw in task_lower for kw in ["generate", "write", "create", "implement"]):
            return "generation"
        if any(kw in task_lower for kw in ["debug", "fix", "error", "bug"]):
            return "debugging"
        if any(kw in task_lower for kw in ["explain", "what is", "describe"]):
            return "explanation"
        return "general"

    async def execute_chain(self, steps: List[Dict[str, Any]]) -> List[Any]:
        results = []
        context = {}
        for step in steps:
            agent_id = step.get("agent")
            input_data = step.get("input")
            use_context = step.get("use_context", False)

            if use_context:
                input_data = self._inject_context(input_data, context)

            agent = self.get_agent(agent_id)
            result = await agent.process(input_data, **step.get("kwargs", {}))
            results.append(result)

            if step.get("save_as"):
                context[step["save_as"]] = result

        return results

    async def parallel_execute(self, tasks: List[Dict[str, Any]]) -> List[Any]:
        async def run_single(task: Dict[str, Any]) -> Any:
            agent_id = task.get("agent")
            input_data = task.get("input")
            agent = self.get_agent(agent_id)
            return await agent.process(input_data, **task.get("kwargs", {}))

        return await asyncio.gather(*[run_single(t) for t in tasks])

    def _inject_context(self, template: Any, context: Dict[str, Any]) -> Any:
        if isinstance(template, str):
            return template.format(**context)
        elif isinstance(template, dict):
            return {k: self._inject_context(v, context) for k, v in template.items()}
        elif isinstance(template, list):
            return [self._inject_context(item, context) for item in template]
        return template

    def unregister_agent(self, agent_id: str):
        if agent_id in self._registry:
            del self._registry[agent_id]
            del self._agent_configs[agent_id]
