from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.plugin_service import PluginService

router = APIRouter()


@router.get("/")
async def list_plugins():
    svc = PluginService()
    return {"plugins": await svc.list_plugins()}


@router.get("/installed")
async def list_installed_plugins(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = PluginService(db=db)
    return {"installed": await svc.list_installed(user_id=current_user.id)}


@router.post("/{plugin_id}/install")
async def install_plugin(plugin_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = PluginService(db=db)
    result = await svc.install_plugin(user_id=current_user.id, plugin_id=plugin_id)
    return {"message": "Installed", "plugin": result}


@router.post("/{plugin_id}/uninstall")
async def uninstall_plugin(plugin_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = PluginService(db=db)
    await svc.uninstall_plugin(user_id=current_user.id, plugin_id=plugin_id)
    return {"message": "Uninstalled"}


@router.get("/marketplace")
async def browse_marketplace():
    svc = PluginService()
    return {"marketplace": await svc.browse_marketplace()}
