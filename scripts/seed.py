#!/usr/bin/env python3
"""Seed the database with demo data for JARVIS X."""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Try to import app models; fallback to raw SQL if unavailable
try:
    from app.core.database import get_db, engine
    from app.models.user import User
    from app.models.conversation import Conversation, Message
    from app.models.memory import Memory
    from app.models.plugin import Plugin
    HAS_MODELS = True
except ImportError:
    HAS_MODELS = False

SEED_DATA = {
    "admin_user": {
        "email": "admin@jarvisx.ai",
        "username": "admin",
        "password": "Admin123!",
        "full_name": "JARVIS X Administrator",
        "is_superuser": True,
        "is_active": True,
    },
    "demo_user": {
        "email": "demo@jarvisx.ai",
        "username": "demo",
        "password": "Demo123!",
        "full_name": "Demo User",
        "is_superuser": False,
        "is_active": True,
    },
}

SAMPLE_CONVERSATIONS = [
    {
        "title": "Welcome to JARVIS X",
        "user_id": None,
        "messages": [
            {"role": "system", "content": "You are JARVIS X, an AI operating system assistant."},
            {"role": "assistant", "content": "Hello! I'm JARVIS X, your AI operating system. How can I assist you today?"},
            {"role": "user", "content": "What can you do?"},
            {"role": "assistant", "content": "I can help with a wide range of tasks:\n- Answer questions and have conversations\n- Execute code and analyze data\n- Control your smart home devices\n- Manage your schedule and reminders\n- Search the web for information\n- Process images and documents\n- And much more!"},
        ],
    },
    {
        "title": "Code Generation Demo",
        "user_id": None,
        "messages": [
            {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"},
            {"role": "assistant", "content": "```python\ndef fibonacci(n: int) -> list[int]:\n    \"\"\"Generate the first n Fibonacci numbers.\"\"\"\n    if n <= 0:\n        return []\n    if n == 1:\n        return [0]\n    \n    fib = [0, 1]\n    for i in range(2, n):\n        fib.append(fib[i-1] + fib[i-2])\n    return fib\n\n# Example\nprint(fibonacci(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n```\n\nThis function uses an iterative approach with O(n) time complexity and O(n) space complexity."},
        ],
    },
    {
        "title": "Smart Home Control",
        "user_id": None,
        "messages": [
            {"role": "user", "content": "Turn off the living room lights and set the thermostat to 72 degrees"},
            {"role": "assistant", "content": "I've executed the following actions:\n\n- Living room lights: OFF\n- Thermostat: Set to 72°F\n\nIs there anything else you'd like me to adjust?"},
        ],
    },
]

SAMPLE_MEMORIES = [
    {
        "title": "User Preferences",
        "content": "User prefers dark mode, concise responses, and technical explanations with code examples.",
        "memory_type": "preference",
        "importance": 8,
    },
    {
        "title": "Frequently Used Tools",
        "content": "User frequently uses code execution, web search, and file operations.",
        "memory_type": "behavioral",
        "importance": 6,
    },
    {
        "title": "Project Context",
        "content": "User is building an AI operating system named JARVIS X with voice control, vision, and automation capabilities.",
        "memory_type": "contextual",
        "importance": 9,
    },
]

SAMPLE_PLUGINS = [
    {
        "name": "Web Search",
        "description": "Search the web using Google or Bing. Returns structured results with snippets and URLs.",
        "version": "1.0.0",
        "category": "search",
        "enabled": True,
        "config": {"provider": "google", "max_results": 10},
    },
    {
        "name": "Code Executor",
        "description": "Execute Python, JavaScript, and shell commands in a sandboxed environment.",
        "version": "1.1.0",
        "category": "execution",
        "enabled": True,
        "config": {"timeout": 30, "memory_limit": 256},
    },
    {
        "name": "Image Analysis",
        "description": "Analyze images using vision models. Supports object detection, OCR, and scene description.",
        "version": "1.0.0",
        "category": "vision",
        "enabled": True,
        "config": {"model": "gpt-4o", "max_size": 20971520},
    },
    {
        "name": "Voice Control",
        "description": "Voice-based interaction with speech recognition and text-to-speech synthesis.",
        "version": "1.2.0",
        "category": "voice",
        "enabled": False,
        "config": {"whisper_model": "whisper-1", "tts_voice": "alloy"},
    },
    {
        "name": "Smart Home",
        "description": "Control IoT devices, smart lights, thermostats, and other connected home appliances.",
        "version": "0.9.0",
        "category": "automation",
        "enabled": True,
        "config": {"platform": "homeassistant", "auto_discover": True},
    },
    {
        "name": "File Manager",
        "description": "Read, write, organize, and search files in the local filesystem with permission controls.",
        "version": "1.0.0",
        "category": "system",
        "enabled": True,
        "config": {"allowed_paths": ["/app/data", "/app/uploads"], "max_file_size": 10485760},
    },
]


async def seed_raw_sql():
    """Seed database using raw SQL when app models are unavailable."""
    from app.core.config import settings

    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Create tables if they don't exist
        from app.models.base import Base
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        await _seed_all(session)
        await session.commit()

    await engine.dispose()


async def seed_with_models():
    """Seed database using SQLAlchemy ORM models."""
    from app.core.database import async_session_factory, engine

    async with engine.begin() as conn:
        from app.models.base import Base
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await _seed_all(session)
        await session.commit()


async def _seed_all(session: AsyncSession):
    """Core seeding logic shared by both methods."""
    from app.models.user import User
    from app.models.conversation import Conversation, Message
    from app.models.memory import Memory
    from app.models.plugin import Plugin

    # ── Users ──────────────────────────────────
    for user_data in SEED_DATA.values():
        existing = await session.execute(
            select(User).where(User.email == user_data["email"])
        )
        if existing.scalar_one_or_none():
            print(f"User {user_data['email']} already exists, skipping.")
            continue

        user = User(
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=pwd_context.hash(user_data["password"]),
            full_name=user_data["full_name"],
            is_superuser=user_data["is_superuser"],
            is_active=user_data["is_active"],
        )
        session.add(user)
        print(f"Created user: {user_data['email']}")

    await session.flush()

    # ── Conversations ──────────────────────────
    admin_result = await session.execute(
        select(User).where(User.email == "admin@jarvisx.ai")
    )
    admin_user = admin_result.scalar_one_or_none()

    for conv_data in SAMPLE_CONVERSATIONS:
        conv = Conversation(
            title=conv_data["title"],
            user_id=admin_user.id if admin_user else None,
            created_at=datetime.now(timezone.utc) - timedelta(hours=len(conv_data["messages"])),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(conv)
        await session.flush()

        for i, msg_data in enumerate(conv_data["messages"]):
            msg = Message(
                conversation_id=conv.id,
                role=msg_data["role"],
                content=msg_data["content"],
                created_at=conv.created_at + timedelta(minutes=i * 5),
            )
            session.add(msg)

        print(f"Created conversation: {conv_data['title']}")

    # ── Memories ───────────────────────────────
    for mem_data in SAMPLE_MEMORIES:
        existing = await session.execute(
            select(Memory).where(Memory.title == mem_data["title"])
        )
        if existing.scalar_one_or_none():
            continue

        memory = Memory(
            title=mem_data["title"],
            content=mem_data["content"],
            memory_type=mem_data["memory_type"],
            importance=mem_data["importance"],
            user_id=admin_user.id if admin_user else None,
        )
        session.add(memory)
        print(f"Created memory: {mem_data['title']}")

    # ── Plugins ────────────────────────────────
    for plugin_data in SAMPLE_PLUGINS:
        existing = await session.execute(
            select(Plugin).where(Plugin.name == plugin_data["name"])
        )
        if existing.scalar_one_or_none():
            continue

        plugin = Plugin(
            name=plugin_data["name"],
            description=plugin_data["description"],
            version=plugin_data["version"],
            category=plugin_data["category"],
            enabled=plugin_data["enabled"],
            config=plugin_data["config"],
        )
        session.add(plugin)
        print(f"Created plugin: {plugin_data['name']}")


async def main():
    print(" Seeding JARVIS X database...")
    print("=" * 40)

    try:
        if HAS_MODELS:
            await seed_with_models()
        else:
            await seed_raw_sql()

        print("=" * 40)
        print(" Database seeded successfully!")
        print(f"  Users:         {len(SEED_DATA)}")
        print(f"  Conversations: {len(SAMPLE_CONVERSATIONS)}")
        print(f"  Memories:      {len(SAMPLE_MEMORIES)}")
        print(f"  Plugins:       {len(SAMPLE_PLUGINS)}")
        print("=" * 40)
    except Exception as e:
        print(f" Failed to seed database: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
