#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# JARVIS X - Setup Script (Linux/macOS)
# ──────────────────────────────────────────────

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_CYAN="\033[36m"
COLOR_RED="\033[31m"

log_info()  { echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET}  $*"; }
log_ok()    { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET}    $*"; }
log_warn()  { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET}  $*"; }
log_error() { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*"; }

# Detect project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

log_info "Setting up JARVIS X in $PROJECT_ROOT"
echo ""

# ── Prerequisites ──────────────────────────────
log_info "Checking prerequisites..."

check_command() {
    if ! command -v "$1" &>/dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
    log_ok "$1 found: $(command -v "$1")"
}

check_command python3
check_command pip3
check_command node
check_command npm

PYTHON_VERSION=$(python3 --version 2>&1)
NODE_VERSION=$(node --version 2>&1)
log_info "Python: $PYTHON_VERSION"
log_info "Node:   $NODE_VERSION"
echo ""

# ── Environment File ───────────────────────────
if [ ! -f ".env" ]; then
    log_warn "No .env file found. Copying from .env.example..."
    cp .env.example .env
    log_warn "Please edit .env with your actual configuration values."
else
    log_ok ".env file exists"
fi
echo ""

# ── Backend Setup ──────────────────────────────
log_info "Setting up Python backend..."

if [ ! -d "backend/.venv" ] && [ ! -d "backend/venv" ]; then
    log_info "Creating virtual environment..."
    python3 -m venv backend/.venv
    log_ok "Virtual environment created"
fi

VENV_PATH=""
if [ -d "backend/.venv" ]; then
    VENV_PATH="backend/.venv"
elif [ -d "backend/venv" ]; then
    VENV_PATH="backend/venv"
fi

if [ -n "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
    log_info "Activated virtual environment: $VENV_PATH"
fi

log_info "Installing pip dependencies..."
pip3 install --upgrade pip
if command -v poetry &>/dev/null; then
    log_info "Using Poetry for dependency management"
    cd backend
    poetry config virtualenvs.create false
    poetry install --no-interaction
    cd "$PROJECT_ROOT"
else
    log_warn "Poetry not found. Installing from requirements if available..."
    if [ -f "backend/requirements.txt" ]; then
        pip3 install -r backend/requirements.txt
    elif [ -f "backend/pyproject.toml" ]; then
        pip3 install ".[dev]"
    fi
fi
log_ok "Python dependencies installed"

# Install Playwright browsers
log_info "Installing Playwright browsers..."
python3 -m playwright install chromium --with-deps 2>/dev/null || \
    playwright install chromium --with-deps 2>/dev/null || \
    log_warn "Playwright install skipped (not critical)"
echo ""

# ── Frontend Setup ─────────────────────────────
log_info "Setting up Node.js frontend..."
cd frontend
npm install
log_ok "Node.js dependencies installed"
cd "$PROJECT_ROOT"
echo ""

# ── Database ───────────────────────────────────
log_info "Setting up database..."

if command -v alembic &>/dev/null; then
    log_info "Running Alembic migrations..."
    cd backend
    alembic upgrade head
    cd "$PROJECT_ROOT"
    log_ok "Database migrations applied"
else
    log_warn "Alembic not available. Skipping migrations."
fi
echo ""

# ── Seed Data ──────────────────────────────────
log_info "Seeding database with demo data..."
if [ -f "scripts/seed.py" ]; then
    python3 scripts/seed.py
    log_ok "Database seeded"
else
    log_warn "Seed script not found. Skipping."
fi
echo ""

# ── Summary ────────────────────────────────────
echo ""
log_ok " JARVIS X setup complete!"
echo ""
log_info "Quick start:"
echo "  Backend:  cd backend && uvicorn app.main:app --reload --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo "  Docker:   docker compose up -d"
echo ""
log_info "Make sure to edit the .env file with your configuration!"
