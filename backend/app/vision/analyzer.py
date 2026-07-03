import base64
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles
from openai import AsyncOpenAI


class VisionAnalyzer:
    def __init__(
        self,
        openai_client: Optional[AsyncOpenAI] = None,
        model: str = "gpt-4o",
        temp_dir: str = "tmp/vision",
    ):
        self.openai_client = openai_client or AsyncOpenAI()
        self.model = model
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def _encode_image(self, image_bytes: bytes) -> str:
        return base64.b64encode(image_bytes).decode("utf-8")

    def _build_vision_message(self, prompt: str, image_bytes: bytes, detail: str = "auto") -> List[dict]:
        b64 = self._encode_image(image_bytes)
        return [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": detail},
            },
        ]

    async def _call_vision(
        self, prompt: str, image_bytes: bytes, detail: str = "auto",
        system_prompt: Optional[str] = None, response_json: bool = False
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({
            "role": "user",
            "content": self._build_vision_message(prompt, image_bytes, detail),
        })

        kwargs = {"model": self.model, "messages": messages, "max_tokens": 2048}
        if response_json:
            kwargs["response_format"] = {"type": "json_object"}

        response = await self.openai_client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    async def analyze_image(self, image_bytes: bytes, detail: str = "auto") -> str:
        return await self._call_vision(
            "Describe this image in detail. Include: main subjects, colors, composition, text visible, setting, mood, and any notable details.",
            image_bytes, detail,
            system_prompt="You are a detailed image analyst. Provide comprehensive descriptions.",
        )

    async def extract_text(self, image_bytes: bytes) -> str:
        return await self._call_vision(
            "Extract all text from this image. Preserve the original formatting, layout, and structure. Return only the extracted text.",
            image_bytes,
            system_prompt="You are an OCR engine. Extract text accurately.",
        )

    async def detect_objects(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        result = await self._call_vision(
            "List all objects detected in this image. Return a JSON array with: name, confidence (0-1), bounding_box_description, count.",
            image_bytes, response_json=True,
        )
        try:
            parsed = json.loads(result)
            if isinstance(parsed, list):
                return parsed
            return parsed.get("objects", parsed.get("detections", []))
        except json.JSONDecodeError:
            return [{"name": "unknown", "confidence": 0.5}]

    async def analyze_chart(self, image_bytes: bytes) -> Dict[str, Any]:
        result = await self._call_vision(
            "Analyze this chart or graph. Return JSON with: chart_type, title, x_axis, y_axis, data_points (array of {label, value}), trends, key_insights, anomalies.",
            image_bytes, response_json=True,
        )
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"chart_type": "unknown", "error": "Could not parse chart analysis"}

    async def analyze_face(self, image_bytes: bytes) -> Dict[str, Any]:
        result = await self._call_vision(
            "Analyze the face(s) in this image. Return JSON with: face_count, emotions (array with confidence), age_range, gender (if discernible), notable_features, confidence. If no face, set face_count to 0.",
            image_bytes, response_json=True,
        )
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"face_count": 0}

    async def analyze_document(self, image_bytes: bytes) -> Dict[str, Any]:
        result = await self._call_vision(
            "Analyze this document image. Return JSON with: document_type, language, page_count (estimated), sections, key_content (title, headings, key paragraphs), formatting_notes.",
            image_bytes, response_json=True,
        )
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"document_type": "unknown", "key_content": result}
