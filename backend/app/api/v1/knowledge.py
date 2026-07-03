from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.knowledge_service import KnowledgeService

router = APIRouter()


@router.post("/")
async def add_knowledge(data: dict, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    item = await svc.add_knowledge(user_id=current_user.id, **data)
    return {"id": item.id, "title": item.title, "category": item.category, "created_at": item.created_at.isoformat() if item.created_at else None}


@router.get("/")
async def list_knowledge(category: str = Query(None), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    items = await svc.list_knowledge(user_id=current_user.id, category=category)
    return {"items": [{"id": k.id, "title": k.title, "content": k.content[:300], "category": k.category, "tags": k.tags, "source": k.source, "created_at": k.created_at.isoformat() if k.created_at else None} for k in items]}


@router.get("/{knowledge_id}")
async def get_knowledge(knowledge_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    item = await svc.get_knowledge(knowledge_id)
    return {"id": item.id, "title": item.title, "content": item.content, "category": item.category, "tags": item.tags, "source": item.source, "created_at": item.created_at.isoformat() if item.created_at else None}


@router.delete("/{knowledge_id}")
async def delete_knowledge(knowledge_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    await svc.delete_knowledge(knowledge_id)
    return {"message": "Deleted"}


@router.get("/search")
async def search_knowledge(query: str = Query(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    results = await svc.search_knowledge(user_id=current_user.id, query_text=query)
    return {"results": results}


@router.get("/graph")
async def get_knowledge_graph(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = KnowledgeService(db=db)
    graph = await svc.get_knowledge_graph(user_id=current_user.id)
    return graph
