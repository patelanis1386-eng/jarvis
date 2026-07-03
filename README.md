# JARVIS X — AI Operating System

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗    ██╗  ██╗                     ║
║     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝    ╚██╗██╔╝                     ║
║     ██║███████║██████╔╝██║   ██║██║███████╗     ╚███╔╝                      ║
║     ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║     ██╔██╗                      ║
║     ██║██║  ██║██║  ██║ ╚████╔╝ ██║███████║    ██╔╝ ██╗                     ║
║     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝    ╚═╝  ╚═╝                     ║
║                                                                               ║
║     ███████╗██╗  ██╗    █████╗ ██╗    ███████╗██╗   ██╗███████╗████████╗    ║
║     ██╔════╝╚██╗██╔╝   ██╔══██╗██║    ██╔════╝██║   ██║██╔════╝╚══██╔══╝    ║
║     █████╗   ╚███╔╝    ███████║██║    █████╗  ██║   ██║███████╗   ██║       ║
║     ██╔══╝   ██╔██╗    ██╔══██║██║    ██╔══╝  ╚██╗ ██╔╝╚════██║   ██║       ║
║     ███████╗██╔╝ ██╗   ██║  ██║██║    ██║      ╚████╔╝ ███████║   ██║       ║
║     ╚══════╝╚═╝  ╚═╝   ╚═╝  ╚═╝╚═╝    ╚═╝       ╚═══╝  ╚══════╝   ╚═╝       ║
║                                                                               ║
║     ██████╗ ██████╗ ███████╗██████╗  █████╗ ████████╗██╗███╗   ██╗ ██████╗  ║
║     ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝  ║
║     ██████╔╝██████╔╝█████╗  ██████╔╝███████║   ██║   ██║██╔██╗ ██║██║  ███╗ ║
║     ██╔══██╗██╔══██╗██╔══╝  ██╔══██╗██╔══██║   ██║   ██║██║╚██╗██║██║   ██║ ║
║     ██║  ██║██║  ██║███████╗██║  ██║██║  ██║   ██║   ██║██║ ╚████║╚██████╔╝ ║
║     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

