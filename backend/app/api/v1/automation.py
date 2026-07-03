from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.automation_service import AutomationService

router = APIRouter()


@router.post("/")
async def create_automation(data: dict, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AutomationService(db=db)
    automation = await svc.create_automation(user_id=current_user.id, **data)
    return {"id": automation.id, "name": automation.name, "trigger_type": automation.trigger_type, "action_type": automation.action_type, "is_active": automation.is_active}


@router.get("/")
async def list_automations(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AutomationService(db=db)
    automations = await svc.get_automations(user_id=current_user.id)
    return {"items": [{"id": a.id, "name": a.name, "trigger_type": a.trigger_type, "action_type": a.action_type, "is_active": a.is_active, "last_run": a.last_run.isoformat() if a.last_run else None, "created_at": a.created_at.isoformat() if a.created_at else None} for a in automations]}


@router.get("/{automation_id}")
async def get_automation(automation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AutomationService(db=db)
    automation = await svc.get_automation(automation_id)
    return {"id": automation.id, "name": automation.name, "trigger_type": automation.trigger_type, "trigger_config": automation.trigger_config, "action_type": automation.action_type, "action_config": automation.action_config, "is_active": automation.is_active}


@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AutomationService(db=db)
    await svc.delete_automation(automation_id)
    return {"message": "Deleted"}


@router.post("/{automation_id}/run")
async def run_automation(automation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = AutomationService(db=db)
    result = await svc.execute_automation(automation_id)
    return {"result": result}
