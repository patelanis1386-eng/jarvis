from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select, delete, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import Memory
from app.memory.vector_store import VectorStore


class MemoryNotFoundError(Exception):
    pass


class MemoryService:
    def __init__(self, db: AsyncSession, vector_store: Optional[VectorStore] = None):
        self.db = db
        self.vector_store = vector_store or VectorStore()

    async def store_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str = "general",
        importance: float = 0.5,
        source: str = "conversation",
        metadata: Optional[Dict[str, Any]] = None,
        ttl_seconds: Optional[int] = None,
    ) -> Memory:
        memory = Memory(
            id=str(uuid4()),
            user_id=user_id,
            content=content,
            memory_type=memory_type,
            importance=importance,
            source=source,
            metadata=metadata or {},
            embedding=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            expires_at=(
                datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
                if ttl_seconds
                else None
            ),
            access_count=0,
        )
        self.db.add(memory)
        await self.db.commit()
        await self.db.refresh(memory)

        try:
            embedding = await self.vector_store.embed_text(content)
            memory.embedding = embedding
            await self.vector_store.add_embedding(
                id=memory.id,
                embedding=embedding,
                metadata={
                    "user_id": user_id,
                    "type": memory_type,
                    "content": content[:200],
                },
            )
        except Exception:
            pass

        await self.db.commit()
        return memory

    async def get_memories(
        self,
        user_id: str,
        memory_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Memory]:
        query = select(Memory).where(Memory.user_id == user_id)
        if memory_type:
            query = query.where(Memory.memory_type == memory_type)
        query = (
            query
            .offset(skip)
            .limit(limit)
            .order_by(desc(Memory.importance), desc(Memory.created_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def search_memories(
        self,
        user_id: str,
        query_text: str,
        limit: int = 10,
        memory_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query_embedding = await self.vector_store.embed_text(query_text)
        results = await self.vector_store.search(
            query_embedding,
            limit=limit,
            filter_criteria={"user_id": user_id}
            if memory_type
            else {"user_id": user_id},
        )

        memory_ids = [r["id"] for r in results]
        if not memory_ids:
            return []

        result = await self.db.execute(
            select(Memory).where(Memory.id.in_(memory_ids))
        )
        memories = {m.id: m for m in result.scalars().all()}

        enriched = []
        for r in results:
            mem = memories.get(r["id"])
            if mem:
                mem.access_count = (mem.access_count or 0) + 1
                enriched.append({
                    "id": mem.id,
                    "content": mem.content,
                    "memory_type": mem.memory_type,
                    "importance": mem.importance,
                    "source": mem.source,
                    "metadata": mem.metadata,
                    "created_at": mem.created_at.isoformat(),
                    "score": r.get("score", 0),
                })

        await self.db.commit()
        return enriched

    async def delete_memory(self, memory_id: str) -> bool:
        result = await self.db.execute(
            select(Memory).where(Memory.id == memory_id)
        )
        memory = result.scalar_one_or_none()
        if not memory:
            raise MemoryNotFoundError(f"Memory {memory_id} not found")

        await self.vector_store.delete(memory_id)
        await self.db.delete(memory)
        await self.db.commit()
        return True

    async def clear_memories(self, user_id: str, memory_type: Optional[str] = None) -> int:
        query = select(Memory).where(Memory.user_id == user_id)
        if memory_type:
            query = query.where(Memory.memory_type == memory_type)

        result = await self.db.execute(query)
        memories = result.scalars().all()
        for mem in memories:
            await self.vector_store.delete(mem.id)
            await self.db.delete(mem)

        await self.db.commit()
        return len(memories)

    async def consolidate_memories(self, user_id: str) -> Dict[str, Any]:
        result = await self.db.execute(
            select(Memory)
            .where(
                and_(
                    Memory.user_id == user_id,
                    Memory.memory_type == "short_term",
                    Memory.importance > 0.7,
                )
            )
            .order_by(desc(Memory.access_count))
        )
        important_memories = result.scalars().all()

        consolidated = 0
        for mem in important_memories:
            mem.memory_type = "long_term"
            mem.updated_at = datetime.now(timezone.utc)
            consolidated += 1

        cutoff = datetime.now(timezone.utc)
        await self.db.execute(
            delete(Memory).where(
                and_(
                    Memory.user_id == user_id,
                    Memory.memory_type == "short_term",
                    Memory.importance < 0.3,
                    Memory.access_count < 2,
                    Memory.created_at < cutoff,
                )
            )
        )

        await self.db.commit()
        return {
            "consolidated": consolidated,
            "message": f"Consolidated {consolidated} memories to long-term storage",
        }


from datetime import timedelta
