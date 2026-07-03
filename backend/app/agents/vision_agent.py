import base64
import json
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent


VISION_SYSTEM_PROMPT = """You are a vision analysis agent. You can analyze images and visual data in detail.

Your capabilities:
- Describe images in detail
- Extract text from images (OCR)
- Detect and identify objects
- Analyze charts, graphs, and diagrams
- Recognize faces and emotions
- Analyze document layouts
- Identify colors, patterns, and textures

Guidelines:
- Be thorough and specific in descriptions
- Note when you are uncertain
- Distinguish between what you see and what you infer
- Provide structured analysis when requested
- Handle poor quality images gracefully
"""


class VisionAgent(BaseAgent):
    name = "vision_agent"
    description = "Image and visual content analysis"
    capabilities = [
        "image_description", "ocr", "object_detection",
        "chart_analysis", "face_analysis", "document_analysis"
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
        self.system_prompt = config.get("system_prompt", VISION_SYSTEM_PROMPT) if config else VISION_SYSTEM_PROMPT

    async def process(self, input_data: Any, **kwargs) -> Any:
        if isinstance(input_data, dict):
            image_data = input_data.get("image_data") or input_data.get("data")
            prompt = input_data.get("prompt", "Describe this image in detail.")
        else:
            image_data = input_data
            prompt = kwargs.get("prompt", "Describe this image in detail.")

        analysis_type = kwargs.get("analysis_type", "describe")
        detail = kwargs.get("detail", "auto")

        if not image_data:
            return {"error": "No image data provided"}

        if isinstance(image_data, str):
            try:
                image_bytes = base64.b64decode(image_data)
            except Exception:
                return {"error": "Invalid image data format"}
        elif isinstance(image_data, bytes):
            image_bytes = image_data
        else:
            return {"error": "Unsupported image data type"}

        handlers = {
            "describe": self._describe_image,
            "ocr": self._extract_text,
            "objects": self._detect_objects,
            "chart": self._analyze_chart,
            "face": self._analyze_face,
            "document": self._analyze_document,
        }

        handler = handlers.get(analysis_type, self._describe_image)
        result = await handler(image_bytes, prompt, detail)

        self.add_to_history("user", f"[{analysis_type}] {prompt[:100]}...")
        self.add_to_history("assistant", str(result)[:200])
        return result

    def _encode_image(self, image_bytes: bytes) -> str:
        return base64.b64encode(image_bytes).decode("utf-8")

    def _build_content(self, image_bytes: bytes, prompt: str, detail: str = "auto") -> List[dict]:
        b64 = self._encode_image(image_bytes)
        return [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{b64}",
                    "detail": detail,
                },
            },
        ]

    async def _call_vision(self, content: List[dict], system_prompt: Optional[str] = None, response_json: bool = False) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": content})

        kwargs = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 2048,
            "temperature": 0.3,
        }
        if response_json:
            kwargs["response_format"] = {"type": "json_object"}

        response = await self.openai_client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    async def _describe_image(self, image_bytes: bytes, prompt: str, detail: str) -> str:
        content = self._build_content(image_bytes, prompt, detail)
        return await self._call_vision(
            content,
            "You are a detailed image describer. Describe everything you see: objects, people, text, colors, lighting, composition, and notable details."
        )

    async def _extract_text(self, image_bytes: bytes, prompt: str, detail: str) -> str:
        content = self._build_content(
            image_bytes,
            "Extract all text from this image. Preserve formatting, layout, and structure as much as possible. Return only the extracted text.",
            detail,
        )
        return await self._call_vision(content)

    async def _detect_objects(self, image_bytes: bytes, prompt: str, detail: str) -> List[Dict[str, Any]]:
        content = self._build_content(
            image_bytes,
            "List all objects visible in this image. For each object, provide: name, estimated position (quadrant), approximate count, and confidence. Return as JSON array.",
            detail,
        )
        result = await self._call_vision(content, response_json=True)
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return [{"name": "unknown", "confidence": 0.5}]

    async def _analyze_chart(self, image_bytes: bytes, prompt: str, detail: str) -> Dict[str, Any]:
        content = self._build_content(
            image_bytes,
            "Analyze this chart/graph/data visualization. Return JSON with: chart_type, title, axes (x, y labels and ranges), data_points (key values), trends, insights, and any anomalies.",
            detail,
        )
        result = await self._call_vision(content, response_json=True)
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"chart_type": "unknown", "insights": result}

    async def _analyze_face(self, image_bytes: bytes, prompt: str, detail: str) -> Dict[str, Any]:
        content = self._build_content(
            image_bytes,
            "Analyze the face(s) in this image. Return JSON with: face_count, emotions (array), age_range, gender_presentation, notable_features, confidence. If no face, return null.",
            detail,
        )
        result = await self._call_vision(content, response_json=True)
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"face_count": 0, "note": "Could not analyze faces"}

    async def _analyze_document(self, image_bytes: bytes, prompt: str, detail: str) -> Dict[str, Any]:
        content = self._build_content(
            image_bytes,
            "Analyze this document image. Return JSON with: document_type, language, layout (sections, columns), key_content (title, headings, body), metadata (estimated page count, formatting).",
            detail,
        )
        result = await self._call_vision(content, response_json=True)
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {"document_type": "unknown", "content": result}
