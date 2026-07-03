# Security Documentation — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Authorization and RBAC](#2-authorization-and-rbac)
3. [Data Encryption](#3-data-encryption)
4. [API Security](#4-api-security)
5. [Environment Variable Management](#5-environment-variable-management)
6. [Rate Limiting](#6-rate-limiting)
7. [CORS Configuration](#7-cors-configuration)
8. [Security Headers](#8-security-headers)
9. [Audit Logging](#9-audit-logging)
10. [Vulnerability Reporting](#10-vulnerability-reporting)

---

## 1. Authentication Flow

JARVIS X uses a **JWT-based stateless authentication** system with access and refresh tokens.

### Token Architecture

`
┌────────────────────────────────────────────────────────────────────────────┐
│                          TOKEN STRATEGY                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────┐    ┌──────────────────────────────────┐     │
│  │     ACCESS TOKEN         │    │       REFRESH TOKEN              │     │
│  ├──────────────────────────┤    ├──────────────────────────────────┤     │
│  │ Short-lived (30 min)     │    │ Long-lived (7 days)              │     │
│  │ Stateless (not stored)   │    │ Stored (hashed) in DB            │     │
│  │ Signed with HS256        │    │ Signed with HS256                │     │
│  │ Sent as httpOnly cookie  │    │ Sent as httpOnly cookie          │     │
│  │ SameSite: Strict         │    │ SameSite: Strict                 │     │
│  │ Secure: true (prod)      │    │ Secure: true (prod)              │     │
│  │ Path: /api               │    │ Path: /api/v1/auth/refresh       │     │
│  │ Contains: user_id, role  │    │ Contains: session_id, user_id   │     │
│  └──────────────────────────┘    └──────────────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
`

### Login Flow

1. User submits email + password
2. Backend validates credentials via bcrypt comparison
3. On success:
   - Generates access token (30 min TTL)
   - Creates refresh token session in DB (hashed)
   - Returns both tokens to client
4. Frontend stores tokens in httpOnly cookies (set by BFF)

### Token Refresh Flow

1. Access token expires → API returns 401
2. Client calls POST /auth/refresh with refresh token
3. Backend validates refresh token:
   - Check hash matches stored session
   - Check session not revoked
   - Check TTL not expired
4. On success:
   - Rotate refresh token (issue new, revoke old)
   - Issue new access token
5. On failure: client redirects to login

### Token Revocation

- **Explicit:** POST /auth/logout deletes the refresh token session
- **Implicit:** Refresh token rotation invalidates the previous token
- **Bulk:** DELETE /users/:id/sessions/:sessionId revokes specific session
- **Admin:** Admin can revoke all sessions for a user

### Password Security

`python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Cost factor
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
`

### OAuth2 Integration

OAuth2 providers can be configured for social login:

`python
OAUTH_PROVIDERS = {
    "google": {
        "client_id": "...",
        "client_secret": "...",
        "authorize_url": "https://accounts.google.com/o/oauth2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scopes": ["openid", "email", "profile"],
    },
    "github": {
        "client_id": "...",
        "client_secret": "...",
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "scopes": ["user:email"],
    },
}
`

---

## 2. Authorization and RBAC

### Roles

| Role     | Description                          |
| -------- | ------------------------------------ |
| dmin  | Full system access, including admin  |
| user   | Standard user, can use all features  |
| iewer | Read-only access (analytics, public) |

### Permission Matrix

`python
PERMISSION_MATRIX = {
    # Entity:read, write, delete, admin
    "users": {
        "read":   ["admin", "user", "viewer"],
        "write":  ["admin", "user"],        # Own profile only
        "delete": ["admin", "user"],        # Own account only
        "admin":  ["admin"],
    },
    "conversations": {
        "read":   ["admin", "user", "viewer"],
        "write":  ["admin", "user"],
        "delete": ["admin", "user"],
    },
    "plugins": {
        "install": ["admin", "user"],
        "uninstall": ["admin", "user"],
        "marketplace": ["admin"],
    },
    "system": {
        "config": ["admin"],
        "logs":   ["admin"],
        "analytics": ["admin", "viewer"],
    },
}
`

### Enforcement

`python
from fastapi import Depends, HTTPException, status

def require_permission(entity: str, action: str):
    async def permission_checker(user: User = Depends(get_current_user)):
        allowed_roles = PERMISSION_MATRIX.get(entity, {}).get(action, [])
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions: {action}:{entity}",
            )
        return user
    return permission_checker

# Usage in routes
@router.get("/admin/system/stats")
async def get_system_stats(
    user: User = Depends(require_permission("system", "analytics")),
):
    ...
`

### Data-Level Access Control

- Users can only access their own data (conversations, memories, etc.)
- Admins can access all data
- user_id filtering is applied at the service layer, not just the route

---

## 3. Data Encryption

### At Rest

| Data Type              | Encryption Method                                        |
| ---------------------- | -------------------------------------------------------- |
| **Passwords**          | bcrypt (cost=12) — one-way hash, never reversible        |
| **Refresh tokens**     | SHA-256 hash before storing in database                  |
| **API keys** (users)   | AES-256-GCM with per-user derived key                    |
| **AI provider keys**   | Environment variables only (not stored in DB)            |
| **File uploads**       | Server-side encryption (AES-256) at S3/object storage    |
| **Database**           | PostgreSQL TDE or full-disk encryption at OS level       |
| **Session data**          | Redis with equirepass and TLS connection              |

### In Transit

| Connection Type  | Protocol             |
| ---------------- | -------------------- |
| Client → Server  | TLS 1.3 (HTTPS)      |
| Server → DB      | TLS (PostgreSQL SSL) |
| Server → Redis   | TLS + AUTH           |
| Server → AI API  | HTTPS (TLS 1.3)      |
| WebSocket        | WSS (TLS 1.3)        |

### Encryption Implementation

`python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class EncryptionService:
    def __init__(self, master_key: str):
        # Derive a key from the master key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"jarvis-x-encryption-salt",
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        self.cipher = Fernet(key)

    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt(self, encrypted: str) -> str:
        return self.cipher.decrypt(encrypted.encode()).decode()
`

---

## 4. API Security

### Authentication Headers

`http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-CSRF-Token: random-csrf-token  (for state-changing requests)
X-Request-ID: unique-request-id   (for tracing)
`

### Input Validation

- All inputs validated by Pydantic schemas
- SQL injection prevented by SQLAlchemy parameterized queries
- No eval/exec of user-provided code (sandboxed plugin execution)
- File uploads validated by MIME type and magic bytes
- Maximum file sizes enforced (50MB default)

### CSRF Protection

- State-changing requests require CSRF token (stored in cookie, sent in header)
- Double-submit cookie pattern
- SameSite=Strict on cookies prevents cross-site requests

### API Key Authentication (for programmatic access)

`http
X-API-Key: jx_xxxxxxxxxxxx
`

API keys are:
- Prefixed with jx_ for easy identification
- Hashed with SHA-256 before storage
- Rotatable by the user
- Rate-limited independently from session auth

---

## 5. Environment Variable Management

### Rules

1. **Never commit .env files** — .env is in .gitignore
2. **Document all variables** — in .env.example and README.md
3. **Use a secrets manager in production** — HashiCorp Vault, AWS Secrets Manager, or encrypted K8s secrets
4. **Validate at startup** — App fails fast if required vars are missing

### Validation

`python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    @model_validator(mode="after")
    def validate_ai_providers(self):
        if not any([self.OPENAI_API_KEY, self.ANTHROPIC_API_KEY]):
            raise ValueError(
                "At least one AI provider API key must be configured"
            )
        return self
`

### Production Secret Management

`ash
# Using environment files with restricted permissions
sudo chmod 600 /opt/jarvis-x/backend/.env
sudo chown jarvis:jarvis /opt/jarvis-x/backend/.env

# Or using systemd EnvironmentFile (recommended)
# /etc/systemd/system/jarvis-x-backend.service.d/override.conf
[Service]
EnvironmentFile=/etc/jarvis-x/secrets.env
`

---

## 6. Rate Limiting

### Configuration

`python
from fastapi import Request
from fastapi.responses import JSONResponse

RATE_LIMITS = {
    "default":       {"requests": 100, "window_seconds": 60},
    "auth:login":    {"requests": 5,   "window_seconds": 60},
    "auth:register": {"requests": 3,   "window_seconds": 3600},
    "chat:stream":   {"requests": 10,  "window_seconds": 60},
    "voice:transcribe": {"requests": 10, "window_seconds": 60},
    "vision:analyze": {"requests": 10,  "window_seconds": 60},
    "admin:*":       {"requests": 100, "window_seconds": 60},
}
`

### Implementation

Rate limiting uses a **sliding window** algorithm with Redis:

`python
import time
from redis import Redis

async def check_rate_limit(
    redis: Redis,
    key: str,
    max_requests: int,
    window: int,
) -> bool:
    now = int(time.time())
    window_start = now - window

    # Remove old entries
    await redis.zremrangebyscore(key, 0, window_start)

    # Count current entries
    count = await redis.zcard(key)

    if count >= max_requests:
        return False

    # Add current request
    await redis.zadd(key, {str(now): now})
    await redis.expire(key, window)

    return True
`

### Response Headers

Every response includes rate limit headers:

`http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1701619200
`

### Rate Limit Exceeded

`json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retry_after_seconds": 45
  }
}
`

---

## 7. CORS Configuration

`python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Development
        "https://your-app.vercel.app",     # Vercel production
        "https://your-custom-domain.com",  # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-CSRF-Token",
        "X-Request-ID",
        "X-API-Key",
    ],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "X-Request-ID",
    ],
    max_age=600,  # Cache preflight for 10 minutes
)
`

### CORS Policy by Environment

| Environment | llow_origins                        |
| ----------- | -------------------------------------- |
| Development | ["http://localhost:3000"]            |
| Staging     | ["https://staging.your-domain.com"]  |
| Production  | ["https://your-domain.com"]          |

**Never use llow_origins=["*"] in production** when credentials are enabled.

---

## 8. Security Headers

`
ginx
# Nginx configuration
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self';
    connect-src 'self' https: wss:;
    media-src 'self' blob:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
`

### Header Descriptions

| Header                              | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| X-Content-Type-Options: nosniff   | Prevents MIME type sniffing              |
| X-Frame-Options: DENY             | Prevents clickjacking                    |
| X-XSS-Protection: 1; mode=block   | Enables XSS filter in older browsers     |
| Strict-Transport-Security         | Forces HTTPS for 1 year                  |
| Content-Security-Policy           | Restricts resource loading sources       |
| Referrer-Policy                   | Controls referrer header                 |
| Permissions-Policy                | Restricts browser features               |

---

## 9. Audit Logging

### Events Logged

| Event                  | Fields Logged                                       |
| ---------------------- | --------------------------------------------------- |
| **Login**              | user_id, IP, user_agent, timestamp, success/failure |
| **Logout**             | user_id, session_id, timestamp                      |
| **Failed auth**        | email, IP, user_agent, reason, timestamp            |
| **Token refresh**      | user_id, session_id, timestamp                      |
| **Password change**    | user_id, timestamp, initiated_by                    |
| **User creation**      | admin_id, new_user_id, role, timestamp              |
| **User deletion**      | admin_id, deleted_user_id, timestamp                |
| **Role change**        | admin_id, target_user_id, old_role, new_role        |
| **Plugin install**     | user_id, plugin_id, source, timestamp               |
| **Plugin execution**   | user_id, plugin_id, action, params_hash, duration   |
| **Data export**        | user_id, export_type, size, timestamp               |
| **Admin action**       | admin_id, action, resource, details, timestamp      |
| **API key created**    | user_id, key_prefix, timestamp                      |
| **API key revoked**    | user_id, key_prefix, timestamp                      |
| **Rate limit hit**     | user_id/IP, route, timestamp                        |

### Audit Log Implementation

`python
from sqlalchemy import Column, String, JSON, DateTime, func
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID, primary_key=True, default=uuid4)
    event = Column(String(100), nullable=False, index=True)
    user_id = Column(UUID, nullable=True, index=True)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
`

### Logging Middleware

`python
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    # Skip audit for non-sensitive routes
    if should_audit(request):
        response = await call_next(request)
        await log_audit_event(
            event=f"{request.method}:{request.url.path}",
            user_id=getattr(request.state, "user_id", None),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent"),
            details={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
            },
        )
        return response
    return await call_next(request)
`

### Log Retention

| Environment | Retention Period |
| ----------- | ---------------- |
| Development | 7 days           |
| Staging     | 30 days          |
| Production  | 90 days (or legal minimum) |

---

## 10. Vulnerability Reporting

### Disclosure Policy

We take security seriously. If you discover a security vulnerability in JARVIS X, please follow responsible disclosure:

1. **Do not** disclose the vulnerability publicly
2. **Email** security@jarvisx.ai with details
3. **Include**:
   - Affected version(s)
   - Description of the vulnerability
   - Steps to reproduce
   - Proof of concept (if available)
   - Your contact information

### What to Expect

- **Acknowledgement** within 48 hours
- **Initial assessment** within 5 business days
- **Fix timeline** based on severity:
  - **Critical** — Patch within 72 hours
  - **High** — Patch within 7 days
  - **Medium** — Patch within 30 days
  - **Low** — Patch within 90 days
- **Credit** in our security acknowledgements (if desired)

### Scope

We welcome reports on:
- Authentication bypass
- Authorization flaws
- SQL injection
- XSS, CSRF, SSRF
- Remote code execution
- Data exposure
- Privilege escalation

**Out of scope:**
- Rate limiting bypass (unless data exposure)
- Missing security headers (without demonstrated impact)
- Self-XSS
- Social engineering
- Physical attacks
- DoS/DDoS

### Hall of Fame

We maintain a security acknowledgements page for researchers who responsibly disclose vulnerabilities. Contact us to be included.

---

*This document is maintained by the JARVIS X security team. For security-related inquiries, contact security@jarvisx.ai.*
