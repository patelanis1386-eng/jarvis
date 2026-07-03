import asyncio
import base64
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import aiofiles


class VisionError(Exception):
    pass


class VisionService:
    def __init__(
        self,
        openai_client=None,
        model: str = "gpt-4o",
        upload_dir: str = "uploads/vision",
    ):
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model
        self.upload_dir = upload_dir
        self._ensure_upload_dir()

    def _ensure_upload_dir(self):
        os.makedirs(self.upload_dir, exist_ok=True)

    def _encode_image(self, image_data: bytes) -> str:
        return base64.b64encode(image_data).decode("utf-8")

    def _build_image_message(self, image_data: bytes, detail: str = "auto") -> List[dict]:
        b64 = self._encode_image(image_data)
        return [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{b64}",
                    "detail": detail,
                },
            }
        ]

    async def analyze_image(
        self, image_data: bytes, prompt: str = "Describe this image in detail.",
        detail: str = "auto"
    ) -> str:
        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            *self._build_image_message(image_data, detail),
                        ],
                    }
                ],
                max_tokens=1024,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise VisionError(f"Image analysis failed: {str(e)}")

    async def ocr_from_image(self, image_data: bytes) -> str:
        return await self.analyze_image(
            image_data,
            prompt="Extract all text from this image. Return only the extracted text, preserving formatting as much as possible.",
        )

    async def detect_objects(self, image_data: bytes) -> List[Dict[str, Any]]:
        result = await self.analyze_image(
            image_data,
            prompt="List all objects visible in this image. Return as a JSON array of objects with 'label' (object name), 'confidence' (estimated 0-1), and 'bounding_box' (approximate location description).",
        )
        try:
            cleaned = result.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, AttributeError):
            return [{"label": "unknown", "confidence": 0.5, "bounding_box": "full image"}]

    async def analyze_video(
        self,
        video_data: bytes,
        filename: str = "video.mp4",
        frame_interval: float = 2.0,
        prompt: str = "Describe what is happening in this video frame.",
    ) -> List[Dict[str, Any]]:
        file_path = os.path.join(self.upload_dir, f"{uuid4()}_{filename}")
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(video_data)

        try:
            import ffmpeg

            probe = ffmpeg.probe(file_path)
            duration = float(probe["format"]["duration"])
            width = int(probe["streams"][0]["width"])
            height = int(probe["streams"][0]["height"])

            frames = []
            current_time = 0.0
            while current_time < duration:
                frame_path = os.path.join(
                    self.upload_dir, f"frame_{uuid4()}.jpg"
                )
                (
                    ffmpeg.input(file_path, ss=current_time)
                    .output(frame_path, vframes=1, format="image2")
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )

                async with aiofiles.open(frame_path, "rb") as f:
                    frame_data = await f.read()

                analysis = await self.analyze_image(
                    frame_data,
                    prompt=f"[Frame at {current_time:.1f}s] {prompt}",
                )
                frames.append({
                    "timestamp": current_time,
                    "analysis": analysis,
                })
                os.remove(frame_path)
                current_time += frame_interval

            return {
                "duration": duration,
                "resolution": {"width": width, "height": height},
                "total_frames": len(frames),
                "frames": frames,
            }
        except ImportError:
            return await self._simulate_video_analysis(filename)
        except Exception as e:
            raise VisionError(f"Video analysis failed: {str(e)}")
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    async def _simulate_video_analysis(self, filename: str) -> List[Dict[str, Any]]:
        return {
            "duration": 0,
            "resolution": {"width": 0, "height": 0},
            "total_frames": 0,
            "frames": [],
            "note": "ffmpeg not available; video analysis requires ffmpeg-python",
        }

    async def analyze_chart(self, image_data: bytes) -> Dict[str, Any]:
        result = await self.analyze_image(
            image_data,
            prompt="Analyze this chart/graph. Return JSON with: chart_type (bar, line, pie, etc.), title, axes labels, data trends, key insights.",
        )
        try:
            cleaned = result.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, AttributeError):
            return {"chart_type": "unknown", "title": "", "insights": result}

    async def analyze_face(self, image_data: bytes) -> Dict[str, Any]:
        result = await self.analyze_image(
            image_data,
            prompt="Analyze the face(s) in this image. Return JSON with: number_of_faces, emotions (happy, sad, neutral, etc.), estimated_age_range, gender, any notable features. If no face is detected, return null.",
        )
        try:
            cleaned = result.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, AttributeError):
            return {"number_of_faces": 0, "note": "Face analysis result could not be parsed"}