> **JARVIS X** is a full-stack AI operating system that combines natural conversation, voice assistance, computer vision, automation, memory, knowledge graphs, and a plugin ecosystem into a unified interface. It serves as the intelligent layer between humans and their digital environments.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![Node](https://img.shields.io/badge/Node-20+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal.svg)](https://fastapi.tiangolo.com)

---

## Screenshots

<!--
![Dashboard](docs/screenshots/dashboard.png)
![Chat Interface](docs/screenshots/chat.png)
![Voice Assistant](docs/screenshots/voice.png)
![Vision Analysis](docs/screenshots/vision.png)
![Automation Studio](docs/screenshots/automation.png)
![Plugin Marketplace](docs/screenshots/marketplace.png)
-->

> Screenshots coming soon. Place screenshots in `docs/screenshots/`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              JARVIS X — AI OS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │   Chat   │  │  Voice   │  │  Vision  │  │Automation│  │ Plugins  │   │   │
│  │  │   UI     │  │ Assistant│  │  Studio  │  │  Studio  │  │Marketplace│   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       API GATEWAY (Next.js 15)                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  RSC     │  │ Server   │  │  API     │  │WebSocket │  │ Stream   │   │   │
│  │  │  Stream  │  │ Actions  │  │  Routes  │  │  Handler │  │  Manager │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND (FastAPI + Python 3.12)                     │   │
│  │                                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  Routes  │  │ Services │  │  Models  │  │   AI     │  │ Plugins  │   │   │
│  │  │          │──▶│          │──▶│          │  │  Engine  │  │  Manager │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │       │              │              │              │              │       │   │
│  │  ┌────┴──────────────┴──────────────┴──────────────┴──────────────┴───┐   │   │
│  │  │                    DI Container (FastAPI Depends)                   │   │   │
│  │  └────────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │PostgreSQL│  │  Redis   │  │   Neo4j  │  │   Qdrant │  │    S3    │   │   │
│  │  │ (Rel DB) │  │ (Cache)  │  │ (Graph)  │  │(Vectors) │  │ (Assets) │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category           | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Frontend**       | Next.js 15 (App Router), React 19, TailwindCSS  |
| **Backend**        | FastAPI, Python 3.12, Pydantic v2               |
| **AI/ML**          | LangChain, OpenAI/Anthropic/Google AI, Whisper   |
| **Database**       | PostgreSQL (primary), Redis (cache/queue)        |
| **Vector Store**   | Qdrant / pgvector                                |
| **Graph DB**       | Neo4j                                            |
| **Streaming**      | Server-Sent Events, WebSockets                   |
| **Auth**           | JWT (access + refresh), OAuth2, RBAC             |
| **Task Queue**     | Celery + Redis                                   |
| **ORM**            | SQLAlchemy 2.0 + Alembic                         |
| **Validation**     | Zod (frontend), Pydantic (backend)              |
| **Container**      | Docker, Docker Compose                           |
| **Monitoring**     | Prometheus, Grafana, Sentry                      |
| **Testing**        | pytest (backend), Playwright (frontend)          |
| **CI/CD**          | GitHub Actions                                   |

---

## Features

- [x] **Natural Conversation** — Multi-turn chat with context retention and streaming responses
- [x] **Voice Assistant** — Speech-to-text (Whisper), text-to-speech (ElevenLabs/OpenAI)
- [x] **Computer Vision** — Image analysis, OCR, object detection, scene understanding
- [x] **Automation Studio** — Create and schedule multi-step AI workflows
- [x] **Memory System** — Short-term (session) and long-term (vector) memory with search
- [x] **Knowledge Graph** — Entity extraction, relationship mapping, visual graph exploration
- [x] **Plugin Ecosystem** — Extensible plugin system with sandboxed execution
- [x] **Research Agent** — Deep web research with source aggregation and citation
- [x] **Coding Assistant** — Code analysis, generation, review, and refactoring
- [x] **Multi-Model** — Bring your own key (OpenAI, Anthropic, Google, Ollama, etc.)
- [x] **RBAC** — Role-based access control (admin, user, viewer)
- [x] **Real-Time Sync** — WebSockets for live collaboration and updates
- [x] **Dark/Light Theme** — Full theme support with system preference detection

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional but recommended)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/jarvis-x.git
cd jarvis-x

# 2. Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1
cd backend
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# 4. Run database migrations
alembic upgrade head

# 5. Seed default data
python scripts/seed.py

# 6. Start backend
uvicorn app.main:app --reload --port 8000

# 7. Frontend setup (in a new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:8000`. API docs are at `http://localhost:8000/docs`.

### Docker (one-command setup)

```bash
docker compose up --build
```

---

## Project Structure

```
jarvis-x/
├── backend/
│   ├── app/
│   │   ├── api/              # Route definitions
│   │   │   ├── v1/           # API version 1
│   │   │   │   ├── auth.py
│   │   │   │   ├── chat.py
│   │   │   │   ├── voice.py
│   │   │   │   ├── vision.py
│   │   │   │   ├── automation.py
│   │   │   │   ├── memory.py
│   │   │   │   ├── plugins.py
│   │   │   │   ├── knowledge.py
│   │   │   │   ├── research.py
│   │   │   │   ├── coding.py
│   │   │   │   └── admin.py
│   │   │   └── deps.py       # Dependency injection
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── redis.py
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── ai/               # AI engine
│   │   │   ├── agents/
│   │   │   ├── tools/
│   │   │   ├── streaming.py
│   │   │   └── providers.py
│   │   ├── plugins/          # Plugin system
│   │   │   ├── base.py
│   │   │   ├── manager.py
│   │   │   └── registry.py
│   │   ├── ws/               # WebSocket handlers
│   │   └── main.py           # FastAPI entry point
│   ├── alembic/              # Database migrations
│   ├── scripts/              # Utility scripts
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   ├── chat/
│   │   │   ├── voice/
│   │   │   ├── vision/
│   │   │   ├── automation/
│   │   │   ├── plugins/
│   │   │   ├── knowledge/
│   │   │   └── settings/
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Base UI primitives
│   │   │   ├── chat/         # Chat components
│   │   │   ├── voice/        # Voice interface
│   │   │   └── shared/       # Shared components
│   │   ├── lib/              # Utilities
│   │   │   ├── api-client.ts
│   │   │   ├── websocket.ts
│   │   │   └── auth.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript types
│   ├── public/
│   ├── tests/
│   ├── next.config.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── AGENTS.md
├── LICENSE
└── README.md
```

