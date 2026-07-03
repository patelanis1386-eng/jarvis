import json
import re
from typing import Any, Dict, List, Optional

class KnowledgeExtractor:
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

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract named entities from the text. Return a JSON array of objects with: name, type (person, organization, location, date, concept, technology, product, event, other), confidence (0-1), and context (surrounding text snippet).",
                },
                {"role": "user", "content": text[:8000]},
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            return data.get("entities", [])
        except (json.JSONDecodeError, KeyError):
            return self._extract_entities_regex(text)

    def _extract_entities_regex(self, text: str) -> List[Dict[str, Any]]:
        entities = []

        patterns = {
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "url": r"https?://[^\s<>\"']+|www\.[^\s<>\"']+",
            "date": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b",
            "number": r"\b\d+\.?\d*\b",
        }

        for entity_type, pattern in patterns.items():
            for match in re.finditer(pattern, text):
                start = max(0, match.start() - 50)
                end = min(len(text), match.end() + 50)
                context = text[start:end].strip()
                entities.append({
                    "name": match.group(),
                    "type": entity_type,
                    "confidence": 0.7,
                    "context": context,
                })

        return entities

    async def extract_relationships(self, text: str) -> List[Dict[str, Any]]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract relationships between entities from the text. Return a JSON array of objects with: source (entity name), target (entity name), relationship (predicate/verb), confidence (0-1), context (evidence from text).",
                },
                {"role": "user", "content": text[:8000]},
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            return data.get("relationships", [])
        except (json.JSONDecodeError, KeyError):
            return []

    async def extract_facts(self, text: str) -> List[Dict[str, Any]]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract factual statements from the text. Return a JSON array of objects with: fact (the factual statement), category (science, history, technology, business, health, general), confidence (0-1), source_snippet, subjects (array of related entities).",
                },
                {"role": "user", "content": text[:8000]},
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            return data.get("facts", [])
        except (json.JSONDecodeError, KeyError):
            return [{"fact": text[:200], "category": "general", "confidence": 0.5}]

    async def extract_structured(self, text: str) -> Dict[str, Any]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract structured knowledge from text. Return JSON with: summary (string), keywords (array), entities (array of {name, type}), relationships (array of {source, target, relationship}), category, sentiment (positive/negative/neutral), language, confidence (0-1).",
                },
                {"role": "user", "content": text[:8000]},
            ],
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(response.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            return {
                "summary": text[:200],
                "keywords": [],
                "entities": [],
                "relationships": [],
                "category": "general",
                "sentiment": "neutral",
                "confidence": 0.5,
            }
