import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def create_conversation(title: str = "New Conversation", current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    conv = await svc.create_conversation(user_id=current_user.id, title=title)
    return {"id": conv.id, "title": conv.title, "created_at": conv.created_at.isoformat() if conv.created_at else None}


@router.get("/conversations")
async def list_conversations(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    conversations = await svc.get_conversations(user_id=current_user.id, skip=(page - 1) * per_page, limit=per_page)
    return {"items": [{"id": c.id, "title": c.title, "message_count": 0, "created_at": c.created_at.isoformat() if c.created_at else None, "updated_at": c.updated_at.isoformat() if c.updated_at else None} for c in conversations], "total": len(conversations), "page": page, "per_page": per_page}


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    try:
        conv = await svc.get_conversation(conversation_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await svc.get_messages(conversation_id)
    return {"id": conv.id, "title": conv.title, "messages": [{"id": m.id, "role": m.role.value if hasattr(m.role, "value") else m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None} for m in messages]}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    try:
        await svc.delete_conversation(conversation_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Deleted"}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, content: str = Query(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    try:
        msg = await svc.send_message(conversation_id, content)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": msg.id, "role": "user", "content": msg.content, "created_at": msg.created_at.isoformat() if msg.created_at else None}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    messages = await svc.get_messages(conversation_id)
    return {"items": [{"id": m.id, "role": m.role.value if hasattr(m.role, "value") else m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None} for m in messages]}


@router.delete("/conversations/{conversation_id}/messages/{message_id}")
async def delete_message(conversation_id: str, message_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    try:
        await svc.delete_message(message_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Deleted"}


@router.post("/conversations/{conversation_id}/stream")
async def stream_response(conversation_id: str, content: str = Query(...), current_user: User = Depends(get_current_user), db=Depends(get_db)):
    svc = ChatService(db=db)
    return StreamingResponse(svc.stream_response(conversation_id, content), media_type="text/event-stream")


@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket, db=Depends(get_db)):
    await websocket.accept()
    svc = ChatService(db=db)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            conv_id = msg.get("conversation_id")
            content = msg.get("content", "")
            async for chunk in svc.stream_response(conv_id, content):
                await websocket.send_text(chunk)
    except WebSocketDisconnect:
        pass
