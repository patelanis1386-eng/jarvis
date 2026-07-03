# Architecture — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04

---

## 1. System Architecture Overview

JARVIS X follows a **layered monolith** architecture with clear separation of concerns, designed to scale horizontally as demand grows. The system is composed of four primary layers:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         C L I E N T   L A Y E R                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Browser  │  │  Mobile  │  │ Desktop  │  │  CLI     │  │   API    │       │
│  │ (Web App)│  │  (PWA)   │  │  (Tauri) │  │ (Python) │  │ (3rd Pty)│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/WS
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │                    P R E S E N T A T I O N   L A Y E R                   │ │
│ │                (Next.js 15 — App Router, React 19, Server Components)     │ │
│ │                                                                          │ │
│ │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │ │
│ │  │   Server Components│  │   Client Components │  │   API Route Handler│  │ │
│ │  │   (RSC, Streaming) │  │   (Interactivity)   │  │   (BFF Proxy)      │  │ │
│ │  └────────────────────┘  └────────────────────┘  └────────────────────┘  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                    │ HTTP/WS
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │                       A P I   G A T E W A Y   L A Y E R                  │ │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│ │  │  Auth MW │  │ Rate Lim │  │  CORS    │  │  Logging │  │  Compress│   │ │
│ │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                    │ HTTP/WS
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │                       B U S I N E S S   L A Y E R                        │ │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│ │  │  Routes  │──│ Services │──│   AI     │──│ Plugins  │  │  Workers │   │ │
│ │  │ (FastAPI)│  │  (Logic) │  │  Engine  │  │  Manager │  │ (Celery) │   │ │
│ │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │                        D A T A   L A Y E R                               │ │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│ │  │PostgreSQL│  │  Redis   │  │  Neo4j   │  │  Qdrant  │  │  Object  │   │ │
│ │  │ (Rel DB) │  │ (Cache)  │  │ (Graph)  │  │(Vectors) │  │  Store   │   │ │
│ │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision                | Rationale                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| **Next.js 15 App Router** | Server Components reduce client bundle, React 19 Actions for mutations |
| **FastAPI**             | Async-first, automatic OpenAPI docs, Pydantic v2 validation               |
| **PostgreSQL + pgvector** | Single database for relational + vector search reduces operational cost |
| **Neo4j for graphs**    | Native graph traversal performance for knowledge relationships            |
| **Celery + Redis**      | Distributed task queue for long-running AI jobs                          |
| **JWT without sessions** | Stateless auth scales horizontally without shared session store          |

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
frontend/src/app/
├── (auth)/                 # Auth-required routes group
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx          # Auth layout wrapper
├── (dashboard)/           # Dashboard routes group
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Sidebar + top nav
│   ├── chat/
│   ├── voice/
│   ├── vision/
│   ├── automation/
│   ├── plugins/
│   ├── knowledge/
│   └── settings/
├── api/                    # API route handlers (BFF)
│   ├── auth/
│   ├── chat/
│   └── ...
└── layout.tsx              # Root layout
```

### 2.2 Component Hierarchy

```
RootLayout
├── AuthProvider (context)
│   └── ThemeProvider
│       └── DashboardLayout
│           ├── Sidebar
│           │   ├── NavItem (chat, voice, vision, etc.)
│           │   └── PluginNavItems (dynamic from registry)
│           ├── TopBar
│           │   ├── SearchCommand (⌘K)
│           │   ├── ThemeToggle
│           │   └── UserMenu
│           └── PageContent (slot)
│
├── ChatPage
│   ├── ConversationList
│   │   ├── ConversationItem
│   │   └── NewChatButton
│   ├── ChatWindow
│   │   ├── MessageList
│   │   │   ├── UserMessage
│   │   │   ├── AssistantMessage
│   │   │   │   ├── MarkdownRenderer
│   │   │   │   ├── CodeBlock
│   │   │   │   └── ToolCallResult
│   │   │   └── StreamingMessage
│   │   └── MessageInput
│   │       ├── TextArea (with auto-resize)
│   │       ├── VoiceButton
│   │       ├── AttachmentButton
│   │       └── SendButton
│   └── ModelSelector (dropdown / sidebar)
│
├── VoicePage
│   ├── VoiceVisualizer (audio waveform)
│   ├── TranscriptDisplay
│   ├── VoiceControls (record, stop, playback)
│   └── VoiceSettings (model, speed, voice)
│
├── VisionPage
│   ├── ImageUploader (drag & drop)
│   ├── ImagePreview
│   ├── AnalysisResult
│   │   ├── OCRText
│   │   ├── DetectedObjects
│   │   └── SceneDescription
│   └── AnalysisHistory
│
├── AutomationPage
│   ├── WorkflowList
│   ├── WorkflowEditor (drag & drop blocks)
│   │   ├── TriggerBlock
│   │   ├── ActionBlock
│   │   ├── ConditionBlock
│   │   └── ConnectionLines
│   ├── WorkflowLogs
│   └── ScheduleConfig
│
├── PluginMarketplace
│   ├── PluginCard (grid)
│   ├── PluginDetail
│   └── InstalledPlugins
│
├── KnowledgeGraph
│   ├── GraphCanvas (D3.js / Three.js)
│   ├── EntityPanel
│   ├── RelationshipPanel
│   └── SearchBar
│
└── SettingsPage
    ├── ProfileSettings
    ├── AISettings (model preferences, keys)
    ├── Appearance (theme, layout)
    ├── Integrations (connected services)
    └── Security (sessions, 2FA)
