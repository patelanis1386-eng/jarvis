from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.coding_service import CodingService

router = APIRouter()


@router.post("/analyze")
async def analyze_code(code: str = Query(...), language: str = Query("python"), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    result = await svc.analyze_code(code, language=language)
    return result


@router.post("/generate")
async def generate_code(prompt: str = Query(...), language: str = Query("python"), framework: str = Query(None), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    code = await svc.generate_code(prompt, language=language, framework=framework)
    return {"code": code}


@router.post("/review")
async def review_code(code: str = Query(...), language: str = Query("python"), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    result = await svc.review_code(code, language=language)
    return result


@router.post("/explain")
async def explain_code(code: str = Query(...), language: str = Query("python"), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    explanation = await svc.explain_code(code, language=language)
    return {"explanation": explanation}


@router.post("/debug")
async def debug_code(code: str = Query(...), error_message: str = Query(None), language: str = Query("python"), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    result = await svc.debug_code(code, error_message=error_message, language=language)
    return result


@router.post("/refactor")
async def refactor_code(code: str = Query(...), language: str = Query("python"), current_user: User = Depends(get_current_user)):
    svc = CodingService()
    result = await svc.refactor_code(code, language=language)
    return result
