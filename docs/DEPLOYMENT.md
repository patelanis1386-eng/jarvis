# Deployment Guide — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04

---

## Table of Contents

1. [Option 1: Docker Compose (Recommended)](#option-1-docker-compose-recommended)
2. [Option 2: Vercel (Frontend) + VPS (Backend)](#option-2-vercel-frontend--vps-backend)
3. [Option 3: Manual Deployment](#option-3-manual-deployment)
4. [Database Migrations](#4-database-migrations)
5. [Backup and Restore](#5-backup-and-restore)
6. [Monitoring and Logging](#6-monitoring-and-logging)
7. [Performance Tuning](#7-performance-tuning)
8. [Security Checklist](#8-security-checklist)

---

## Option 1: Docker Compose (Recommended)

The simplest and most reliable deployment method. All services run in containers with a single command.

### Prerequisites

- Docker Engine 24+ and Docker Compose 2.24+
- Git
- A domain name (for production)
- At least 4GB RAM available

### Environment Setup

`ash
git clone https://github.com/your-org/jarvis-x.git
cd jarvis-x
cp .env.example .env.production
`

Edit .env.production:

`env
DATABASE_URL=postgresql+asyncpg://jarvis:\@postgres:5432/jarvis_x
REDIS_URL=redis://redis:6379/0
SECRET_KEY=\
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OPENAI_API_KEY=\
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=INFO
`

### Running

`ash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
docker compose ps
docker compose logs -f backend
`

### Updating

`ash
git pull
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
`

---

## Option 2: Vercel (Frontend) + VPS (Backend)

### Frontend Deployment to Vercel

`ash
cd frontend
npx vercel --prod
`

Set environment variables in Vercel dashboard:
- NEXT_PUBLIC_API_URL: https://api.your-domain.com/api/v1
- NEXT_PUBLIC_WS_URL: wss://api.your-domain.com/ws
- NEXT_PUBLIC_APP_URL: https://your-domain.com

### Backend Deployment to VPS

`ash
# Server setup
ssh user@your-server
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.12 python3.12-venv nginx postgresql redis-server certbot
git clone https://github.com/your-org/jarvis-x.git /opt/jarvis-x
cd /opt/jarvis-x/backend

# Python setup
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with production values

# Database
sudo -u postgres createdb jarvis_x
sudo -u postgres psql -c "CREATE USER jarvis WITH PASSWORD 'secure-pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jarvis_x TO jarvis;"

# Migrate
alembic upgrade head
python scripts/seed.py
`

#### Systemd Service

/etc/systemd/system/jarvis-x-backend.service:

`ini
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
`

`ash
sudo systemctl daemon-reload
sudo systemctl enable --now jarvis-x-backend
`

### Domain Configuration

**Nginx reverse proxy** at /etc/nginx/sites-available/api.your-domain.com:

`
ginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP \;
        proxy_set_header X-Forwarded-For \;
        proxy_set_header X-Forwarded-Proto \;
        proxy_read_timeout 300s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
        proxy_read_timeout 86400s;
    }

    client_max_body_size 50M;
}
`

### SSL with Let's Encrypt

`ash
sudo certbot --nginx -d api.your-domain.com
sudo certbot renew --dry-run
`

Vercel handles SSL for your-domain.com automatically.

---

## Option 3: Manual Deployment

### Backend with systemd

Follow the VPS setup from Option 2 above.

### Frontend with PM2

`ash
cd frontend
npm ci
npm run build
sudo npm install -g pm2
pm2 start npm --name "jarvis-x" -- start
pm2 save
pm2 startup
`

---

## 4. Database Migrations

### Running Migrations

`ash
cd backend
source venv/bin/activate

# Upgrade
alembic upgrade head

# Downgrade one revision
alembic downgrade -1

# View history
alembic history

# Create new migration
alembic revision --autogenerate -m "description"
`

### Migration Best Practices

- Always review auto-generated migrations before applying
- Test migrations on a staging database first
- Use lembic upgrade head --sql to generate raw SQL for manual review
- Never delete migration files that have been deployed to production
- For zero-downtime deployments, use expand-migrate-contract pattern

---

## 5. Backup and Restore

### PostgreSQL Backup

`ash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=\
pg_dump -U jarvis -h localhost jarvis_x | gzip > \/jarvis_x_\.sql.gz

# Keep last 30 days
find \ -name "*.sql.gz" -mtime +30 -delete
`

### Redis Backup

`ash
# Redis RDB snapshots (configured in redis.conf)
# Save to /var/lib/redis/dump.rdb
cp /var/lib/redis/dump.rdb /backups/redis/dump.\.rdb
`

### Full System Backup

`ash
#!/bin/bash
BACKUP_DIR="/backups/full"
DATE=\

# Database
pg_dump -U jarvis -h localhost jarvis_x | gzip > \/db_\.sql.gz

# Uploads
tar -czf \/uploads_\.tar.gz /opt/jarvis-x/backend/uploads

# Configuration
cp /opt/jarvis-x/backend/.env \/env_\.backup

# Clean old backups
find \ -name "*.gz" -mtime +30 -delete
`

### Restore

`ash
# Database
gunzip -c /backups/db_20260704.sql.gz | psql -U jarvis -h localhost jarvis_x

# Uploads
tar -xzf /backups/uploads_20260704.tar.gz -C /opt/jarvis-x/backend
`

---

## 6. Monitoring and Logging

### Prometheus + Grafana

Enable metrics in .env:
`env
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
`

Docker Compose monitoring stack:

`yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
`

### Sentry Error Tracking

`env
SENTRY_DSN=https://your-dsn@sentry.io/123456
`

### Logging

`ash
# Application logs
tail -f /opt/jarvis-x/backend/logs/app.log
journalctl -u jarvis-x-backend -f

# Nginx access logs
tail -f /var/log/nginx/access.log

# Docker logs
docker compose logs -f --tail=100
`

### Health Endpoints

| Endpoint                          | Description            |
| --------------------------------- | ---------------------- |
| GET /api/v1/admin/system/health | Full system health     |
| GET /api/v1/admin/system/stats  | Usage statistics       |
| GET /api/v1/health              | Lightweight health     |

---

## 7. Performance Tuning

### PostgreSQL

`ini
# postgresql.conf optimizations
shared_buffers = 1GB                # 25% of RAM
effective_cache_size = 3GB          # 75% of RAM
work_mem = 64MB                     # Per operation
maintenance_work_mem = 256MB
max_connections = 100
random_page_cost = 1.1              # SSD optimization
effective_io_concurrency = 200      # SSD optimization
wal_buffers = 64MB
`

### Redis

`ini
# redis.conf optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
`

### Uvicorn Workers

`ash
# Formula: (2 * CPU cores) + 1
uvicorn app.main:app --workers 9 --host 0.0.0.0 --port 8000
`

### Nginx

`
ginx
# nginx.conf optimizations
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100000;
    client_body_buffer_size 128k;
    client_max_body_size 50M;
}
`

---

## 8. Security Checklist

### Pre-Deployment

- [ ] SECRET_KEY is a long, random string (generate with openssl rand -hex 32)
- [ ] Database password is strong and unique
- [ ] AI API keys are stored securely (not hardcoded)
- [ ] DEBUG mode is disabled
- [ ] CORS_ORIGINS is set to specific domains, not *
- [ ] All default credentials have been changed
- [ ] SSL certificate is installed and auto-renewal configured
- [ ] Firewall is configured (allow only 80, 443, SSH)

### Hardening

- [ ] Run services as non-root user
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure Redis with equirepass
- [ ] Set maxmemory on Redis to prevent OOM
- [ ] Enable rate limiting on all API endpoints
- [ ] Configure security headers in nginx
- [ ] Enable audit logging
- [ ] Set file upload size limits
- [ ] Plugin sandboxing enabled
- [ ] Database connection pooling with pgBouncer

### Monitoring

- [ ] Set up uptime monitoring (e.g., UptimeRobot, BetterUptime)
- [ ] Configure error alerting (Sentry)
- [ ] Set up log aggregation (Loki, ELK, or similar)
- [ ] Database backup verification (test restore monthly)
- [ ] SSL certificate expiry alerts
- [ ] Disk usage monitoring

### Regular Maintenance

- [ ] Apply OS security patches weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review audit logs weekly
- [ ] Penetration testing annually
- [ ] Backup restore drill quarterly

---

*For security issues, see [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.*