```

### 2.3 State Management

JARVIS X uses **Zustand** for client-side state management, with server state managed by **React Server Components** and **TanStack Query** for data fetching.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        STATE ARCHITECTURE                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │      SERVER STATE (RSC)          │  │     CLIENT STATE (Zustand)   │  │
│  │──────────────────────────────────│  │──────────────────────────────│  │
│  │ - Initial page data              │  │ - UI state (sidebar, theme)  │  │
│  │ - User profile                   │  │ - Chat input state           │  │
│  │ - Conversation list (cached)     │  │ - Voice recorder state       │  │
│  │ - Settings                       │  │ - WebSocket connection       │  │
│  └──────────────────────────────────┘  │ - Active conversation        │
│                                         │ - Plugin instances           │
│  ┌──────────────────────────────────┐  └──────────────────────────────┘  │
│  │      SERVER STATE (TanStack)     │                                      │
│  │──────────────────────────────────│  ┌──────────────────────────────┐  │
│  │ - API data with cache + mutate   │  │     PERSISTENT STATE         │  │
│  │ - Optimistic updates             │  │──────────────────────────────│  │
│  │ - Background refetching          │  │ - Auth tokens (httpOnly)     │  │
│  └──────────────────────────────────┘  │ - User preferences (local)   │  │
│                                         │ - Plugin data (IndexedDB)    │  │
│                                         └──────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Zustand Stores:**

| Store         | Key State                                       |
| ------------- | ----------------------------------------------- |
| `useChatStore` | Messages, active conversation, streaming state  |
| `useVoiceStore` | Recording state, audio buffer, transcript     |
| `useUIStore`  | Sidebar open, theme, active page, modals        |
| `useAuthStore` | User object, permissions, session status       |
| `useWSStore`  | WebSocket connection, event queue, reconnect    |

### 2.4 Data Flow

```
USER ACTION
    │
    ▼
┌─────────────────────┐
│  Client Component    │  e.g., MessageInput sends a message
│  (Event Handler)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Zustand Action      │  Updates optimistic UI state
│  (useChatStore.send) │
└──────┬──────────────┘
       │
       ├────────────────────────────────────┐
       ▼                                    ▼
┌──────────────────┐          ┌──────────────────────────┐
│  Server Action    │          │  API Route (BFF)         │
│  (Next.js 15)     │          │  /app/api/chat/...       │
│  - Runs on server │          │  - Forwards to backend   │
│  - Can mutate DB  │          └──────────┬───────────────┘
│   directly        │                     │
└────────┬─────────┘                     │
         │                               │
         ▼                               ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND API (FastAPI)                        │
