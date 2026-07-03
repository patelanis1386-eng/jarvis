# API Reference — JARVIS X

> **Base URL:** `http://localhost:8000/api/v1` (dev) or `https://your-domain.com/api/v1` (prod)  
> **WebSocket URL:** `ws://localhost:8000/ws` (dev) or `wss://your-domain.com/ws` (prod)  
> **Content-Type:** `application/json`  
> **Authorization:** `Bearer <access_token>` (unless noted)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Chat](#3-chat)
4. [Voice](#4-voice)
5. [Vision](#5-vision)
6. [Automation](#6-automation)
7. [Memory](#7-memory)
8. [Plugins](#8-plugins)
9. [Knowledge](#9-knowledge)
10. [Research](#10-research)
11. [Coding](#11-coding)
12. [Admin](#12-admin)
13. [WebSocket Events](#13-websocket-events)
14. [Rate Limiting](#14-rate-limiting)
15. [Error Codes](#15-error-codes)

---

## 1. Authentication

### POST /auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "display_name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "role": "user",
  "created_at": "2026-07-04T12:00:00Z"
}
```

### POST /auth/login

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user"
  }
}
```

### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "bmV3IHJlZnJl...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### POST /auth/logout

Invalidate the refresh token.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

### GET /auth/me

Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "role": "user",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "ai_model": "gpt-4o",
    "voice_speed": 1.0
  },
  "created_at": "2026-07-04T12:00:00Z",
  "updated_at": "2026-07-04T12:00:00Z"
}
```

### POST /auth/forgot-password

Send password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

### POST /auth/reset-password

Reset password with token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecureP@ss456"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

## 2. Users

### GET /users/:id

Get user profile by ID. **Requires:** `Auth` or `Admin`

### PATCH /users/:id

Update user profile.

**Request:**
```json
{
  "display_name": "Jane Doe",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### PATCH /users/:id/preferences

Update user preferences.

**Request:**
```json
{
  "theme": "light",
  "voice_speed": 1.25,
  "ai_model": "claude-4"
}
```

### DELETE /users/:id

Delete user account. **Requires:** `Auth` (own) or `Admin`

### GET /users/:id/sessions

List active sessions for a user.

### DELETE /users/:id/sessions/:sessionId

Revoke a specific session.

---

## 3. Chat

### GET /chat/conversations

List conversations for the authenticated user.

**Query Parameters:**
| Param  | Type   | Default | Description               |
| ------ | ------ | ------- | ------------------------- |
| `skip` | int    | 0       | Pagination offset         |
| `limit`| int    | 50      | Max results per page      |
| `q`    | string | -       | Search by title           |

**Response (200):**
```json
{
  "items": [
    {
      "id": "conv-uuid-1",
      "title": "Project planning discussion",
      "model": "gpt-4o",
      "message_count": 12,
      "last_message_at": "2026-07-04T14:30:00Z",
      "created_at": "2026-07-01T10:00:00Z"
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 50
}
```

### POST /chat/conversations

Create a new conversation.

**Request:**
```json
{
  "title": "New conversation",
  "model": "gpt-4o",
  "system_prompt": "You are a helpful assistant."
}
```

### GET /chat/conversations/:id

Get conversation details including messages.

### DELETE /chat/conversations/:id

Delete a conversation and all its messages.

### PATCH /chat/conversations/:id

Update conversation metadata.

### POST /chat/stream

Send a message and stream the AI response.

**Request:**
```json
{
  "conversation_id": "conv-uuid-1",
  "message": "What is the weather in Tokyo?",
  "attachments": ["file-uuid-1"],
  "stream": true
}
```

**Response (200) — SSE Stream:**
```
event: token
data: {"token": "The", "index": 0}

event: token
data: {"token": " weather", "index": 1}

event: tool_call
data: {"id": "call_123", "tool": "get_weather", "args": {"location": "Tokyo"}}

event: tool_result
data: {"id": "call_123", "result": {"temp": 28, "condition": "sunny"}}

event: token
data: {"token": " in", "index": 2}

event: done
data: {"message_id": "msg-uuid", "usage": {"prompt_tokens": 150, "completion_tokens": 42}}
```

### GET /chat/conversations/:id/messages

Get paginated messages for a conversation.

### GET /chat/conversations/:id/search

Search within a conversation.

**Query Parameters:** `q` (string, required)

---

## 4. Voice

### POST /voice/transcribe

Transcribe audio to text.

**Request:** `multipart/form-data`
| Field   | Type | Description                     |
| ------- | ---- | ------------------------------- |
| `audio` | file | Audio file (wav, mp3, m4a, ogg) |
| `model` | str  | Transcription model (default: `whisper-1`) |
| `language` | str | Language code (optional, auto-detected) |

**Response (200):**
```json
{
  "text": "Hello, what is the weather today?",
  "language": "en",
  "duration_seconds": 2.5,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, what is the weather today?",
      "confidence": 0.98
    }
  ]
}
```

### POST /voice/synthesize

Convert text to speech.

**Request:**
```json
{
  "text": "Hello, I am JARVIS X. How can I help you today?",
  "voice": "nova",
  "model": "tts-1-hd",
  "speed": 1.0
}
```

**Response (200):** Audio file (`audio/mpeg`)

### POST /voice/stream

Streaming text-to-speech (SSE).

**Request:**
```json
{
  "text": "Long text that will be streamed...",
  "voice": "nova",
  "stream": true
}
```

**Response:** SSE stream with `audio` events containing base64-encoded audio chunks.

### GET /voice/voices

List available voices.

**Response (200):**
```json
{
  "voices": [
    {"id": "nova", "name": "Nova", "gender": "female", "preview_url": "..."},
    {"id": "onyx", "name": "Onyx", "gender": "male", "preview_url": "..."}
  ]
}
```

---

## 5. Vision

### POST /vision/analyze

Analyze an image with AI.

**Request:** `multipart/form-data`
| Field   | Type | Description                     |
| ------- | ---- | ------------------------------- |
| `image` | file | Image file (jpg, png, webp, gif) |
| `prompt`| str  | Analysis prompt (optional)      |
| `detail`| str  | `low` or `high` (default: `auto`) |

**Response (200):**
```json
{
  "description": "A sunny beach with palm trees and people swimming.",
  "objects": [
    {"label": "palm tree", "confidence": 0.95, "bbox": [100, 50, 200, 300]},
    {"label": "person", "confidence": 0.89, "bbox": [300, 200, 350, 400]},
    {"label": "umbrella", "confidence": 0.92, "bbox": [150, 180, 200, 280]}
  ],
  "ocr": {"text": "COCONUT BEACH", "confidence": 0.99, "bbox": [400, 100, 600, 150]},
  "labels": ["beach", "ocean", "palm tree", "summer"],
  "colors": {"dominant": ["#87CEEB", "#F4A460", "#228B22"]}
}
```

### POST /vision/ocr

Extract text from image (OCR-only).

**Response (200):**
```json
{
  "text": "Extracted text content...",
  "confidence": 0.97,
  "blocks": [
    {"text": "Line 1", "bbox": [10, 10, 200, 30], "confidence": 0.99},
    {"text": "Line 2", "bbox": [10, 35, 150, 55], "confidence": 0.95}
  ]
}
```

### POST /vision/detect

Object detection only (faster, no description).

### POST /vision/compare

Compare two images.

**Request:** `multipart/form-data` (two images: `image_a`, `image_b`)

**Response (200):**
```json
{
  "similarity_score": 0.72,
  "differences": ["Different background color", "Object A missing in image B"]
}
```

---

## 6. Automation

### GET /automation/workflows

List automation workflows.

### POST /automation/workflows

Create a new automation workflow.

**Request:**
```json
{
  "name": "Daily News Briefing",
  "description": "Fetches top news and summarizes each morning",
  "trigger": {
    "type": "schedule",
    "config": {
      "cron": "0 7 * * *",
      "timezone": "America/New_York"
    }
  },
  "steps": [
    {
      "id": "step-1",
      "type": "action",
      "name": "Fetch News",
      "action": "web_search",
      "params": {"query": "top news today", "count": 5}
    },
    {
      "id": "step-2",
      "type": "action",
      "name": "Summarize",
      "action": "ai_complete",
      "params": {"prompt": "Summarize these articles: {{steps.step-1.result}}"}
    },
    {
      "id": "step-3",
      "type": "action",
      "name": "Send Email",
      "action": "send_email",
      "params": {
        "to": "user@example.com",
        "subject": "Daily Briefing",
        "body": "{{steps.step-2.result}}"
      }
    }
  ],
  "is_active": true
}
```

**Response (201):**
```json
{
  "id": "auto-uuid",
  "name": "Daily News Briefing",
  "is_active": true,
  "created_at": "2026-07-04T12:00:00Z"
}
```

### GET /automation/workflows/:id

Get workflow details.

### PATCH /automation/workflows/:id

Update workflow.

### DELETE /automation/workflows/:id

Delete workflow.

### POST /automation/workflows/:id/execute

Trigger manual execution.

### POST /automation/workflows/:id/toggle

Toggle active/inactive.

### GET /automation/workflows/:id/logs

Get execution logs.

**Response (200):**
```json
{
  "items": [
    {
      "id": "log-uuid",
      "status": "success",
      "started_at": "2026-07-04T07:00:00Z",
      "completed_at": "2026-07-04T07:00:05Z",
      "steps": [
        {"id": "step-1", "status": "success", "duration_ms": 1200},
        {"id": "step-2", "status": "success", "duration_ms": 3000},
        {"id": "step-3", "status": "success", "duration_ms": 800}
      ]
    }
  ],
  "total": 30
}
```

### GET /automation/templates

List workflow templates.

---

## 7. Memory

### POST /memory/store

Store a new memory.

**Request:**
```json
{
  "content": "User mentioned they love hiking in the Rocky Mountains.",
  "type": "explicit",
  "importance": 0.8,
  "metadata": {
    "source": "conversation",
    "conversation_id": "conv-uuid",
    "tags": ["hiking", "travel", "preferences"]
  }
}
```

**Response (201):**
```json
{
  "id": "mem-uuid",
  "content": "User mentioned they love hiking in the Rocky Mountains.",
  "type": "explicit",
  "importance": 0.8,
  "created_at": "2026-07-04T12:00:00Z"
}
```

### POST /memory/search

Search memories semantically.

**Request:**
```json
{
  "query": "What does the user like to do outdoors?",
  "limit": 5,
  "min_importance": 0.5,
  "types": ["explicit", "inferred"]
}
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "mem-uuid-1",
      "content": "User mentioned they love hiking in the Rocky Mountains.",
      "similarity": 0.92,
      "importance": 0.8,
      "created_at": "2026-07-04T12:00:00Z"
    },
    {
      "id": "mem-uuid-2",
      "content": "User said they enjoy outdoor activities on weekends.",
      "similarity": 0.78,
      "importance": 0.6,
      "created_at": "2026-07-03T10:00:00Z"
    }
  ]
}
```

### GET /memory/:id

Get a specific memory.

### DELETE /memory/:id

Delete a memory.

### GET /memory/recent

Get recent memories.

**Query Parameters:** `limit` (int, default: 20), `type` (str, optional)

### POST /memory/batch

Batch store multiple memories.

### POST /memory/clear

Clear all memories for the user.

---

## 8. Plugins

### GET /plugins/marketplace

List available plugins in the marketplace.

**Query Parameters:** `q` (search), `category`, `sort` (downloads, rating, newest)

**Response (200):**
```json
{
  "items": [
    {
      "id": "plugin-weather",
      "name": "Weather Pro",
      "description": "Get real-time weather forecasts and alerts",
      "version": "1.2.0",
      "author": "JARVIS X Official",
      "category": "utilities",
      "downloads": 15000,
      "rating": 4.8,
      "is_official": true
    }
  ],
  "total": 50
}
```

### POST /plugins/install

Install a plugin from the marketplace.

**Request:**
```json
{
  "plugin_id": "plugin-weather",
  "version": "1.2.0",
  "config": {
    "api_key": "user-provided-key",
    "units": "metric"
  }
}
```

### GET /plugins/installed

List installed plugins.

### PATCH /plugins/installed/:id

Update plugin configuration.

### POST /plugins/installed/:id/toggle

Toggle plugin active/inactive.

### DELETE /plugins/installed/:id

Uninstall a plugin.

### POST /plugins/installed/:id/execute

Execute a plugin action.

**Request:**
```json
{
  "action": "get_forecast",
  "params": {
    "lat": 35.6762,
    "lon": 139.6503,
    "days": 3
  }
}
```

**Response (200):**
```json
{
  "result": {
    "location": "Tokyo, Japan",
    "current": {"temp": 28, "condition": "Sunny", "humidity": 65},
    "forecast": [
      {"date": "2026-07-04", "high": 30, "low": 22, "condition": "Sunny"},
      {"date": "2026-07-05", "high": 28, "low": 21, "condition": "Cloudy"},
      {"date": "2026-07-06", "high": 26, "low": 20, "condition": "Rain"}
    ]
  },
  "execution_time_ms": 340
}
```

### POST /plugins/create

Create a custom plugin (advanced users).

**Request:**
```json
{
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "Does something useful",
  "actions": {
    "greet": {
      "description": "Say hello",
      "params": {
        "name": {"type": "string", "required": true}
      }
    }
  },
  "code": "def execute(action, params):\n    if action == 'greet':\n        return {'message': f'Hello, {params[\"name\"]}!'}"
}
```

---

## 9. Knowledge

### GET /knowledge/entities

List knowledge entities.

### POST /knowledge/entities

Create a knowledge entity.

**Request:**
```json
{
  "name": "Albert Einstein",
  "type": "person",
  "description": "Theoretical physicist who developed the theory of relativity.",
  "properties": {
    "born": "1879-03-14",
    "died": "1955-04-18",
    "nationality": "German-American"
  }
}
```

### GET /knowledge/entities/:id

Get entity details with relationships.

**Response (200):**
```json
{
  "id": "entity-uuid",
  "name": "Albert Einstein",
  "type": "person",
  "description": "Theoretical physicist...",
  "properties": {"born": "1879-03-14"},
  "relations": [
    {"target": "Theory of Relativity", "type": "developed", "id": "rel-uuid"},
    {"target": "Nobel Prize", "type": "awarded", "id": "rel-uuid-2"}
  ],
  "created_at": "2026-07-04T12:00:00Z"
}
```

### PATCH /knowledge/entities/:id

Update an entity.

### DELETE /knowledge/entities/:id

Delete an entity (cascades to relations).

### POST /knowledge/relations

Create a relationship between entities.

**Request:**
```json
{
  "source_id": "entity-uuid-1",
  "target_id": "entity-uuid-2",
  "relation_type": "developed",
  "properties": {"year": 1915}
}
```

### GET /knowledge/graph

Get the full knowledge graph or a subgraph.

**Query Parameters:** `depth` (int, default: 2), `root_id` (UUID, optional)

**Response (200):**
```json
{
  "nodes": [
    {"id": "entity-1", "name": "Albert Einstein", "type": "person", "group": 1},
    {"id": "entity-2", "name": "Theory of Relativity", "type": "concept", "group": 2}
  ],
  "edges": [
    {"source": "entity-1", "target": "entity-2", "type": "developed", "label": "developed"}
  ]
}
```

### POST /knowledge/search

Search entities and relations.

**Request:**
```json
{
  "query": "Einstein theories",
  "types": ["person", "concept"],
  "limit": 10
}
```

### POST /knowledge/extract

Extract entities and relations from text.

**Request:**
```json
{
  "text": "Marie Curie discovered radium and polonium. She won two Nobel Prizes."
}
```

**Response (200):**
```json
{
  "entities": [
    {"name": "Marie Curie", "type": "person"},
    {"name": "Radium", "type": "substance"},
    {"name": "Polonium", "type": "substance"},
    {"name": "Nobel Prize", "type": "award"}
  ],
  "relations": [
    {"source": "Marie Curie", "target": "Radium", "type": "discovered"},
    {"source": "Marie Curie", "target": "Polonium", "type": "discovered"},
    {"source": "Marie Curie", "target": "Nobel Prize", "type": "awarded"}
  ]
}
```

---

## 10. Research

### POST /research

Start a deep research task.

**Request:**
```json
{
  "query": "Latest developments in quantum computing 2026",
  "depth": "comprehensive",
  "sources": ["web", "academic", "news"],
  "max_sources": 20
}
```

**Response (201):**
```json
{
  "research_id": "research-uuid",
  "status": "in_progress",
  "created_at": "2026-07-04T12:00:00Z",
  "estimated_time_seconds": 120
}
```

### GET /research/:id

Get research status and results.

**Response (200) — In Progress:**
```json
{
  "id": "research-uuid",
  "status": "in_progress",
  "progress": {
    "sources_found": 12,
    "sources_analyzed": 8,
    "current_step": "Analyzing sources..."
  }
}
```

**Response (200) — Complete:**
```json
{
  "id": "research-uuid",
  "status": "completed",
  "query": "Latest developments in quantum computing 2026",
  "summary": "Quantum computing has seen significant advances...",
  "sections": [
    {
      "heading": "Hardware Developments",
      "content": "Several companies announced...",
      "sources": ["source-1", "source-3"]
    },
    {
      "heading": "Quantum Algorithms",
      "content": "New algorithms for...",
      "sources": ["source-2", "source-4"]
    }
  ],
  "sources": [
    {
      "url": "https://example.com/article-1",
      "title": "Quantum Computing Breakthrough",
      "relevance_score": 0.95,
      "key_findings": ["New 1000-qubit processor", "Error correction milestone"]
    }
  ],
  "citations": [
    "[1] Example Corp, 'Quantum Computing Breakthrough', 2026.",
    "[2] University of Science, 'New Quantum Algorithm', 2026."
  ],
  "completed_at": "2026-07-04T12:02:00Z"
}
```

### POST /research/:id/cancel

Cancel a running research task.

### GET /research/history

List previous research tasks.

### POST /research/:id/export

Export research as a document.

**Request:**
```json
{
  "format": "markdown"
}
```

**Response:** File download.

---

## 11. Coding

### POST /coding/analyze

Analyze source code.

**Request:**
```json
{
  "code": "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)",
  "language": "python",
  "analysis_type": ["complexity", "bugs", "style", "security"]
}
```

**Response (200):**
```json
{
  "language": "python",
  "complexity": {
    "cyclomatic": 3,
    "cognitive": 4,
    "lines": 4,
    "estimated_time": "2 min"
  },
  "bugs": [
    {
      "severity": "warning",
      "message": "Recursive implementation may cause stack overflow for large n",
      "line": 1,
      "suggestion": "Consider iterative or memoized approach"
    }
  ],
  "style": {
    "issues": [
      {"rule": "missing-docstring", "message": "Function missing docstring", "line": 1}
    ],
    "score": 7.5
  },
  "security": {
    "issues": [],
    "score": 10.0
  }
}
```

### POST /coding/generate

Generate code from a description.

**Request:**
```json
{
  "prompt": "Create a REST API endpoint that returns a list of users with pagination",
  "language": "python",
  "framework": "fastapi",
  "include_tests": true,
  "style_guide": "pep8"
}
```

**Response (200):** SSE stream for code generation.

### POST /coding/review

Perform a code review.

**Request:**
```json
{
  "code": "...",
  "language": "typescript",
  "context": "This is a React component for a data table",
  "focus_areas": ["performance", "accessibility", "typescript-strict"]
}
```

**Response (200):**
```json
{
  "summary": "Overall the code is well-structured...",
  "rating": "good",
  "comments": [
    {
      "severity": "major",
      "line": 45,
      "message": "Missing error boundary around async data fetch",
      "suggestion": "Wrap with ErrorBoundary component",
      "code_example": "<ErrorBoundary fallback={<ErrorScreen />}>\n  <DataTable ... />\n</ErrorBoundary>"
    }
  ],
  "score": 8.2,
  "metrics": {
    "maintainability": 8.5,
    "readability": 7.8,
    "performance": 8.0,
    "security": 9.0
  }
}
```

### POST /coding/explain

Explain a piece of code in natural language.

### POST /coding/refactor

Suggest refactoring improvements.

### POST /coding/convert

Convert code between languages.

**Request:**
```json
{
  "code": "def hello(name):\n    return f'Hello, {name}!'",
  "from_language": "python",
  "to_language": "typescript"
}
```

---

## 12. Admin

*All admin endpoints require `role: admin`.*

### GET /admin/users

List all users with pagination and filters.

**Query Parameters:** `skip`, `limit`, `q`, `role`, `is_active`, `sort_by`, `sort_order`

### GET /admin/users/:id

Get detailed user information (including usage stats).

### PATCH /admin/users/:id

Update user (change role, status, etc.).

### DELETE /admin/users/:id

Delete user (admin purge).

### GET /admin/system/health

System health check.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "services": {
    "database": {"status": "healthy", "latency_ms": 2},
    "redis": {"status": "healthy", "latency_ms": 1},
    "qdrant": {"status": "healthy", "latency_ms": 3},
    "celery": {"status": "healthy", "queue_depth": 5}
  }
}
```

### GET /admin/system/stats

System usage statistics.

**Response (200):**
```json
{
  "users": {"total": 1500, "active_today": 320, "new_today": 12},
  "conversations": {"total": 45000, "today": 1200},
  "messages": {"total": 1200000, "today": 35000},
  "storage": {"database_mb": 2560, "uploads_mb": 15360},
  "api_usage": {
    "requests_today": 85000,
    "avg_latency_ms": 240,
    "error_rate": 0.02
  },
  "ai_costs": {
    "today_usd": 45.20,
    "this_month_usd": 1250.00
  }
}
```

### GET /admin/system/logs

Get system logs.

**Query Parameters:** `level` (info, warning, error), `source`, `from_date`, `to_date`, `limit`

### GET /admin/analytics/dashboard

Analytics dashboard data.

**Query Parameters:** `period` (24h, 7d, 30d, 90d)

### GET /admin/plugins

List all plugins across the system.

### POST /admin/plugins/:id/approve

Approve a plugin for the marketplace.

### POST /admin/plugins/:id/ban

Remove a plugin from the marketplace.

### GET /admin/audit-log

Security audit trail.

---

## 13. WebSocket Events

**Connection URL:** `ws://localhost:8000/ws?token=<access_token>`

### Client → Server Events

| Event           | Payload                                       | Description                     |
| --------------- | --------------------------------------------- | ------------------------------- |
| `chat:message`  | `{ conversation_id, message, attachments }`   | Send a chat message             |
| `chat:typing`   | `{ conversation_id, is_typing }`              | Typing indicator                |
| `voice:start`   | `{}`                                          | Start voice streaming           |
| `voice:chunk`   | `{ audio: base64 }`                           | Audio chunk                     |
| `voice:end`     | `{}`                                          | End voice streaming             |
| `ping`          | `{}`                                          | Keepalive ping                  |

### Server → Client Events

| Event              | Payload                                        | Description                          |
| ------------------ | ---------------------------------------------- | ------------------------------------ |
| `chat:token`       | `{ conversation_id, token, index }`            | Streamed token                       |
| `chat:tool_call`   | `{ conversation_id, tool_id, tool, args }`     | AI tool call                         |
| `chat:tool_result` | `{ conversation_id, tool_id, result }`         | Tool execution result                |
| `chat:done`        | `{ conversation_id, message_id, usage }`       | Message complete                     |
| `chat:error`       | `{ conversation_id, error }`                   | Error during processing              |
| `voice:transcript` | `{ text, is_final }`                           | Voice transcription                  |
| `voice:response`   | `{ audio: base64, is_final }`                  | Voice response chunk                 |
| `automation:run`   | `{ automation_id, status }`                    | Automation execution status          |
| `notification`     | `{ type, title, message, data }`               | General notification                 |
| `pong`             | `{}`                                           | Keepalive response                   |
| `error`            | `{ code, message }`                            | WebSocket error                      |

---

## 14. Rate Limiting

Rate limits are applied per user (authenticated) or per IP (unauthenticated).

| Route Group     | Limit (Authenticated) | Limit (Unauthenticated) |
| --------------- | --------------------- | ----------------------- |
| `/auth/*`       | 10/minute             | 5/minute                |
| `/chat/*`       | 30/minute             | 10/minute               |
| `/chat/stream`  | 10/minute             | 2/minute                |
| `/voice/*`      | 20/minute             | 5/minute                |
| `/vision/*`     | 10/minute             | 2/minute                |
| `/memory/*`     | 60/minute             | N/A                     |
| `/plugins/*`    | 30/minute             | 10/minute               |
| `/research/*`   | 5/minute (concurrent: 3) | 1/minute             |
| `/coding/*`     | 20/minute             | 5/minute                |
| `/admin/*`      | 100/minute            | N/A                     |
| **Default**     | 100/minute            | 20/minute               |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701619200
```

**429 Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before retrying.",
    "retry_after_seconds": 45
  }
}
```

---

## 15. Error Codes

| HTTP Code | Error Code                  | Description                               |
| --------- | --------------------------- | ----------------------------------------- |
| 400       | `VALIDATION_ERROR`          | Request body validation failed            |
| 400       | `INVALID_CREDENTIALS`       | Email or password incorrect               |
| 400       | `TOKEN_EXPIRED`             | Refresh token has expired                 |
| 400       | `INVALID_TOKEN`             | Token is malformed or invalid             |
| 401       | `UNAUTHORIZED`              | Missing or invalid authentication         |
| 401       | `TOKEN_EXPIRED`             | Access token expired (refresh needed)    |
| 403       | `FORBIDDEN`                 | Insufficient permissions                  |
| 403       | `INSUFFICIENT_ROLE`         | Role does not have required permission    |
| 404       | `NOT_FOUND`                 | Resource not found                        |
| 404       | `USER_NOT_FOUND`            | User does not exist                       |
| 404       | `CONVERSATION_NOT_FOUND`    | Conversation does not exist               |
| 404       | `PLUGIN_NOT_FOUND`          | Plugin not found                          |
| 409       | `DUPLICATE_EMAIL`           | Email already registered                  |
| 409       | `DUPLICATE_ENTITY`          | Entity already exists                     |
| 409       | `PLUGIN_ALREADY_INSTALLED`  | Plugin is already installed               |
| 422       | `UNPROCESSABLE_ENTITY`      | Semantic error in request                 |
| 429       | `RATE_LIMIT_EXCEEDED`       | Too many requests                         |
| 500       | `INTERNAL_ERROR`            | Unexpected server error                   |
| 502       | `AI_PROVIDER_ERROR`         | AI provider returned an error             |
| 502       | `AI_PROVIDER_TIMEOUT`       | AI provider request timed out             |
| 503       | `SERVICE_UNAVAILABLE`       | System is under maintenance               |
| 507       | `INSUFFICIENT_STORAGE`      | Upload exceeds storage quota              |

**Standard Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_email"
      }
    ],
    "request_id": "req-uuid-12345"
  }
}
```

---

*For additional help, refer to the [Installation Guide](INSTALLATION.md) or open an issue on GitHub.*
