from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "username": current_user.username, "full_name": current_user.full_name, "role": current_user.role.value if hasattr(current_user.role, "value") else current_user.role}


@router.patch("/me")
async def update_current_user(data: dict, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = UserService(db=db)
    updated = await svc.update_user(current_user.id, data)
    return updated


@router.get("/me/preferences")
async def get_preferences(current_user: User = Depends(get_current_user)):
    return current_user.preferences or {}


@router.patch("/me/preferences")
async def update_preferences(data: dict, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = UserService(db=db)
    result = await svc.update_preferences(current_user.id, data)
    return result


@router.delete("/me")
async def delete_account(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = UserService(db=db)
    await svc.delete_user(current_user.id)
    return {"message": "Account deleted"}