│  POST /api/v1/chat/stream                                 │
│  - Authenticates                                           │
│  - Validates input                                         │
│  - Routes to AI Engine                                     │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              AI ENGINE                                     │
│  1. Retrieve conversation history                          │
│  2. Retrieve relevant memories (vector search)             │
│  3. Retrieve knowledge graph entities                      │
│  4. Build prompt with context                              │
│  5. Call AI provider (streaming)                           │
│  6. Process tool calls                                     │
│  7. Stream tokens to client (SSE)                          │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Client Receives SSE │  StreamingMessage component updates
│  (EventSource)       │  token by token
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Message Complete    │  Save to DB, update vector memory
│  (Server Action)     │  Update knowledge graph
└─────────────────────┘
```

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
backend/app/
├── api/
│   ├── v1/
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── chat.py         # Chat & streaming endpoints
│   │   ├── voice.py        # Voice transcription & TTS
│   │   ├── vision.py       # Image analysis
│   │   ├── automation.py   # Workflow CRUD & execution
│   │   ├── memory.py       # Memory operations
│   │   ├── plugins.py      # Plugin management
│   │   ├── knowledge.py    # Knowledge graph CRUD
│   │   ├── research.py     # Deep research
│   │   ├── coding.py       # Code analysis & review
│   │   └── admin.py        # Admin endpoints
│   └── deps.py             # Shared dependencies
├── core/
│   ├── config.py           # Pydantic Settings
│   ├── security.py         # JWT, password hashing, RBAC
│   ├── database.py         # SQLAlchemy engine, sessions
│   └── redis.py            # Redis client
├── models/                 # SQLAlchemy ORM models
│   ├── user.py
│   ├── conversation.py
│   ├── message.py
│   ├── memory.py
│   ├── knowledge.py
│   ├── automation.py
│   ├── plugin.py
│   └── audit_log.py
├── schemas/                # Pydantic request/response
│   ├── auth.py
│   ├── chat.py
│   ├── user.py
│   └── ...
├── services/               # Business logic layer
│   ├── auth_service.py
│   ├── chat_service.py
│   ├── memory_service.py
│   ├── knowledge_service.py
│   ├── plugin_service.py
│   └── ...
├── ai/                     # AI Engine
│   ├── engine.py           # Main orchestration
│   ├── providers.py        # AI provider abstractions
│   ├── streaming.py        # SSE streaming utilities
│   ├── tools/              # Tool definitions
│   │   ├── web_search.py
│   │   ├── calculator.py
│   │   ├── code_executor.py
│   │   └── ...
│   └── agents/             # Specialized agents
│       ├── base.py
│       ├── research_agent.py
│       ├── coding_agent.py
│       └── ...
├── plugins/                # Plugin system
│   ├── base.py             # BasePlugin class
│   ├── manager.py          # Plugin lifecycle manager
│   ├── registry.py         # Plugin registry
│   └── sandbox.py          # Secure execution sandbox
├── ws/                     # WebSocket handlers
│   ├── chat.py
│   └── manager.py
├── workers/                # Celery tasks
│   └── tasks.py
├── main.py                 # FastAPI application factory
└── exceptions.py           # Custom exceptions & handlers
```

### 3.2 Three-Layer Architecture

Each feature follows a strict **Route → Service → Model** pattern:

```
┌────────────────────────────────────────────────────────────────────────┐
│  ROUTE LAYER (api/v1/*.py)                                            │
│                                                                        │
│  Responsibility:                                                       │
│  - HTTP method & path definition                                       │
│  - Request validation (via Pydantic schemas)                           │
│  - Response serialization                                              │
│  - Authentication via dependency injection                            │
│  - Authorization checks                                                │
│  - No business logic                                                   │
│                                                                        │
│  Example:                                                              │
│  @router.post("/chat/conversations", response_model=ConversationOut)  │
│  async def create_conversation(                                       │
│      data: ConversationCreate,                                         │
│      user: User = Depends(get_current_user),                          │
│      chat_service: ChatService = Depends(get_chat_service),           │
│  ):                                                                   │
│      return await chat_service.create_conversation(user.id, data)     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER (services/*.py)                                        │
│                                                                        │
│  Responsibility:                                                       │
│  - Business logic orchestration                                       │
│  - Cross-cutting concerns (logging, audit)                            │
│  - Calling other services or AI engine                                │
│  - Transaction management                                              │
│  - Error handling / raising HTTPException                             │
│  - No HTTP knowledge                                                   │
│                                                                        │
│  Example:                                                              │
│  class ChatService:                                                    │
│     async def create_conversation(                                    │
│         self, user_id: UUID, data: ConversationCreate                 │
│     ) -> Conversation:                                                │
│         # Business logic here                                          │
│         conversation = Conversation(user_id=user_id, ...)              │
│         db.add(conversation)                                           │
│         await db.commit()                                              │
│         return conversation                                            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  MODEL LAYER (models/*.py)                                            │
│                                                                        │
│  Responsibility:                                                       │
│  - SQLAlchemy ORM definitions                                         │
│  - Relationships and constraints                                      │
│  - Index definitions                                                   │
│  - Column types and defaults                                          │
│  - No business logic                                                   │
│                                                                        │
│  Example:                                                              │
│  class Conversation(Base):                                             │
│      __tablename__ = "conversations"                                  │
│      id = Column(UUID, primary_key=True, default=uuid4)               │
│      user_id = Column(UUID, ForeignKey("users.id"), nullable=False)   │
│      title = Column(String(255))                                       │
│      created_at = Column(DateTime, default=func.now())                │
│      messages = relationship("Message", back_populates="conversation")│
└────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Dependency Injection

FastAPI's `Depends` is used for clean DI. All dependencies are wired in `api/deps.py`:

```python
# api/deps.py

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    # Validate JWT, return user
    ...

