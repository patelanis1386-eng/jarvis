import json
from datetime import datetime, timezone
from typing import AsyncGenerator, List, Optional, Dict, Any
from uuid import uuid4

from sqlalchemy import select, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message


class ChatNotFoundError(Exception):
    pass


class ChatService:
    def __init__(
        self,
        db: AsyncSession,
        openai_client=None,
        model: str = "gpt-4o",
    ):
        self.db = db
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model

    async def create_conversation(
        self, user_id: str, title: str = "New Conversation", metadata: Optional[Dict[str, Any]] = None
    ) -> Conversation:
        conversation = Conversation(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            metadata=metadata or {},
            is_archived=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_conversations(
        self, user_id: str, skip: int = 0, limit: int = 50, archived: bool = False
    ) -> List[Conversation]:
        query = (
            select(Conversation)
            .where(Conversation.user_id == user_id, Conversation.is_archived == archived)
            .offset(skip)
            .limit(limit)
            .order_by(desc(Conversation.updated_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_conversation(self, conversation_id: str) -> Conversation:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise ChatNotFoundError(f"Conversation {conversation_id} not found")
        return conversation

    async def delete_conversation(self, conversation_id: str) -> bool:
        await self.get_conversation(conversation_id)
        await self.db.execute(
            delete(Message).where(Message.conversation_id == conversation_id)
        )
        await self.db.execute(
            delete(Conversation).where(Conversation.id == conversation_id)
        )
        await self.db.commit()
        return True

    async def send_message(
        self, conversation_id: str, content: str, role: str = "user",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        conversation = await self.get_conversation(conversation_id)

        user_message = Message(
            id=str(uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata or {},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(user_message)

        messages = await self.get_messages(conversation_id, limit=50)
        conversation_history = [
            {"role": m.role, "content": m.content} for m in messages
        ]
        conversation_history.append({"role": "user", "content": content})

        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=conversation_history,
                temperature=0.7,
                max_tokens=4096,
            )

            assistant_content = response.choices[0].message.content or ""
            usage = response.usage

            assistant_message = Message(
                id=str(uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=assistant_content,
                metadata={
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": usage.prompt_tokens if usage else 0,
                        "completion_tokens": usage.completion_tokens if usage else 0,
                        "total_tokens": usage.total_tokens if usage else 0,
                    },
                },
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(assistant_message)

            conversation.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(user_message)
            return user_message

        except Exception as e:
            await self.db.commit()
            raise e

    async def get_messages(
        self, conversation_id: str, skip: int = 0, limit: int = 100
    ) -> List[Message]:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .offset(skip)
            .limit(limit)
            .order_by(Message.created_at)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def delete_message(self, message_id: str) -> bool:
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        message = result.scalar_one_or_none()
        if not message:
            raise ChatNotFoundError(f"Message {message_id} not found")
        await self.db.delete(message)
        await self.db.commit()
        return True

    async def stream_response(
        self, conversation_id: str, content: str
    ) -> AsyncGenerator[str, None]:
        conversation = await self.get_conversation(conversation_id)

        user_message = Message(
            id=str(uuid4()),
            conversation_id=conversation_id,
            role="user",
            content=content,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(user_message)
        await self.db.commit()

        messages = await self.get_messages(conversation_id, limit=50)
        conversation_history = [
            {"role": m.role, "content": m.content} for m in messages
        ]

        stream = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=conversation_history,
            temperature=0.7,
            max_tokens=4096,
            stream=True,
        )

        full_response = []
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                delta = chunk.choices[0].delta.content
                full_response.append(delta)
                yield json.dumps({"type": "chunk", "content": delta}) + "\n"

        assistant_content = "".join(full_response)
        assistant_message = Message(
            id=str(uuid4()),
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
            metadata={"model": self.model, "streamed": True},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(assistant_message)
        conversation.updated_at = datetime.now(timezone.utc)
        await self.db.commit()

        yield json.dumps({
            "type": "done",
            "message_id": assistant_message.id,
            "content": assistant_content,
        }) + "\n"
