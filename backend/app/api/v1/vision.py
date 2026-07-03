from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.vision_service import VisionService

router = APIRouter()


@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...), prompt: str = Form("Describe this image in detail."), current_user: User = Depends(get_current_user)):
    svc = VisionService()
    data = await file.read()
    description = await svc.analyze_image(data, prompt=prompt)
    return {"description": description}


@router.post("/ocr")
async def ocr_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    svc = VisionService()
    data = await file.read()
    text = await svc.ocr_from_image(data)
    return {"text": text}


@router.post("/detect")
async def detect_objects(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    svc = VisionService()
    data = await file.read()
    objects = await svc.detect_objects(data)
    return {"objects": objects}
