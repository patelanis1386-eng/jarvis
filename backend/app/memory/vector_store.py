import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np


class VectorStore:
    def __init__(
        self,
        openai_client=None,
        embedding_model: str = "text-embedding-3-small",
        store_path: str = "data/vectors",
    ):
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.embedding_model = embedding_model
        self.store_path = Path(store_path)
        self.store_path.mkdir(parents=True, exist_ok=True)

        self._vectors: Dict[str, np.ndarray] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._index_file = self.store_path / "index.json"
        self._load_index()

    def _load_index(self):
        if self._index_file.exists():
            try:
                with open(self._index_file, "r") as f:
                    data = json.load(f)
                    self._metadata = data.get("metadata", {})
                    vectors_file = self.store_path / "vectors.npy"
                    if vectors_file.exists():
                        self._vectors = np.load(vectors_file, allow_pickle=True).item()
            except Exception:
                self._vectors = {}
                self._metadata = {}

    def _save_index(self):
        try:
            with open(self._index_file, "w") as f:
                json.dump({"metadata": self._metadata}, f)
            vectors_path = self.store_path / "vectors.npy"
            np.save(vectors_path, self._vectors)
        except Exception as e:
            print(f"Failed to save vector index: {e}")

    async def embed_text(self, text: str) -> List[float]:
        try:
            response = await self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            raise RuntimeError(f"Embedding failed: {str(e)}")

    async def add_embedding(
        self,
        id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self._vectors[id] = np.array(embedding, dtype=np.float32)
        self._metadata[id] = metadata or {}
        self._save_index()

    async def search(
        self,
        query_embedding: List[float],
        limit: int = 10,
        filter_criteria: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not self._vectors:
            return []

        query_vec = np.array(query_embedding, dtype=np.float32)

        candidate_ids = list(self._vectors.keys())
        if filter_criteria:
            candidate_ids = [
                id for id in candidate_ids
                if self._matches_filter(self._metadata.get(id, {}), filter_criteria)
            ]

        if not candidate_ids:
            return []

        candidate_vecs = np.array([self._vectors[id] for id in candidate_ids])

        similarities = self._cosine_similarity(query_vec, candidate_vecs)
        top_indices = np.argsort(similarities)[::-1][:limit]

        results = []
        for idx in top_indices:
            candidate_id = candidate_ids[idx]
            results.append({
                "id": candidate_id,
                "score": float(similarities[idx]),
                "metadata": self._metadata.get(candidate_id, {}),
            })

        return results

    def _cosine_similarity(self, query: np.ndarray, candidates: np.ndarray) -> np.ndarray:
        query_norm = query / np.linalg.norm(query)
        candidates_norm = candidates / (np.linalg.norm(candidates, axis=1, keepdims=True) + 1e-10)
        return np.dot(candidates_norm, query_norm)

    def _matches_filter(
        self, metadata: Dict[str, Any], filter_criteria: Dict[str, Any]
    ) -> bool:
        for key, value in filter_criteria.items():
            if key not in metadata:
                return False
            if isinstance(value, (list, tuple)):
                if metadata[key] not in value:
                    return False
            elif metadata[key] != value:
                return False
        return True

    async def delete(self, id: str):
        self._vectors.pop(id, None)
        self._metadata.pop(id, None)
        self._save_index()

    async def clear(self):
        self._vectors.clear()
        self._metadata.clear()
        self._save_index()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_vectors": len(self._vectors),
            "dimension": len(next(iter(self._vectors.values()))) if self._vectors else 0,
            "model": self.embedding_model,
        }