async def get_chat_service(
    db: AsyncSession = Depends(get_db),
    memory_service: MemoryService = Depends(get_memory_service),
    ai_engine: AIEngine = Depends(get_ai_engine),
) -> ChatService:
    return ChatService(db=db, memory_service=memory_service, ai_engine=ai_engine)

async def get_ai_engine(
    db: AsyncSession = Depends(get_db),
    plugin_manager: PluginManager = Depends(get_plugin_manager),
) -> AIEngine:
    return AIEngine(db=db, plugin_manager=plugin_manager)
```

This makes services:
- **Testable** — each service can be mocked independently
- **Replaceable** — swap implementations without changing routes
- **Composable** — services compose via constructor injection

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram (Text)

```
┌──────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│      users       │       │     conversations     │       │     messages     │
├──────────────────┤       ├──────────────────────┤       ├──────────────────┤
│ id (UUID) PK     │──┐    │ id (UUID) PK         │──┐    │ id (UUID) PK     │
│ email (str)      │  │    │ user_id (UUID) FK ────┼──┘    │ conv_id (UUID)   │
│ password_hash    │  │    │ title (str)           │       │  FK ────────────┼──┐
│ display_name     │  │    │ model (str)           │       │ role (enum)     │  │
│ avatar_url       │  │    │ system_prompt (text)  │       │ content (text)  │  │
│ role (enum)      │  │    │ metadata (jsonb)      │       │ tokens (int)    │  │
│ is_active (bool) │  │    │ created_at (ts)       │       │ tool_calls (jb) │  │
│ preferences (jb) │  │    │ updated_at (ts)       │       │ created_at (ts) │  │
│ created_at       │  │    └──────────────────────┘       └──────────────────┘  │
│ updated_at       │  │                                                        │
└──────────────────┘  │       ┌──────────────────────┐                          │
                      │       │        memories       │                        │
                      │       ├──────────────────────┤                        │
                      │       │ id (UUID) PK         │                        │
                      │       │ user_id (UUID) FK ────┼────────────────────────┘
                      │       │ type (enum)           │
                      │       │ content (text)        │
                      │       │ embedding (vector)    │
                      │       │ metadata (jsonb)      │
                      │       │ importance (float)    │
                      │       │ expires_at (ts)       │
                      │       │ created_at (ts)       │
                      │       └──────────────────────┘
                      │
  ┌───────────────────┼──────────────────────────────────────────────────────┐
  │                   │                                                      │
  ▼                   ▼                                                      │
┌──────────────┐  ┌──────────────────────┐       ┌──────────────────────┐    │
│  user_sessions│  │   knowledge_entities  │       │ knowledge_relations   │    │
├──────────────┤  ├──────────────────────┤       ├──────────────────────┤    │
│ id (UUID) PK │  │ id (UUID) PK         │──┐    │ id (UUID) PK         │    │
│ user_id FK   │  │ user_id (UUID) FK ────┼──┼────│ source_id (UUID) FK │    │
│ refresh_token│  │ name (str)            │  │    │ target_id (UUID) FK │    │
│ expires_at   │  │ type (str)            │  │    │ relation_type (str) │    │
│ ip_address   │  │ description (text)    │  │    │ properties (jsonb)  │    │
│ user_agent   │  │ properties (jsonb)    │  │    │ created_at          │    │
│ created_at   │  │ created_at            │  │    └──────────────────────┘    │
└──────────────┘  │ updated_at            │  │                               │
                  └──────────────────────┘  │                               │
                                            │                               │
  ┌──────────────────────┐                  │                               │
  │     automations      │                  │                               │
  ├──────────────────────┤                  │                               │
  │ id (UUID) PK         │                  │                               │
  │ user_id (UUID) FK ───┼──────────────────┼───────────────────────────────┘
  │ name (str)           │                  │
  │ description (text)   │                  │
  │ trigger (jsonb)      │                  │
  │ steps (jsonb)        │                  │
  │ is_active (bool)     │                  │
  │ schedule (jsonb)     │                  │
  │ last_run (ts)        │                  │
  │ created_at           │                  │
  │ updated_at           │                  │
  └──────────────────────┘                  │
                                            │
  ┌──────────────────────┐                  │
  │  automation_logs     │                  │
  ├──────────────────────┤                  │
  │ id (UUID) PK         │                  │
  │ automation_id FK     │                  │
  │ status (enum)        │                  │
  │ result (jsonb)       │                  │
  │ error (text)         │                  │
  │ started_at           │                  │
  │ completed_at         │                  │
  └──────────────────────┘                  │
                                            │
  ┌──────────────────────────┐              │
  │        plugins           │              │
  ├──────────────────────────┤              │
  │ id (UUID) PK             │              │
  │ user_id (UUID) FK ───────┼──────────────┘
  │ name (str)               │
  │ version (str)            │
  │ description (text)       │
  │ author (str)             │
  │ source (str)             │
  │ config (jsonb)           │
  │ is_active (bool)         │
  │ is_official (bool)       │
  │ permissions (jsonb)      │
  │ created_at               │
  │ updated_at               │
  └──────────────────────────┘
