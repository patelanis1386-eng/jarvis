from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.memory_service import MemoryService

router = APIRouter()


@router.post("/")
async def store_memory(content: str = Query(...), memory_type: str = Query("general"), importance: float = Query(0.5), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = MemoryService(db=db)
    memory = await svc.store_memory(user_id=current_user.id, content=content, memory_type=memory_type, importance=importance)
    return {"id": memory.id, "content": memory.content[:100], "type": memory.type.value if hasattr(memory.type, "value") else memory.type, "importance": memory.importance}


@router.get("/")
async def list_memories(memory_type: str = Query(None), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = MemoryService(db=db)
    memories = await svc.get_memories(user_id=current_user.id, memory_type=memory_type)
    return {"items": [{"id": m.id, "content": m.value[:200], "type": m.type.value if hasattr(m.type, "value") else m.type, "importance": m.importance, "created_at": m.created_at.isoformat() if m.created_at else None} for m in memories]}


@router.get("/search")
async def search_memories(query: str = Query(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = MemoryService(db=db)
    results = await svc.search_memories(user_id=current_user.id, query=query)
    return {"results": results}


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = MemoryService(db=db)
    await svc.delete_memory(memory_id)
    return {"message": "Deleted"}


@router.delete("/")
async def clear_memories(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = MemoryService(db=db)
    await svc.clear_memories(user_id=current_user.id)
    return {"message": "All memories cleared"}
