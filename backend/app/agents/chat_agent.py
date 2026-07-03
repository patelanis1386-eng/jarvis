import json
import re
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.agents.base import BaseAgent
from app.services.memory_service import MemoryService


CHAT_SYSTEM_PROMPT = """You are JARVIS X, an advanced AI assistant. You are helpful, harmless, and honest.

Your capabilities:
- Natural conversation with context awareness
- Web search and information retrieval
- Code generation and analysis
- Mathematical calculations
- File operations
- Memory and personalization
- Plugin integration for external services

Guidelines:
- Be concise but thorough
- Use markdown formatting when helpful
- Admit when you don't know something
- Ask clarifying questions when needed
- Remember user preferences and past conversations
- Use tools when appropriate (web search, calculator, etc.)
"""

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Perform mathematical calculations",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression to evaluate"},
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "execute_code",
            "description": "Execute Python code in a sandbox",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code to execute"},
                },
                "required": ["code"],
            },
        },
    },
]


class ChatAgent(BaseAgent):
    name = "chat_agent"
    description = "Natural conversation and general assistance"
    capabilities = ["conversation", "web_search", "calculation", "code_execution"]

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        openai_client=None,
        model: str = "gpt-4o",
        memory_service: Optional[MemoryService] = None,
    ):
        super().__init__(config)
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model
        self.memory_service = memory_service
        self.system_prompt = config.get("system_prompt", CHAT_SYSTEM_PROMPT) if config else CHAT_SYSTEM_PROMPT
        self.max_history = config.get("max_history", 50) if config else 50

    async def process(self, input_data: Any, **kwargs) -> Any:
        user_message = input_data if isinstance(input_data, str) else str(input_data)
        conversation_id = kwargs.get("conversation_id")
        user_id = kwargs.get("user_id")

        messages = await self._build_messages(
            user_message, user_id=user_id, conversation_id=conversation_id
        )

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=4096,
        )

        message = response.choices[0].message

        if message.tool_calls:
            return await self._handle_tool_calls(
                message.tool_calls, user_message, user_id
            )

        content = message.content or ""
        self.add_to_history("user", user_message)
        self.add_to_history("assistant", content)

        if user_id and self.memory_service and len(user_message) > 20:
            await self._store_conversation_memory(user_id, user_message, content)

        return content

    async def stream(self, input_data: Any, **kwargs) -> AsyncGenerator[str, None]:
        user_message = input_data if isinstance(input_data, str) else str(input_data)
        user_id = kwargs.get("user_id")

        messages = await self._build_messages(user_message, user_id=user_id)

        stream = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
            stream=True,
        )

        full_response = []
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                delta = chunk.choices[0].delta.content
                full_response.append(delta)
                yield delta

        self.add_to_history("user", user_message)
        self.add_to_history("assistant", "".join(full_response))

    async def _build_messages(
        self, user_message: str, user_id: Optional[str] = None,
        conversation_id: Optional[str] = None
    ) -> List[Dict[str, str]]:
        messages = [{"role": "system", "content": self.system_prompt}]

        relevant_memory = ""
        if user_id and self.memory_service:
            try:
                memories = await self.memory_service.search_memories(
                    user_id, user_message, limit=5
                )
                if memories:
                    relevant_memories = "\n".join(
                        f"- {m['content']}" for m in memories
                    )
                    relevant_memory = f"\nRelevant context from memory:\n{relevant_memories}"
            except Exception:
                pass

        if relevant_memory:
            messages.append({
                "role": "system",
                "content": f"Here is relevant information about the user:\n{relevant_memory}",
            })

        history = self.get_recent_history(self.max_history)
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": user_message})
        return messages

    async def _handle_tool_calls(
        self, tool_calls: List[Any], user_message: str, user_id: Optional[str]
    ) -> str:
        results = []
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            if function_name == "web_search":
                result = await self._web_search(arguments["query"])
            elif function_name == "calculator":
                result = self._calculate(arguments["expression"])
            elif function_name == "execute_code":
                result = await self._execute_code(arguments["code"])
            else:
                result = f"Unknown tool: {function_name}"

            results.append({"tool": function_name, "result": result})

        messages = await self._build_messages(user_message, user_id=user_id)
        messages.append({
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ],
        })

        for tc, r in zip(tool_calls, results):
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(r["result"]),
            })

        final_response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
        )
        return final_response.choices[0].message.content or ""

    async def _web_search(self, query: str) -> Dict[str, Any]:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json"},
                    timeout=10,
                )
                data = resp.json()
                return {
                    "results": [
                        {"title": r.get("title", ""), "snippet": r.get("snippet", "")}
                        for r in data.get("results", [])[:5]
                    ]
                }
        except Exception as e:
            return {"error": str(e), "results": []}

    def _calculate(self, expression: str) -> Dict[str, Any]:
        try:
            allowed_names = {
                k: v for k, v in math.__dict__.items() if not k.startswith("__")
            }
            allowed_names.update({"abs": abs, "round": round, "min": min, "max": max})
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return {"expression": expression, "result": result}
        except Exception as e:
            return {"expression": expression, "error": str(e)}

    async def _execute_code(self, code: str) -> Dict[str, Any]:
        try:
            import ast
            tree = ast.parse(code)
            allowed_nodes = {
                ast.Expr, ast.Assign, ast.Name, ast.Constant, ast.BinOp,
                ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Call, ast.Attribute,
                ast.List, ast.Dict, ast.Tuple, ast.FunctionDef, ast.Return,
                ast.If, ast.Compare, ast.For, ast.While, ast.Break, ast.Continue,
                ast.Pass, ast.Import, ast.ImportFrom, ast.alias, ast.Module,
                ast.Load, ast.Store, ast.Num, ast.Str, ast.UnaryOp, ast.USub,
                ast.Eq, ast.NotEq, ast.Lt, ast.Gt, ast.LtE, ast.GtE, ast.Is,
                ast.And, ast.Or, ast.Not, ast.Subscript, ast.Slice, ast.Starred,
            }

            for node in ast.walk(tree):
                if type(node) not in allowed_nodes:
                    raise ValueError(f"Code contains disallowed construct: {type(node).__name__}")

            local_scope = {}
            exec(code, {"__builtins__": {}}, local_scope)
            return {"output": str(local_scope.get("result", "Code executed successfully"))}
        except Exception as e:
            return {"error": str(e)}

    async def _store_conversation_memory(self, user_id: str, user_message: str, response: str):
        try:
            await self.memory_service.store_memory(
                user_id=user_id,
                content=f"User said: {user_message[:200]}",
                memory_type="short_term",
                importance=0.5,
                source="conversation",
            )
            await self.memory_service.store_memory(
                user_id=user_id,
                content=f"Assistant responded about: {response[:200]}",
                memory_type="short_term",
                importance=0.3,
                source="conversation",
            )
        except Exception:
            pass


import math