```

### 4.2 Table Descriptions

| Table                | Description                                              | Rows (est.) |
| -------------------- | -------------------------------------------------------- | ----------- |
| `users`              | User accounts with roles and preferences                 | 10K         |
| `user_sessions`      | Refresh token storage for session management             | 50K         |
| `conversations`      | Chat conversation threads                                | 500K        |
| `messages`           | Individual messages within conversations                 | 50M         |
| `memories`           | Vector-stored long-term memories with embeddings         | 10M         |
| `knowledge_entities`  | Nodes in the knowledge graph                             | 1M          |
| `knowledge_relations` | Edges connecting knowledge graph nodes                  | 5M          |
| `automations`        | User-defined automation workflows                        | 50K         |
| `automation_logs`    | Execution history for automations                        | 5M          |
| `plugins`            | Installed plugins per user                               | 20K         |
| `audit_logs`         | Security and compliance audit trail                      | 10M         |

### 4.3 Key Relationships

- `users` 1→N `conversations` — A user can have many conversations
- `conversations` 1→N `messages` — A conversation contains many messages
- `users` 1→N `memories` — Memories belong to a user
- `users` 1→N `knowledge_entities` — Entities are user-scoped
- `knowledge_entities` N→M `knowledge_entities` via `knowledge_relations` — Graph structure
- `users` 1→N `automations` — Automations belong to a user
- `users` 1→N `plugins` — Each user has their own plugin instances

### 4.4 Indexing Strategy

```sql
-- Primary indexes (auto-created on PKs)
-- Foreign key indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_knowledge_entities_user_id ON knowledge_entities(user_id);
CREATE INDEX idx_knowledge_relations_source ON knowledge_relations(source_id);
CREATE INDEX idx_knowledge_relations_target ON knowledge_relations(target_id);
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_plugins_user_id ON plugins(user_id);

-- Functional indexes
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_users_email ON users(email);

-- Full-text search
CREATE INDEX idx_messages_content_fts ON messages
  USING GIN(to_tsvector('english', content));

-- Vector index (pgvector)
CREATE INDEX idx_memories_embedding ON memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 5. AI Integration

### 5.1 Agent Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          AI ENGINE (ai/engine.py)                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        PROMPT BUILDER                                │  │
│  │  - System prompt with personality                                    │  │
│  │  - Conversation history (sliding window)                             │  │
│  │  - Retrieved memories (RAG)                                          │  │
│  │  - Knowledge graph context                                           │  │
│  │  - Available tool definitions                                        │  │
│  │  - User preferences & settings                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         ROUTER                                       │  │
│  │  - Classifies intent (chat, code, research, vision, etc.)            │  │
│  │  - Routes to specialized agent if needed                             │  │
│  │  - Falls through to general chat agent                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        ▼                           ▼                           ▼            │
│  ┌────────────┐            ┌──────────────┐          ┌──────────────┐      │
│  │Chat Agent  │            │Research Agent│          │ Coding Agent │      │
│  │            │            │              │          │              │      │
│  │- Contextual│            │- Web search  │          │- Code review │      │
│  │- Tool using│            │- Source agg  │          │- Refactoring │      │
│  │- Streaming │            │- Citation    │          │- Generation  │      │
│  └────────────┘            └──────────────┘          └──────────────┘      │
│        │                           │                           │            │
│        └───────────────────────────┼───────────────────────────┘            │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PROVIDER LAYER (ai/providers.py)                │  │
│  │                                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │ OpenAI   │  │Anthropic │  │ Google   │  │  Ollama  │  │ Custom │ │  │
│  │  │ (GPT-4o) │  │(Claude 4)│  │(Gemini 2)│  │ (Local)  │  │ (Ext)  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  │                                                                       │  │
│  │  - Unified interface via BaseProvider                                 │  │
│  │  - Automatic retry with exponential backoff                          │  │
│  │  - Token usage tracking                                               │  │
│  │  - Cost estimation                                                   │  │
│  │  - Fallback chain (primary → secondary → tertiary)                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      TOOL EXECUTOR (ai/tools/)                       │  │
│  │                                                                       │  │
│  │  Tools available to agents:                                           │  │
│  │  - web_search(url, query)     - Knowledge graph query                │  │
│  │  - calculator(expression)     - Memory store/retrieve                │  │
│  │  - code_interpreter(code)     - Image analysis                       │  │
│  │  - file_read(path)            - File write(path, content)            │  │
│  │  - plugin_execute(plugin, ...) - Database query                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      STREAMING MANAGER                               │  │
│  │                                                                       │  │
│  │  1. Token-by-token streaming via SSE                                  │  │
│  │  2. Tool call interception & execution                                │  │
│  │  3. Token usage accumulation                                         │  │
│  │  4. Error handling and graceful degradation                          │  │
│  │  5. Client disconnection handling                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Streaming Protocol

