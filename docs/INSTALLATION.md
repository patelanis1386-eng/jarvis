# Installation Guide — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04  
> **Supported OS:** Windows (PowerShell), macOS (zsh), Linux (bash)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone Repository](#2-clone-repository)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Docker Setup](#5-docker-setup)
6. [Production Deployment](#6-production-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

| Software       | Version   | Check Command                   | Notes                                   |
| -------------- | --------- | ------------------------------- | --------------------------------------- |
| **Python**     | 3.12+     | `python --version`              | 3.11 may work but not recommended       |
| **Node.js**    | 20+       | `node --version`                | Includes npm 10+                        |
| **PostgreSQL** | 16+       | `psql --version`                | Required for primary database           |
| **Redis**      | 7+        | `redis-cli --version`           | Required for cache, queue, sessions     |
| **Docker**     | 24+       | `docker --version`              | Optional (for Docker setup)             |
| **Docker Compose** | 2.24+  | `docker compose version`        | Included with Docker Desktop            |
| **Git**        | 2.40+     | `git --version`                 | For version control                     |
| **make**       | -         | `make --version`                | Optional (dev helpers available)        |

### Platform-Specific Notes

**Windows:**
- Install Python from [python.org](https://python.org) — ensure "Add to PATH" is checked
- Install Node.js from [nodejs.org](https://nodejs.org)
- Install PostgreSQL via [EDB installer](https://www.postgresql.org/download/windows/)
- Install Redis via [Memurai](https://www.memurai.com/) (Windows-compatible Redis) or WSL2
- Install Docker Desktop from [docker.com](https://docker.com)
- Use **PowerShell 7+** for the best experience

**macOS:**
```bash
brew install python@3.12 node postgresql@16 redis docker docker-compose
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install -y python3.12 python3.12-venv postgresql redis-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

---

## 2. Clone Repository

```bash
git clone https://github.com/your-org/jarvis-x.git
cd jarvis-x
```

---

## 3. Backend Setup

### 3.1 Create Virtual Environment

```bash
cd backend

# Linux/macOS
python3.12 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Windows (CMD)
python -m venv venv
venv\Scripts\activate.bat
```

### 3.2 Install Dependencies

```bash
# Ensure pip is up to date
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# For development (includes testing, linting tools)
pip install -r requirements-dev.txt
```

**Note:** On Windows, if you encounter build errors for `psycopg2`, install the binary version:
```bash
pip install psycopg2-binary
```

### 3.3 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# --- Database ---
DATABASE_URL=postgresql+asyncpg://jarvis:jarvis_password@localhost:5432/jarvis_x
REDIS_URL=redis://localhost:6379/0

# --- Auth ---
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# --- AI Providers (at least one required) ---
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_AI_API_KEY=...
# OLLAMA_BASE_URL=http://localhost:11434

# --- Voice (optional) ---
# ELEVENLABS_API_KEY=...
# AZURE_SPEECH_KEY=...

# --- Storage (optional) ---
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_ACCESS_KEY=...
# S3_SECRET_KEY=...
# S3_BUCKET=jarvis-x-uploads

# --- Server ---
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
LOG_LEVEL=INFO
```

### 3.4 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE jarvis_x;
CREATE USER jarvis WITH PASSWORD 'jarvis_password';
GRANT ALL PRIVILEGES ON DATABASE jarvis_x TO jarvis;
\c jarvis_x
GRANT ALL ON SCHEMA public TO jarvis;
\q
```

### 3.5 Run Migrations

```bash
alembic upgrade head
```

To verify:
```bash
alembic current
# Should show the latest revision
```

### 3.6 Seed Default Data

```bash
python scripts/seed.py
```

This creates:
- Admin user (admin@jarvisx.ai / Admin123!)
- Demo user (demo@jarvisx.ai / Demo123!)
- Sample conversation
- Default plugin templates
- System settings

### 3.7 Start Backend Server

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or with more workers (production-like)
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

Verify the API is running:
```bash
curl http://localhost:8000/api/v1/health
# {"status":"healthy","version":"1.0.0"}
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Frontend Setup

### 4.1 Install Dependencies

```bash
cd frontend
npm install
```

### 4.2 Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# App URL (for auth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

### 4.3 Start Development Server

```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 4.4 Build for Production

```bash
npm run build
npm start
```

---

## 5. Docker Setup

### 5.1 Quick Start (All Services)

```bash
# From project root
docker compose up --build -d
```

This starts:
- `jarvis-x-frontend` — Next.js on port 3000
- `jarvis-x-backend` — FastAPI on port 8000
- `jarvis-x-postgres` — PostgreSQL on port 5432
- `jarvis-x-redis` — Redis on port 6379
- `jarvis-x-celery-worker` — Celery worker

### 5.2 Verify Docker Setup

```bash
docker compose ps
docker compose logs -f backend
```

### 5.3 Run Migrations in Docker

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python scripts/seed.py
```

### 5.4 Stop Services

```bash
docker compose down
# To also remove volumes (WARNING: deletes data):
docker compose down -v
```

---

## 6. Production Deployment

### 6.1 VPS Requirements

| Resource   | Minimum    | Recommended |
| ---------- | ---------- | ----------- |
| **CPU**    | 2 cores    | 4 cores     |
| **RAM**    | 4 GB       | 8 GB        |
| **Disk**   | 20 GB SSD  | 50 GB SSD   |
| **OS**     | Ubuntu 22.04 | Ubuntu 24.04 |

### 6.2 Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.12 python3.12-venv nginx postgresql redis-server certbot

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repository
git clone https://github.com/your-org/jarvis-x.git /opt/jarvis-x
cd /opt/jarvis-x
```

### 6.3 Backend Service (systemd)

Create `/etc/systemd/system/jarvis-x-backend.service`:

```ini
[Unit]
Description=JARVIS X Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=jarvis
Group=jarvis
WorkingDirectory=/opt/jarvis-x/backend
Environment=PATH=/opt/jarvis-x/backend/venv/bin:/usr/bin
EnvironmentFile=/opt/jarvis-x/backend/.env
ExecStart=/opt/jarvis-x/backend/venv/bin/uvicorn app.main:app --workers 4 --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable jarvis-x-backend
sudo systemctl start jarvis-x-backend
sudo systemctl status jarvis-x-backend
```

### 6.4 Celery Worker Service

Create `/etc/systemd/system/jarvis-x-celery.service`:

```ini
[Unit]
Description=JARVIS X Celery Worker
After=redis-server.service

[Service]
Type=simple
User=jarvis
Group=jarvis
WorkingDirectory=/opt/jarvis-x/backend
Environment=PATH=/opt/jarvis-x/backend/venv/bin:/usr/bin
EnvironmentFile=/opt/jarvis-x/backend/.env
ExecStart=/opt/jarvis-x/backend/venv/bin/celery -A app.workers.tasks worker --loglevel=info
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 6.5 Frontend Build

```bash
cd /opt/jarvis-x/frontend
npm ci
npm run build

# Install PM2 for process management
sudo npm install -g pm2
pm2 start npm --name "jarvis-x-frontend" -- start
pm2 save
pm2 startup
```

### 6.6 Nginx Reverse Proxy

Create `/etc/nginx/sites-available/jarvis-x`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for streaming
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    # Client body size (for file uploads)
    client_max_body_size 50M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/jarvis-x /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.7 SSL with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
# Follow the interactive prompts
```

Auto-renewal is enabled by default. Verify:
```bash
sudo certbot renew --dry-run
```

---

## 7. Troubleshooting

### 7.1 Common Issues

**Database connection refused**
```
Error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed
```
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check `DATABASE_URL` in `.env` is correct
- Verify PostgreSQL port: `sudo netstat -tlnp | grep 5432`

**Redis connection refused**
```
Error: Connection to Redis at localhost:6379 failed
```
- Ensure Redis is running: `sudo systemctl status redis-server`
- Check `REDIS_URL` in `.env`

**Port already in use**
```
Error: [Errno 98] Address already in use
```
- Check which process is using port 8000: `sudo lsof -i :8000`
- Kill the process or change port in config

**Permission denied for schema public**
```
Error: permission denied for schema public
```
- Run: `GRANT ALL ON SCHEMA public TO jarvis;` in psql

**Alembic migration fails**
```
Error: Target database is not up to date
```
- Try: `alembic stamp head` then `alembic upgrade head`
- If still failing, check `alembic/versions/` for duplicate revisions

**Module not found errors (Python)**
```
ModuleNotFoundError: No module named 'app'
```
- Ensure you're in the `backend/` directory
- Ensure venv is activated
- Ensure dependencies are installed: `pip install -r requirements.txt`

**npm install fails (node-gyp errors)**
```
gyp ERR! stack Error: not found: make
```
**Windows:** Install [windows-build-tools](https://www.npmjs.com/package/windows-build-tools):
```bash
npm install --global windows-build-tools
```

**macOS:** Install Xcode Command Line Tools:
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential
```

**WebSocket connection fails**
```
WebSocket connection to 'ws://...' failed
```
- Verify WebSocket URL uses `ws://` for local dev, `wss://` for production
- Check CORS configuration allows WebSocket upgrade
- For production, ensure nginx has WebSocket proxy headers

**AI provider returns 401**
```
AI Provider Error: 401 Unauthorized
```
- Check your API key in `.env`
- Verify the key has access to the requested model
- Check provider status page for outages

### 7.2 Logs

```bash
# Backend logs (systemd)
sudo journalctl -u jarvis-x-backend -f

# Celery logs
sudo journalctl -u jarvis-x-celery -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker logs
docker compose logs -f backend
docker compose logs -f frontend

# Application logs
tail -f /opt/jarvis-x/backend/logs/app.log
```

### 7.3 Health Check

```bash
# Backend health
curl http://localhost:8000/api/v1/admin/system/health

# PostgreSQL
pg_isready

# Redis
redis-cli ping
# Should return: PONG
```

### 7.4 Reset Everything

```bash
# Stop services
docker compose down -v  # If using Docker
sudo systemctl stop jarvis-x-backend jarvis-x-celery

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE jarvis_x;"
sudo -u postgres psql -c "CREATE DATABASE jarvis_x;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jarvis_x TO jarvis;"

# Re-run migrations
cd backend
source venv/bin/activate
alembic upgrade head
python scripts/seed.py
```

---

*Still having issues? Open a GitHub issue with: your OS, error logs, steps to reproduce, and any relevant configuration (redact secrets).*
