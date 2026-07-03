import os
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

import aiofiles
from openai import AsyncOpenAI


class TranscriberError(Exception):
    pass


SUPPORTED_FORMATS = {
    "audio/flac": ".flac",
    "audio/m4a": ".m4a",
    "audio/mp3": ".mp3",
    "audio/mp4": ".mp4",
    "audio/mpeg": ".mpeg",
    "audio/mpga": ".mpga",
    "audio/oga": ".oga",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
}


class VoiceTranscriber:
    def __init__(
        self,
        openai_client: Optional[AsyncOpenAI] = None,
        model: str = "whisper-1",
        temp_dir: str = "tmp/audio",
    ):
        self.openai_client = openai_client or AsyncOpenAI()
        self.model = model
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        response_format: str = "text",
    ) -> str:
        file_path = self.temp_dir / f"{uuid4()}_{filename}"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(audio_data)

        try:
            with open(file_path, "rb") as audio_file:
                transcript = await self.openai_client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language=language,
                    prompt=prompt,
                    response_format=response_format,
                )

            if response_format == "text":
                return transcript
            elif response_format == "verbose_json":
                return transcript.text
            elif response_format == "json":
                return transcript.text if hasattr(transcript, "text") else str(transcript)
            return str(transcript)

        except Exception as e:
            raise TranscriberError(f"Transcription failed: {str(e)}")
        finally:
            if file_path.exists():
                file_path.unlink()

    async def transcribe_file(self, file_path: str, language: Optional[str] = None) -> str:
        if not os.path.exists(file_path):
            raise TranscriberError(f"Audio file not found: {file_path}")

        try:
            with open(file_path, "rb") as audio_file:
                transcript = await self.openai_client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language=language,
                    response_format="text",
                )
            return transcript
        except Exception as e:
            raise TranscriberError(f"File transcription failed: {str(e)}")

    async def transcribe_with_timestamps(
        self, audio_data: bytes, filename: str = "audio.webm", language: Optional[str] = None
    ) -> dict:
        file_path = self.temp_dir / f"{uuid4()}_{filename}"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(audio_data)

        try:
            with open(file_path, "rb") as audio_file:
                result = await self.openai_client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                )
            return {
                "text": result.text,
                "segments": [
                    {
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                        "text": seg.get("text", ""),
                        "confidence": seg.get("confidence", 0),
                    }
                    for seg in (result.segments if hasattr(result, "segments") else [])
                ],
                "language": result.language if hasattr(result, "language") else language,
            }
        except Exception as e:
            raise TranscriberError(f"Timestamped transcription failed: {str(e)}")
        finally:
            if file_path.exists():
                file_path.unlink()

    async def translate(self, audio_data: bytes, filename: str = "audio.webm") -> str:
        file_path = self.temp_dir / f"{uuid4()}_{filename}"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(audio_data)

        try:
            with open(file_path, "rb") as audio_file:
                translation = await self.openai_client.audio.translations.create(
                    model=self.model,
                    file=audio_file,
                    response_format="text",
                )
            return translation
        except Exception as e:
            raise TranscriberError(f"Translation failed: {str(e)}")
        finally:
            if file_path.exists():
                file_path.unlink()

    def get_supported_formats(self) -> dict:
        return {
            "formats": list(SUPPORTED_FORMATS.keys()),
            "extensions": list(SUPPORTED_FORMATS.values()),
            "max_file_size_mb": 25,
            "model": self.model,
        }
