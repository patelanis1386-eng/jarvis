from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select, delete, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeItem, KnowledgeRelation
from app.knowledge.graph import KnowledgeGraph
from app.knowledge.extractor import KnowledgeExtractor
from app.memory.vector_store import VectorStore


class KnowledgeNotFoundError(Exception):
    pass


class KnowledgeService:
    def __init__(
        self,
        db: AsyncSession,
        vector_store: Optional[VectorStore] = None,
        knowledge_graph: Optional[KnowledgeGraph] = None,
        extractor: Optional[KnowledgeExtractor] = None,
    ):
        self.db = db
        self.vector_store = vector_store or VectorStore()
        self.knowledge_graph = knowledge_graph or KnowledgeGraph()
        self.extractor = extractor or KnowledgeExtractor()

    async def add_knowledge(
        self,
        user_id: str,
        title: str,
        content: str,
        source: str = "manual",
        category: str = "general",
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> KnowledgeItem:
        knowledge = KnowledgeItem(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            content=content,
            source=source,
            category=category,
            tags=tags or [],
            metadata=metadata or {},
            embedding=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(knowledge)
        await self.db.commit()
        await self.db.refresh(knowledge)

        try:
            embedding = await self.vector_store.embed_text(f"{title} {content}")
            knowledge.embedding = embedding
            await self.vector_store.add_embedding(
                id=knowledge.id,
                embedding=embedding,
                metadata={
                    "user_id": user_id,
                    "type": "knowledge",
                    "title": title,
                    "category": category,
                },
            )
        except Exception:
            pass

        if self.knowledge_graph:
            self.knowledge_graph.add_node(
                id=knowledge.id,
                label=title,
                category=category,
                metadata=metadata,
            )

        if self.extractor:
            try:
                entities = await self.extractor.extract_entities(content)
                relationships = await self.extractor.extract_relationships(content)
                for entity in entities:
                    entity_id = str(uuid4())
                    self.knowledge_graph.add_node(
                        id=entity_id,
                        label=entity["name"],
                        category="entity",
                        metadata=entity,
                    )
                    self.knowledge_graph.add_edge(
                        source=knowledge.id,
                        target=entity_id,
                        label="contains",
                        weight=1.0,
                    )
                for rel in relationships:
                    self.knowledge_graph.add_edge(
                        source=rel.get("source", knowledge.id),
                        target=rel.get("target", knowledge.id),
                        label=rel.get("relationship", "related"),
                        weight=rel.get("confidence", 0.5),
                    )
            except Exception:
                pass

        await self.db.commit()
        return knowledge

    async def get_knowledge(self, knowledge_id: str) -> KnowledgeItem:
        result = await self.db.execute(
            select(KnowledgeItem).where(KnowledgeItem.id == knowledge_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise KnowledgeNotFoundError(f"Knowledge item {knowledge_id} not found")
        return item

    async def list_knowledge(
        self,
        user_id: str,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[KnowledgeItem]:
        query = select(KnowledgeItem).where(KnowledgeItem.user_id == user_id)
        if category:
            query = query.where(KnowledgeItem.category == category)
        query = query.offset(skip).limit(limit).order_by(desc(KnowledgeItem.updated_at))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_knowledge(
        self, knowledge_id: str, updates: Dict[str, Any]
    ) -> KnowledgeItem:
        item = await self.get_knowledge(knowledge_id)
        allowed_fields = {"title", "content", "source", "category", "tags", "metadata"}
        for key, value in updates.items():
            if key in allowed_fields:
                setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_knowledge(self, knowledge_id: str) -> bool:
        item = await self.get_knowledge(knowledge_id)
        await self.vector_store.delete(knowledge_id)
        if self.knowledge_graph:
            self.knowledge_graph.remove_node(knowledge_id)
        await self.db.delete(item)
        await self.db.commit()
        return True

    async def search_knowledge(
        self, user_id: str, query_text: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        query_embedding = await self.vector_store.embed_text(query_text)
        results = await self.vector_store.search(
            query_embedding,
            limit=limit,
            filter_criteria={"user_id": user_id},
        )

        knowledge_ids = [r["id"] for r in results]
        if not knowledge_ids:
            return []

        result = await self.db.execute(
            select(KnowledgeItem).where(KnowledgeItem.id.in_(knowledge_ids))
        )
        items = {k.id: k for k in result.scalars().all()}

        enriched = []
        for r in results:
            item = items.get(r["id"])
            if item:
                enriched.append({
                    "id": item.id,
                    "title": item.title,
                    "content": item.content[:500],
                    "category": item.category,
                    "tags": item.tags,
                    "source": item.source,
                    "score": r.get("score", 0),
                    "created_at": item.created_at.isoformat(),
                })
        return enriched

    async def get_knowledge_graph(self, user_id: str, depth: int = 2) -> Dict[str, Any]:
        knowledge_items = await self.list_knowledge(user_id, limit=100)
        node_ids = [k.id for k in knowledge_items]

        graph_data = self.knowledge_graph.export_graph()
        filtered_nodes = [
            n for n in graph_data.get("nodes", [])
            if n.get("id") in node_ids or any(
                e.get("source") == n.get("id") or e.get("target") == n.get("id")
                for e in graph_data.get("edges", [])
                if e.get("source") in node_ids or e.get("target") in node_ids
            )
        ]
        node_id_set = {n["id"] for n in filtered_nodes}
        filtered_edges = [
            e for e in graph_data.get("edges", [])
            if e.get("source") in node_id_set and e.get("target") in node_id_set
        ]

        return {
            "nodes": filtered_nodes,
            "edges": filtered_edges,
            "metadata": {
                "total_nodes": len(filtered_nodes),
                "total_edges": len(filtered_edges),
                "depth": depth,
            },
        }
