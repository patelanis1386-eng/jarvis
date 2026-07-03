from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/overview")
async def get_overview(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AnalyticsService(db=db)
    return await svc.get_overview(user_id=current_user.id)


@router.get("/usage")
async def get_usage(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AnalyticsService(db=db)
    return await svc.get_usage_stats(user_id=current_user.id)


@router.get("/conversations")
async def get_conversation_analytics(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AnalyticsService(db=db)
    return await svc.get_conversation_analytics(user_id=current_user.id)


@router.get("/performance")
async def get_performance(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AnalyticsService(db=db)
    return await svc.get_performance_metrics()