```
CLIENT                          BACKEND                       AI PROVIDER
  │                                │                               │
  │  POST /api/v1/chat/stream     │                               │
  │  { message, conversation_id } │                               │
  │─────────────────────────────▶│                               │
  │                                │                               │
  │  202 Accepted                 │                               │
  │  Content-Type: text/event-stream                               │
  │◀─────────────────────────────│                               │
  │                                │                               │
  │  event: token                 │                               │
  │  data: "Hello"               │                               │
  │◀─────────────────────────────│──────────────────────────────▶│
  │                                │  Stream request              │
  │  event: token                  │◀────────────────────────────│
  │  data: " world"               │                               │
  │◀─────────────────────────────│──────────────────────────────▶│
  │                                │  Token stream                │
  │  event: tool_call             │                               │
  │  data: {"name":"web_search",  │                               │
  │         "args":{"q":"..."}}   │                               │
  │◀─────────────────────────────│                               │
  │                                │                               │
  │  Execute tool...              │                               │
  │                                │                               │
  │  event: tool_result           │                               │
  │  data: {"result": "..."}      │                               │
  │─────────────────────────────▶│                               │
  │                                │                               │
  │  event: token                 │                               │
  │  data: "Based on..."          │                               │
  │◀─────────────────────────────│──────────────────────────────▶│
  │                                │                               │
  │  event: done                  │                               │
  │  data: {"usage": {...}}       │                               │
  │◀─────────────────────────────│                               │
  │                                │                               │
```

### 5.3 Memory-Augmented Generation (RAG)

