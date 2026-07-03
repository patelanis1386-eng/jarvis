import os
from pathlib import Path
from typing import AsyncGenerator, List, Optional
from uuid import uuid4

from openai import AsyncOpenAI


class SynthesizerError(Exception):
    pass


OPENAI_VOICES = [
    {"id": "alloy", "name": "Alloy", "description": "Neutral and balanced"},
    {"id": "echo", "name": "Echo", "description": "Warm and articulate"},
    {"id": "fable", "name": "Fable", "description": "British accent, narrative"},
    {"id": "onyx", "name": "Onyx", "description": "Deep, authoritative male voice"},
    {"id": "nova", "name": "Nova", "description": "Warm, female voice"},
    {"id": "shimmer", "name": "Shimmer", "description": "Expressive and clear"},
]


SUPPORTED_OUTPUT_FORMATS = {
    "mp3": "audio/mpeg",
    "opus": "audio/opus",
    "aac": "audio/aac",
    "flac": "audio/flac",
    "wav": "audio/wav",
    "pcm": "audio/pcm",
}


class VoiceSynthesizer:
    def __init__(
        self,
        openai_client: Optional[AsyncOpenAI] = None,
        model: str = "tts-1",
        default_voice: str = "alloy",
        temp_dir: str = "tmp/audio",
    ):
        self.openai_client = openai_client or AsyncOpenAI()
        self.model = model
        self.default_voice = default_voice
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0,
        output_format: str = "mp3",
    ) -> bytes:
        voice = voice or self.default_voice
        if voice not in [v["id"] for v in OPENAI_VOICES]:
            raise SynthesizerError(f"Invalid voice: {voice}")

        if output_format not in SUPPORTED_OUTPUT_FORMATS:
            raise SynthesizerError(f"Unsupported format: {output_format}")

        if speed < 0.25 or speed > 4.0:
            raise SynthesizerError("Speed must be between 0.25 and 4.0")

        try:
            response = await self.openai_client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=text,
                speed=speed,
                response_format=output_format,
            )
            return response.content
        except Exception as e:
            raise SynthesizerError(f"Speech synthesis failed: {str(e)}")

    async def synthesize_to_file(
        self,
        text: str,
        output_path: Optional[str] = None,
        voice: Optional[str] = None,
        speed: float = 1.0,
        output_format: str = "mp3",
    ) -> str:
        audio_bytes = await self.synthesize(text, voice, speed, output_format)
        file_path = output_path or str(self.temp_dir / f"tts_{uuid4()}.{output_format}")

        with open(file_path, "wb") as f:
            f.write(audio_bytes)

        return file_path

    def list_voices(self) -> List[dict]:
        return OPENAI_VOICES

    async def stream_audio(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0,
        chunk_size: int = 4096,
    ) -> AsyncGenerator[bytes, None]:
        voice = voice or self.default_voice
        try:
            response = await self.openai_client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=text,
                speed=speed,
                response_format="opus",
            )
            audio_content = response.content
            for i in range(0, len(audio_content), chunk_size):
                yield audio_content[i : i + chunk_size]
        except Exception as e:
            raise SynthesizerError(f"Audio streaming failed: {str(e)}")

    def get_supported_formats(self) -> dict:
        return {
            "voices": OPENAI_VOICES,
            "output_formats": list(SUPPORTED_OUTPUT_FORMATS.keys()),
            "models": ["tts-1", "tts-1-hd"],
            "speed_range": {"min": 0.25, "max": 4.0},
            "max_text_length": 4096,
        }
