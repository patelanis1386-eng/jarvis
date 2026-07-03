import base64
import io
import os
from pathlib import Path
from typing import AsyncGenerator, List, Optional
from uuid import uuid4

import aiofiles


class VoiceError(Exception):
    pass


class VoiceService:
    def __init__(
        self,
        openai_client=None,
        tts_provider: str = "openai",
        whisper_model: str = "whisper-1",
        tts_model: str = "tts-1",
        tts_voice: str = "alloy",
        upload_dir: str = "uploads/audio",
    ):
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.tts_provider = tts_provider
        self.whisper_model = whisper_model
        self.tts_model = tts_model
        self.tts_voice = tts_voice
        self.upload_dir = upload_dir
        self._ensure_upload_dir()

    def _ensure_upload_dir(self):
        os.makedirs(self.upload_dir, exist_ok=True)

    async def transcribe_audio(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        language: Optional[str] = None,
        prompt: Optional[str] = None,
    ) -> str:
        file_path = os.path.join(self.upload_dir, f"{uuid4()}_{filename}")
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(audio_data)

        try:
            with open(file_path, "rb") as audio_file:
                transcript = await self.openai_client.audio.transcriptions.create(
                    model=self.whisper_model,
                    file=audio_file,
                    language=language,
                    prompt=prompt,
                    response_format="text",
                )
            return transcript
        except Exception as e:
            raise VoiceError(f"Transcription failed: {str(e)}")
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    async def transcribe_audio_file(self, file_path: str, language: Optional[str] = None) -> str:
        if not os.path.exists(file_path):
            raise VoiceError(f"Audio file not found: {file_path}")

        try:
            with open(file_path, "rb") as audio_file:
                transcript = await self.openai_client.audio.transcriptions.create(
                    model=self.whisper_model,
                    file=audio_file,
                    language=language,
                    response_format="text",
                )
            return transcript
        except Exception as e:
            raise VoiceError(f"Transcription failed: {str(e)}")

    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0,
        format: str = "mp3",
    ) -> bytes:
        voice = voice or self.tts_voice
        try:
            response = await self.openai_client.audio.speech.create(
                model=self.tts_model,
                voice=voice,
                input=text,
                speed=speed,
                response_format=format,
            )
            return response.content
        except Exception as e:
            raise VoiceError(f"Speech synthesis failed: {str(e)}")

    async def list_voices(self) -> List[dict]:
        return [
            {"id": "alloy", "name": "Alloy", "gender": "neutral", "provider": "openai"},
            {"id": "echo", "name": "Echo", "gender": "neutral", "provider": "openai"},
            {"id": "fable", "name": "Fable", "gender": "neutral", "provider": "openai"},
            {"id": "onyx", "name": "Onyx", "gender": "male", "provider": "openai"},
            {"id": "nova", "name": "Nova", "gender": "female", "provider": "openai"},
            {"id": "shimmer", "name": "Shimmer", "gender": "female", "provider": "openai"},
        ]

    async def stream_audio(
        self, text: str, voice: Optional[str] = None, speed: float = 1.0
    ) -> AsyncGenerator[bytes, None]:
        voice = voice or self.tts_voice
        try:
            response = await self.openai_client.audio.speech.create(
                model=self.tts_model,
                voice=voice,
                input=text,
                speed=speed,
                response_format="opus",
            )
            chunk_size = 4096
            content = response.content
            for i in range(0, len(content), chunk_size):
                yield content[i : i + chunk_size]
        except Exception as e:
            raise VoiceError(f"Audio streaming failed: {str(e)}")

    async def get_supported_formats(self) -> List[str]:
        return ["mp3", "opus", "aac", "flac", "wav", "pcm"]
