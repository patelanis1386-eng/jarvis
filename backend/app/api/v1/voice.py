from fastapi import APIRouter, Depends, File, Form, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.voice_service import VoiceService

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), language: str = Form(None), current_user: User = Depends(get_current_user)):
    svc = VoiceService()
    data = await file.read()
    text = await svc.transcribe_audio(data, filename=file.filename or "audio.webm", language=language)
    return {"text": text}


@router.post("/synthesize")
async def synthesize_speech(text: str = Form(...), voice: str = Form("alloy"), current_user: User = Depends(get_current_user)):
    svc = VoiceService()
    audio = await svc.synthesize_speech(text, voice=voice)
    return StreamingResponse(iter([audio]), media_type="audio/mpeg")


@router.get("/voices")
async def list_voices():
    svc = VoiceService()
    return {"voices": await svc.list_voices()}
