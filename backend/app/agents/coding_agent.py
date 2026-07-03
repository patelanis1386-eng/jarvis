import json
import re
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent


CODING_SYSTEM_PROMPT = """You are an expert software engineer and coding agent. You write clean, production-ready code.

Your capabilities:
- Code generation in any language
- Code review and analysis
- Debugging and bug fixing
- Code refactoring and optimization
- Writing unit tests
- Documentation generation
- Architecture design

Guidelines:
- Follow language-specific best practices and conventions
- Include type hints (for typed languages)
- Write comprehensive error handling
- Optimize for readability and maintainability
- Consider edge cases
- Follow SOLID principles
- Include docstrings and comments for complex logic
- Suggest tests when appropriate
"""

LANGUAGE_EXTENSIONS = {
    "python": ".py", "javascript": ".js", "typescript": ".ts",
    "java": ".java", "go": ".go", "rust": ".rs",
    "cpp": ".cpp", "c": ".c", "ruby": ".rb",
    "php": ".php", "swift": ".swift", "kotlin": ".kt",
}


class CodingAgent(BaseAgent):
    name = "coding_agent"
    description = "Code generation, analysis, and debugging"
    capabilities = [
        "code_generation", "code_review", "debugging",
        "refactoring", "testing", "documentation"
    ]

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        openai_client=None,
        model: str = "gpt-4o",
    ):
        super().__init__(config)
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model
        self.system_prompt = config.get("system_prompt", CODING_SYSTEM_PROMPT) if config else CODING_SYSTEM_PROMPT

    async def process(self, input_data: Any, **kwargs) -> Any:
        task = input_data if isinstance(input_data, str) else str(input_data)
        task_type = kwargs.get("task_type", "generate")

        language = kwargs.get("language", self._detect_language(task))
        context = kwargs.get("context")
        file_path = kwargs.get("file_path")

        if file_path:
            existing_code = await self._read_file(file_path)
            context = context or existing_code

        handlers = {
            "generate": self._generate,
            "review": self._review,
            "debug": self._debug,
            "explain": self._explain,
            "refactor": self._refactor,
            "test": self._generate_tests,
        }

        handler = handlers.get(task_type, self._generate)
        result = await handler(task, language, context)

        self.add_to_history("user", f"[{task_type}] {task[:100]}...")
        self.add_to_history("assistant", str(result)[:200])
        return result

    async def _generate(self, task: str, language: str, context: Optional[str]) -> str:
        messages = [
            {
                "role": "system",
                "content": f"{self.system_prompt}\nGenerate {language} code only. Return the code in a code block.",
            },
        ]
        if context:
            messages.append({
                "role": "system",
                "content": f"Context/Existing code:\n```{language}\n{context}\n```",
            })
        messages.append({"role": "user", "content": task})

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
        )
        content = response.choices[0].message.content or ""
        return self._extract_code(content) or content

    async def _review(self, task: str, language: str, context: Optional[str]) -> Dict[str, Any]:
        code = context or task
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code reviewer. Review the code for bugs, security issues, performance problems, style issues, and test coverage. Return JSON with: summary, issues (array of {severity, line, message, suggestion}), score (0-100), approved (boolean).",
                },
                {"role": "user", "content": f"Language: {language}\n\nCode:\n```{language}\n{code}\n```"},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content or "{}")

    async def _debug(self, task: str, language: str, context: Optional[str]) -> Dict[str, Any]:
        code = context or task
        error_info = ""
        if "error" in task.lower() or "exception" in task.lower():
            error_info = task

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert debugger. Find and fix bugs. Return JSON with: root_cause, fix (code), explanation, prevention_tips, affected_lines.",
                },
                {
                    "role": "user",
                    "content": f"Language: {language}\nError: {error_info}\n\nCode:\n```{language}\n{code}\n```",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content or "{}")

    async def _explain(self, task: str, language: str, context: Optional[str]) -> str:
        code = context or task
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert programming teacher. Explain the code in detail: purpose, how it works, key concepts, potential improvements.",
                },
                {"role": "user", "content": f"Language: {language}\n\nCode:\n```{language}\n{code}\n```"},
            ],
            temperature=0.5,
        )
        return response.choices[0].message.content or ""

    async def _refactor(self, task: str, language: str, context: Optional[str]) -> Dict[str, Any]:
        code = context or task
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software architect. Refactor the code for better readability, maintainability, and performance. Return JSON with: refactored_code, changes (array of {what, why, impact}), improvements_summary.",
                },
                {"role": "user", "content": f"Language: {language}\n\nCode:\n```{language}\n{code}\n```"},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content or "{}")

    async def _generate_tests(self, task: str, language: str, context: Optional[str]) -> str:
        code = context or task
        test_framework = self._get_test_framework(language)
        messages = [
            {
                "role": "system",
                "content": f"Generate comprehensive unit tests using {test_framework}. Include test cases for: normal cases, edge cases, error cases. Return only the test code in a code block.",
            },
        ]
        if context:
            messages.append({
                "role": "system",
                "content": f"Code to test:\n```{language}\n{code}\n```",
            })
        messages.append({"role": "user", "content": f"Generate {test_framework} tests for this {language} code. Test requirements: {task}"})

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
        )
        content = response.choices[0].message.content or ""
        return self._extract_code(content) or content

    def _detect_language(self, text: str) -> str:
        code_block_pattern = r"```(\w+)"
        match = re.search(code_block_pattern, text)
        if match:
            lang = match.group(1).lower()
            if lang in LANGUAGE_EXTENSIONS:
                return lang

        for lang, ext in LANGUAGE_EXTENSIONS.items():
            if lang in text.lower():
                return lang
        return "python"

    def _get_test_framework(self, language: str) -> str:
        frameworks = {
            "python": "pytest",
            "javascript": "jest",
            "typescript": "jest",
            "java": "JUnit 5",
            "go": "testing",
            "rust": "cargo test",
            "ruby": "RSpec",
        }
        return frameworks.get(language, "pytest")

    def _extract_code(self, text: str) -> Optional[str]:
        pattern = r"```(?:\w+)?\n(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            return "\n\n".join(m.strip() for m in matches)
        return None

    async def _read_file(self, file_path: str) -> Optional[str]:
        try:
            import aiofiles
            async with aiofiles.open(file_path, "r") as f:
                return await f.read()
        except Exception:
            return None