```
USER QUERY
    │
    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. QUERY TRANSFORMATION                                                    │
│    - Generate multiple search queries from the user's message              │
│    - Extract key entities and concepts                                     │
│    - Classify query type (factual, creative, analytical, etc.)            │
└────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 2. HYBRID RETRIEVAL                                                        │
│    ┌──────────────────────────────┐  ┌──────────────────────────────────┐  │
│    │ VECTOR SEARCH (pgvector)      │  │ KEYWORD SEARCH (full-text)       │  │
│    │ - Embed query with text-     │  │ - to_tsquery on memories.content │  │
│    │   embedding-3-small          │  │ - Exact phrase matching          │  │
│    │ - Cosine similarity search   │  │ - BM25 ranking                   │  │
│    │ - Top-K (default: 5)         │  │ - Top-K (default: 3)             │  │
│    └──────────────────────────────┘  └──────────────────────────────────┘  │
│    │                                                                       │
│    ▼                                                                       │
│    ┌────────────────────────────────────────────────────────────────────┐  │
│    │ RERANKER (cross-encoder)                                          │  │
│    │ - Rerank combined results by relevance to query                   │  │
│    │ - Keep top-N results (default: 5)                                 │  │
│    └────────────────────────────────────────────────────────────────────┘  │
│    │                                                                       │
│    ▼                                                                       │
│    ┌────────────────────────────────────────────────────────────────────┐  │
│    Apply importance weighting: recent + high-importance memories        │  │
│    boosted in ranking                                                    │  │
└────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 3. CONTEXT ASSEMBLY                                                        │
│    - Retrieved memories as "Relevant memories" section                     │
│    - Knowledge graph entities as "Known entities" section                 │
│    - Conversation history (last N messages, truncated to token limit)     │
│    - Tool definitions                                                     │
│    - User preferences & system prompt                                     │
└────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 4. PROMPT EXECUTION                                                        │
│    - Send assembled prompt + context to AI provider                       │
│    - Stream response back to client                                       │
│    - Extract and store new memories after response                        │
│    - Update knowledge graph with new entities                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Plugin System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         PLUGIN SYSTEM                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN MANAGER (manager.py)                     │  │
│  │                                                                       │  │
│  │  Responsibilities:                                                    │  │
│  │  - Load/unload plugins from directory                                │  │
│  │  - Manage plugin lifecycle (init → activate → deactivate → cleanup)  │  │
│  │  - Route tool calls to appropriate plugin                            │  │
│  │  - Enforce permissions and sandboxing                                │  │
│  │  - Cache plugin instances for performance                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN REGISTRY (registry.py)                   │  │
│  │                                                                       │  │
│  │  - Maintains manifest of all available plugins                       │  │
│  │  - Handles plugin discovery and metadata                             │  │
│  │  - Plugin marketplace integration                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN SANDBOX (sandbox.py)                     │  │
│  │                                                                       │  │
│  │  - Subprocess execution with resource limits                         │  │
│  │  - Restricted filesystem access (tmpfs chroot)                       │  │
│  │  - Network access control (allow/deny lists)                         │  │
│  │  - Timeout enforcement                                               │  │
│  │  - Memory limits                                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN INSTANCES                                │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ WeatherPlugin │  │ TodoPlugin   │  │ CustomPlugin │  ...         │  │
│  │  │ (active)      │  │ (active)     │  │ (inactive)   │               │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Each plugin:                                                               │
│  - Inherits from BasePlugin                                                │
│  - Provides a manifest.json (or dict)                                      │
│  - Defines actions that can be called by the AI or user                    │
│  - Has access to limited plugin API (memory, knowledge, etc.)              │
└────────────────────────────────────────────────────────────────────────────┘
```

### Plugin Data Flow

```
USER / AI
    │
    ▼
┌─────────────┐
│  Plugin      │  "Execute action: weather.get_forecast(lat, lon)"
│  Manager     │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  PERMISSION CHECK                                                           │
│  - Does the plugin have permission to access network?                      │
│  - Does the user have permission to use this plugin?                      │
│  - Is the action within rate limits?                                       │
└────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  SANDBOX EXECUTION                                                          │
│  - Spawn subprocess (if untrusted) or call directly (if official)          │
│  - Inject plugin API context                                               │
│  - Execute action with provided arguments                                  │
│  - Collect result (with timeout)                                           │
└────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  RESULT PROCESSING                                                          │
│  - Serialize result to JSON                                                │
│  - Log execution for audit                                                 │
│  - Return to caller (AI or user)                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌──────────┐         ┌──────────────────┐         ┌────────────┐
│  Client  │         │   Next.js (BFF)  │         │   Backend  │
└────┬─────┘         └────────┬─────────┘         └──────┬─────┘
     │                        │                          │
     │  POST /api/auth/login  │                          │
     │  {email, password}     │                          │
     │──────────────────────▶│                          │
     │                        │  POST /api/v1/auth/login │
     │                        │─────────────────────────▶│
     │                        │                          │
     │                        │     { access_token,       │
     │                        │       refresh_token }     │
     │                        │◀─────────────────────────│
     │                        │                          │
     │  Set httpOnly cookie   │                          │
     │  (access_token)        │                          │
     │  Set same-site cookie  │                          │
     │  (refresh_token)       │                          │
     │◀──────────────────────│                          │
     │                        │                          │
     │  POST /api/chat/stream │                          │
     │  Cookie: access_token  │                          │
     │──────────────────────▶│                          │
     │                        │  GET /api/v1/auth/me     │
     │                        │  Authorization: Bearer   │
     │                        │─────────────────────────▶│
     │                        │                          │
     │                        │        { user }          │
     │                        │◀─────────────────────────│
     │                        │                          │
     │                        │  Forward to chat service │
     │◀──────────────────────│                          │
     │  SSE: tokens...       │                          │
```

### 7.2 JWT Token Strategy

| Property              | Access Token            | Refresh Token             |
| --------------------- | ----------------------- | ------------------------- |
| **Location**          | httpOnly cookie (BFF)   | httpOnly cookie (BFF)     |
| **Lifetime**          | 30 minutes              | 7 days                    |
| **Storage (server)**  | Not stored (stateless)  | Hashed in `user_sessions` |
| **Rotation**          | N/A                     | Rotation on each refresh  |
| **Revocation**        | By short TTL            | By deleting session       |

