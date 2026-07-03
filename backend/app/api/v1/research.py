from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.research_service import ResearchService

router = APIRouter()


@router.post("/")
async def start_research(topic: str = Query(...), depth: str = Query("standard"), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ResearchService(db=db)
    project = await svc.start_research(user_id=current_user.id, topic=topic, depth=depth)
    return {"id": project.id, "topic": project.topic, "status": project.status, "progress": project.progress}


@router.get("/{project_id}")
async def get_research(project_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ResearchService(db=db)
    project = await svc.get_results(project_id)
    return {"id": project.id, "topic": project.topic, "status": project.status, "progress": project.progress, "summary": project.summary, "created_at": project.created_at.isoformat() if project.created_at else None}


@router.post("/{project_id}/cancel")
async def cancel_research(project_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ResearchService(db=db)
    await svc.cancel_research(project_id)
    return {"message": "Cancelled"}


@router.post("/{project_id}/export")
async def export_research(project_id: str, format: str = Query("markdown"), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ResearchService(db=db)
    content = await svc.export_research(project_id, format=format)
    return {"content": content, "format": format}
