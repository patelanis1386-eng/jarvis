from typing import Any, Dict, List, Optional

from app.memory.vector_store import VectorStore


class MemoryManager:
    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()
        self.short_term: List[Dict[str, Any]] = []
        self.max_short_term = 100
        self.consolidation_threshold = 0.7

    async def add_to_short_term(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        entry = {
            "content": content,
            "metadata": metadata or {},
            "timestamp": self._now(),
            "access_count": 0,
        }
        self.short_term.append(entry)

        if len(self.short_term) > self.max_short_term:
            self.short_term.pop(0)

    async def consolidate_to_long_term(self):
        high_importance = [
            entry for entry in self.short_term
            if entry["metadata"].get("importance", 0) >= self.consolidation_threshold
        ]

        for entry in high_importance:
            try:
                await self.vector_store.add_embedding(
                    id=f"memory_{self._now()}",
                    embedding=await self.vector_store.embed_text(entry["content"]),
                    metadata={
                        "type": "long_term",
                        "content": entry["content"],
                        "importance": entry["metadata"].get("importance", 0.5),
                        "timestamp": entry["timestamp"],
                        "source": entry["metadata"].get("source", "conversation"),
                    },
                )
            except Exception:
                pass

        self.short_term = [
            entry for entry in self.short_term
            if entry["metadata"].get("importance", 0) < self.consolidation_threshold
        ]

    async def search_all(self, query: str, limit: int = 10) -> Dict[str, List[Dict[str, Any]]]:
        results = {"short_term": [], "long_term": [], "semantic": []}

        for entry in self.short_term:
            if query.lower() in entry["content"].lower():
                results["short_term"].append(entry)

        try:
            query_embedding = await self.vector_store.embed_text(query)
            vector_results = await self.vector_store.search(
                query_embedding, limit=limit
            )
            for r in vector_results:
                meta = r.get("metadata", {})
                if meta.get("type") == "long_term":
                    results["long_term"].append(meta)
                else:
                    results["semantic"].append(meta)
        except Exception:
            pass

        return results

    async def get_relevant_context(
        self, query: str, max_items: int = 5
    ) -> List[Dict[str, Any]]:
        search_results = await self.search_all(query, limit=max_items)

        combined = []
        for category, items in search_results.items():
            for item in items[:max_items]:
                combined.append({
                    "content": item.get("content", item.get("text", "")),
                    "source": item.get("source", category),
                    "importance": item.get("metadata", {}).get(
                        "importance", item.get("importance", 0.5)
                    ),
                    "timestamp": item.get("timestamp", item.get("created_at", "")),
                })

        combined.sort(key=lambda x: x.get("importance", 0), reverse=True)
        return combined[:max_items]

    async def clear_short_term(self):
        self.short_term.clear()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "short_term_count": len(self.short_term),
            "vector_store_stats": self.vector_store.get_stats(),
        }

    def _now(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