### 7.3 Role-Based Access Control

```python
class UserRole(enum.Enum):
    ADMIN = "admin"       # Full system access
    USER = "user"         # Standard user access
    VIEWER = "viewer"     # Read-only access

# Permission matrix
PERMISSIONS = {
    "users:read":    [ADMIN, USER, VIEWER],
    "users:write":   [ADMIN, USER],
    "users:delete":  [ADMIN],
    "chat:read":     [ADMIN, USER, VIEWER],
    "chat:write":    [ADMIN, USER],
    "admin:read":    [ADMIN],
    "admin:write":   [ADMIN],
    "plugins:install":[ADMIN, USER],
    "system:config": [ADMIN],
}
```

### 7.4 Data Encryption

| Data at Rest              | Encryption Method                     |
| ------------------------- | ------------------------------------- |
| Passwords                 | bcrypt (cost=12)                      |
| Refresh tokens (DB)       | SHA-256 hashed                        |
| User secrets (API keys)   | AES-256-GCM with per-user key         |
| Database (disk)           | PostgreSQL TDE / disk encryption      |
| File uploads (S3)         | Server-side encryption (AES-256)      |
| AI provider API keys      | Hashicorp Vault / environment         |

### 7.5 API Security

```python
# Rate limiting (per user + per route)
class RateLimitConfig:
    DEFAULT = "100/minute"
    CHAT = "30/minute"
    VOICE = "20/minute"
    VISION = "10/minute"
    AUTH = "5/minute"  # Login attempts
    PLUGIN_EXEC = "60/minute"

# CORS configuration
cors_origins = [
    "http://localhost:3000",
    "https://your-app.vercel.app",
    "https://your-custom-domain.com",
]

# Security headers (via middleware)
SecurityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; ...",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}
```

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    │  (nginx)     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Next.js      │ │ Next.js      │ │ Next.js      │
  │ Instance 1   │ │ Instance 2   │ │ Instance N   │
  └──────────────┘ └──────────────┘ └──────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ FastAPI      │ │ FastAPI      │ │ FastAPI      │
  │ Instance 1   │ │ Instance 2   │ │ Instance N   │
  └──────────────┘ └──────────────┘ └──────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ PostgreSQL   │ │  Redis       │ │  Celery      │
  │ (Primary)    │ │  (Cluster)   │ │  Workers     │
  │  + Replicas  │ │              │ │  (Auto-scale)│
  └──────────────┘ └──────────────┘ └──────────────┘
```

### 8.2 Bottlenecks & Mitigations

| Bottleneck           | Mitigation                                                       |
| -------------------- | ---------------------------------------------------------------- |
| **AI API latency**   | Streaming responses, parallel tool calls, response caching       |
| **Database writes**   | Connection pooling (pgbouncer), write batching, async session    |
| **Vector search**    | pgvector IVFFlat indexes, Qdrant for dedicated vector DB         |
| **WebSocket scaling**| Redis Pub/Sub for cross-instance message relay                  |
| **File uploads**     | Direct-to-S3 uploads, signed URLs                               |
| **Plugin execution** | Sandboxed subprocess, resource limits, timeout enforcement       |
| **Memory usage**     | LRU cache for conversation context, streaming to disk for large |
| **Token usage costs**| Caching common responses, cheaper model for simple queries      |

### 8.3 Caching Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CACHE LAYERS                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  L1: IN-MEMORY (Python dict / lru_cache)                             │  │
│  │  - TTL: seconds                                                       │  │
│  │  - Use: Config values, plugin manifests, provider responses          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  L2: REDIS                                                           │  │
│  │  - TTL: minutes                                                      │  │
│  │  - Use: User sessions, rate limits, job queues, conversation cache  │  │
│  │  - Data structures: String, List, Set, SortedSet, Pub/Sub           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  L3: DATABASE / CDN                                                  │  │
│  │  - TTL: hours / permanent                                            │  │
│  │  - Use: User profiles, conversation history, file assets (CDN)      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Database Scaling

| Stage    | Setup                                          |
| -------- | ---------------------------------------------- |
| **Dev**  | Single PostgreSQL instance                     |
| **Start**| PostgreSQL + pgBouncer (connection pooling)    |
| **Growth**| Read replicas for query offloading            |
| **Scale**| Sharding by user_id, dedicated vector DB      |
| **Enterprise**| CockroachDB / Yugabyte for distributed SQL  |

---

*This document is maintained by the JARVIS X core team. For questions, open an issue on GitHub or contact the architecture team.*
