from __future__ import annotations

import asyncio
import json
import random
import re
from typing import Any, AsyncGenerator, Dict, List, Optional

MOCK_RESPONSES = {
    "default": "I'm JARVIS, your AI operating system. I'm currently running in offline/mock mode without an API key configured. I can demonstrate the interface and respond with canned responses. To enable full AI capabilities, set your OPENAI_API_KEY in the .env file.\n\nHere's what I can do:\n- **Chat** with natural conversation\n- **Voice** recognition and synthesis\n- **Vision** analysis (image understanding)\n- **Research** with web search\n- **Code** analysis and generation\n- **Automate** workflows\n- **Remember** context and preferences\n\nHow can I assist you today?",
    "hello": "Hello! I'm JARVIS X, your AI operating system. How can I assist you today? I'm currently in demonstration mode, but all features are available for testing.",
    "help": "I'm JARVIS X, your AI operating system. Here's what I can help you with:\n\n1. **Chat** - Natural conversation and task assistance\n2. **Voice** - Speech recognition and synthesis\n3. **Vision** - Image analysis and OCR\n4. **Research** - Deep research with web search\n5. **Code** - Code analysis, generation, and review\n6. **Automation** - Automated workflows\n7. **Memory** - Context-aware assistance\n\nI'm currently in **mock mode** since no API key is configured. Set OPENAI_API_KEY in .env for full AI capabilities.",
    "who are you": "I am JARVIS X — Just A Rather Very Intelligent System, version 1.0.0. I'm a full-stack AI operating system designed to assist with conversation, research, coding, automation, and more. I'm currently operating in demonstration mode.",
    "what can you do": "I can assist with:\n- **Conversation** - Natural language chat with context awareness\n- **Coding** - Generate, review, debug, and explain code in any language\n- **Research** - Deep research with web search and source verification\n- **Vision** - Analyze images, extract text (OCR), detect objects\n- **Voice** - Speech recognition and text-to-speech\n- **Automation** - Create automated workflows\n- **Knowledge** - Build and query knowledge graphs\n\nI'm in mock mode currently. Add an API key for full functionality.",
}


def _get_mock_response(content: str) -> str:
    content_lower = content.lower().strip()
    for key, response in MOCK_RESPONSES.items():
        if key in content_lower or content_lower.startswith(key):
            return response
    return MOCK_RESPONSES["default"]


class MockOpenAIClient:
    """Drop-in mock for AsyncOpenAI that works without any API key."""

    class ChatCompletions:
        class Completion:
            def __init__(self, content: str):
                self.content = content

        class Choice:
            def __init__(self, content: str):
                self.delta = MockOpenAIClient.Completion(content)
                self.message = MockOpenAIClient.Completion(content)

        class Usage:
            prompt_tokens = 50
            completion_tokens = 100
            total_tokens = 150

        def __init__(self):
            self.usage = MockOpenAIClient.Usage()

        async def create(self, *args, **kwargs):
            messages = kwargs.get("messages", [])
            user_message = ""
            for msg in messages:
                if msg.get("role") == "user":
                    content = msg.get("content", "")
                    if isinstance(content, list):
                        for part in content:
                            if isinstance(part, dict) and part.get("type") == "text":
                                user_message = part.get("text", "")
                    else:
                        user_message = content

            response_text = _get_mock_response(user_message)

            response_format = kwargs.get("response_format")
            if response_format and response_format.get("type") == "json_object":
                try:
                    return self._make_json_response(user_message, response_text)
                except Exception:
                    pass

            return self._make_response(response_text)

        async def _stream_create(self, *args, **kwargs):
            messages = kwargs.get("messages", [])
            user_message = ""
            for msg in messages:
                if msg.get("role") == "user":
                    content = msg.get("content", "")
                    if isinstance(content, list):
                        for part in content:
                            if isinstance(part, dict) and part.get("type") == "text":
                                user_message = part.get("text", "")
                    else:
                        user_message = content

            response_text = _get_mock_response(user_message)
            words = response_text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield self._make_chunk(chunk)
                await asyncio.sleep(0.02)
            yield self._make_chunk(None, finish_stop="stop")

        def _make_response(self, content: str):
            class Response:
                choices = [MockOpenAIClient.Choice(content)]
                usage = MockOpenAIClient.Usage()
            return Response()

        def _make_json_response(self, user_message: str, response_text: str):
            class Response:
                choices = [
                    MockOpenAIClient.Choice(
                        json.dumps({"message": response_text, "findings": [{"claim": "Mock response", "confidence": 0.5}]})
                    )
                ]
                usage = MockOpenAIClient.Usage()
            return Response()

        def _make_chunk(self, content: Optional[str], finish_stop: Optional[str] = None):
            class Delta:
                content = content
                role = "assistant"

            class Choice:
                delta = Delta()
                finish_reason = finish_stop
                index = 0

            class Chunk:
                choices = [Choice()]
                id = "mock_chunk"
                object = "chat.completion.chunk"
                created = 0
                model = "mock-model"

            return Chunk()

    class Audio:
        async def transcriptions(self, *args, **kwargs):
            class Transcription:
                text = "This is a mock transcription. No audio was actually processed because no API key is configured."
            return Transcription()

        async def speech(self, *args, **kwargs):
            return b"mock_audio_data"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.chat = self.ChatCompletions()
        self.audio = self.Audio()

    class ChatCompletions:
        pass

    class Audio:
        pass


MockOpenAIClient.ChatCompletions = MockOpenAIClient.ChatCompletions
MockOpenAIClient.Audio = MockOpenAIClient.Audio