---

## Environment Variables

| Variable                    | Description                  | Default               |
| --------------------------- | ---------------------------- | --------------------- |
| **Database**                |                              |                       |
| `DATABASE_URL`              | PostgreSQL connection string | `postgresql://...`    |
| `REDIS_URL`                 | Redis connection string      | `redis://localhost:6379` |
| **Auth**                    |                              |                       |
| `SECRET_KEY`                | JWT signing key              | (required)            |
| `ACCESS_TOKEN_EXPIRE`       | Access token TTL             | `30` (minutes)        |
| `REFRESH_TOKEN_EXPIRE`      | Refresh token TTL            | `7` (days)            |
| **AI Providers**            |                              |                       |
| `OPENAI_API_KEY`            | OpenAI API key               | (optional)            |
| `ANTHROPIC_API_KEY`         | Anthropic API key            | (optional)            |
| `GOOGLE_AI_API_KEY`         | Google AI API key            | (optional)            |
| `OLLAMA_BASE_URL`           | Ollama server URL            | `http://localhost:11434` |
| **Voice**                   |                              |                       |
| `ELEVENLABS_API_KEY`        | ElevenLabs TTS key           | (optional)            |
| `AZURE_SPEECH_KEY`          | Azure Speech Services key    | (optional)            |
| **Storage**                 |                              |                       |
| `S3_ENDPOINT`               | S3-compatible endpoint       | (optional)            |
| `S3_ACCESS_KEY`             | S3 access key                | (optional)            |
| `S3_SECRET_KEY`             | S3 secret key                | (optional)            |
| `S3_BUCKET`                 | S3 bucket name               | `jarvis-x`            |
| **Plugins**                 |                              |                       |
| `PLUGIN_DIR`                | Plugin directory             | `./plugins`           |
| `PLUGIN_SANDBOX_ENABLED`    | Enable plugin sandboxing     | `true`                |
| **Monitoring**              |                              |                       |
| `SENTRY_DSN`                | Sentry error tracking        | (optional)            |
| `PROMETHEUS_ENABLED`        | Enable Prometheus metrics    | `false`               |
| **Other**                   |                              |                       |
| `CORS_ORIGINS`              | Allowed CORS origins         | `http://localhost:3000` |
| `LOG_LEVEL`                 | Logging level                | `INFO`                |
| `MAX_UPLOAD_SIZE`           | Max file upload (bytes)      | `52428800` (50MB)     |

---

## API Overview

| Category       | Base Path             | Auth Required |
| -------------- | --------------------- | ------------- |
| Auth           | `/api/v1/auth`        | No (mostly)   |
| Users          | `/api/v1/users`       | Yes           |
| Chat           | `/api/v1/chat`        | Yes           |
| Voice          | `/api/v1/voice`       | Yes           |
| Vision         | `/api/v1/vision`      | Yes           |
| Automation     | `/api/v1/automation`  | Yes           |
| Memory         | `/api/v1/memory`      | Yes           |
| Plugins        | `/api/v1/plugins`     | Yes           |
| Knowledge      | `/api/v1/knowledge`   | Yes           |
| Research       | `/api/v1/research`    | Yes           |
| Coding         | `/api/v1/coding`      | Yes           |
| Admin          | `/api/v1/admin`       | Admin         |
| WebSocket      | `/ws/*`               | Yes (token)   |

Full API documentation is available in [`docs/API.md`](docs/API.md).

---

## Deployment

### Docker Compose (Recommended)

```bash
docker compose up --build -d
```

### Vercel (Frontend) + VPS (Backend)

```bash
# Frontend
cd frontend
npx vercel --prod

# Backend
# Deploy to your VPS and configure nginx as reverse proxy
```

For detailed deployment instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Contributing

We welcome contributions! Please see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for our guidelines.

Key points:
- Follow existing code style (Python: ruff, TypeScript: prettier)
- Write tests for new features
- Update documentation
- Use conventional commits

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by the JARVIS X team
</p>
