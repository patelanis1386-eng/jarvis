import json
import re
from typing import Any, Dict, List, Optional

class CodingError(Exception):
    pass


CODING_SYSTEM_PROMPTS = {
    "analyze": "You are an expert code analyzer. Analyze the given code for bugs, security issues, performance problems, and code quality. Provide specific line numbers and recommendations.",
    "generate": "You are an expert software engineer. Generate clean, production-ready code following best practices. Include type hints, error handling, and documentation. Only return the code, no explanations.",
    "review": "You are an expert code reviewer. Review the code for: correctness, security vulnerabilities, performance issues, style consistency, test coverage. Provide actionable feedback with priority levels.",
    "explain": "You are an expert programming teacher. Explain the given code in detail. Cover: purpose, flow, key concepts, potential pitfalls. Use simple language with examples.",
    "debug": "You are an expert debugger. Given the code and error, identify the root cause and provide a fix. Show the fix with context. Explain why the error occurred.",
    "refactor": "You are an expert software architect. Refactor the code to improve: readability, maintainability, performance, testability. Explain each change and its benefit.",
}


class CodingService:
    def __init__(
        self,
        openai_client=None,
        model: str = "gpt-4o",
    ):
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model

    async def analyze_code(
        self,
        code: str,
        language: str = "python",
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        response = await self._call_ai(
            "analyze",
            f"Language: {language}\n\nCode:\n```{language}\n{code}\n```\n\nContext: {context or 'N/A'}\n\nProvide a JSON analysis with: issues (array of {severity, line, message, suggestion}), metrics (complexity, length, dependencies), summary.",
            response_format={"type": "json_object"},
        )
        return self._parse_json_response(response)

    async def generate_code(
        self,
        prompt: str,
        language: str = "python",
        framework: Optional[str] = None,
        include_tests: bool = False,
    ) -> str:
        system_prompt = CODING_SYSTEM_PROMPTS["generate"]
        full_prompt = f"Generate {language} code for:\n{prompt}\n"
        if framework:
            full_prompt += f"\nFramework: {framework}"
        if include_tests:
            full_prompt += "\n\nAlso include unit tests."

        response = await self._call_ai("generate", full_prompt)
        return self._extract_code_blocks(response) or response

    async def review_code(
        self,
        code: str,
        language: str = "python",
        strictness: str = "medium",
    ) -> Dict[str, Any]:
        response = await self._call_ai(
            "review",
            f"Language: {language}\nStrictness: {strictness}\n\nCode to review:\n```{language}\n{code}\n```\n\nReturn JSON with: summary (overall assessment), critical_issues, warnings, suggestions, score (0-100), approved (boolean).",
            response_format={"type": "json_object"},
        )
        return self._parse_json_response(response)

    async def explain_code(
        self, code: str, language: str = "python", detail_level: str = "detailed"
    ) -> str:
        response = await self._call_ai(
            "explain",
            f"Language: {language}\nDetail level: {detail_level}\n\nCode:\n```{language}\n{code}\n```",
        )
        return response

    async def debug_code(
        self,
        code: str,
        error_message: Optional[str] = None,
        language: str = "python",
    ) -> Dict[str, Any]:
        response = await self._call_ai(
            "debug",
            f"Language: {language}\n\nCode:\n```{language}\n{code}\n```\n\nError: {error_message or 'No error message provided - find and fix all bugs'}\n\nReturn JSON with: root_cause, fix (with code), explanation, prevention_tips.",
            response_format={"type": "json_object"},
        )
        return self._parse_json_response(response)

    async def refactor_code(
        self,
        code: str,
        language: str = "python",
        goals: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        goals_str = ", ".join(goals or ["readability", "maintainability"])
        response = await self._call_ai(
            "refactor",
            f"Language: {language}\nGoals: {goals_str}\n\nOriginal code:\n```{language}\n{code}\n```\n\nReturn JSON with: refactored_code, changes (array of {what, why, impact}), improvements_summary.",
            response_format={"type": "json_object"},
        )
        return self._parse_json_response(response)

    async def _call_ai(
        self,
        task_type: str,
        prompt: str,
        response_format: Optional[Dict] = None,
    ) -> str:
        messages = [
            {"role": "system", "content": CODING_SYSTEM_PROMPTS.get(task_type, CODING_SYSTEM_PROMPTS["analyze"])},
            {"role": "user", "content": prompt},
        ]
        kwargs = {"model": self.model, "messages": messages, "temperature": 0.3}
        if response_format:
            kwargs["response_format"] = response_format

        try:
            response = await self.openai_client.chat.completions.create(**kwargs)
            return response.choices[0].message.content or ""
        except Exception as e:
            raise CodingError(f"AI call failed: {str(e)}")

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        try:
            cleaned = response.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"raw_response": response, "note": "Could not parse as JSON"}

    def _extract_code_blocks(self, text: str) -> Optional[str]:
        pattern = r"```(?:\w+)?\n(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            return "\n\n".join(m.strip() for m in matches)
        return None
