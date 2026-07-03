#!/usr/bin/env pwsh
# ──────────────────────────────────────────────
# JARVIS X - Setup Script (Windows/PowerShell)
# ──────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

function Write-Info   { Write-Host "[INFO]  $args" -ForegroundColor Cyan }
function Write-OK     { Write-Host "[OK]    $args" -ForegroundColor Green }
function Write-Warn   { Write-Host "[WARN]  $args" -ForegroundColor Yellow }
function Write-Error  { Write-Host "[ERROR] $args" -ForegroundColor Red }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Info "Setting up JARVIS X in $ProjectRoot"
Write-Host ""

# ── Prerequisites ──────────────────────────────
Write-Info "Checking prerequisites..."

$prereqs = @(
    @{ Name = "python"; Command = "python --version" },
    @{ Name = "pip";    Command = "pip --version" },
    @{ Name = "node";   Command = "node --version" },
    @{ Name = "npm";    Command = "npm --version" }
)

foreach ($prereq in $prereqs) {
    try {
        $version = Invoke-Expression $prereq.Command
        Write-OK "$($prereq.Name) found: $version"
    } catch {
        Write-Error "$($prereq.Name) not found. Please install it first."
        exit 1
    }
}
Write-Host ""

# ── Environment File ───────────────────────────
if (-not (Test-Path ".env")) {
    Write-Warn "No .env file found. Copying from .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Warn "Please edit .env with your actual configuration values."
} else {
    Write-OK ".env file exists"
}
Write-Host ""

# ── Backend Setup ──────────────────────────────
Write-Info "Setting up Python backend..."

$venvPath = ""
if (Test-Path "backend\.venv") {
    $venvPath = "backend\.venv"
} elseif (Test-Path "backend\venv") {
    $venvPath = "backend\venv"
}

if (-not $venvPath) {
    Write-Info "Creating virtual environment..."
    python -m venv backend\.venv
    $venvPath = "backend\.venv"
    Write-OK "Virtual environment created"
}

$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Info "Activated virtual environment: $venvPath"
}

Write-Info "Installing pip dependencies..."
pip install --upgrade pip

$poetryAvailable = $null
try { $poetryAvailable = Get-Command poetry -ErrorAction Stop } catch {}

if ($poetryAvailable) {
    Write-Info "Using Poetry for dependency management"
    Set-Location backend
    poetry config virtualenvs.create false
    poetry install --no-interaction
    Set-Location $ProjectRoot
} else {
    Write-Warn "Poetry not found. Installing from pyproject.toml..."
    pip install ".[dev]"
}
Write-OK "Python dependencies installed"

# Install Playwright browsers
Write-Info "Installing Playwright browsers..."
try {
    python -m playwright install chromium --with-deps
    Write-OK "Playwright browsers installed"
} catch {
    try {
        playwright install chromium --with-deps
    } catch {
        Write-Warn "Playwright install skipped (not critical)"
    }
}
Write-Host ""

# ── Frontend Setup ─────────────────────────────
Write-Info "Setting up Node.js frontend..."
Set-Location frontend
npm install
Write-OK "Node.js dependencies installed"
Set-Location $ProjectRoot
Write-Host ""

# ── Database ───────────────────────────────────
Write-Info "Setting up database..."

$alembicAvailable = $null
try { $alembicAvailable = Get-Command alembic -ErrorAction Stop } catch {}

if ($alembicAvailable) {
    Write-Info "Running Alembic migrations..."
    Set-Location backend
    alembic upgrade head
    Set-Location $ProjectRoot
    Write-OK "Database migrations applied"
} else {
    Write-Warn "Alembic not available. Skipping migrations."
}
Write-Host ""

# ── Seed Data ──────────────────────────────────
Write-Info "Seeding database with demo data..."
if (Test-Path "scripts\seed.py") {
    python scripts\seed.py
    Write-OK "Database seeded"
} else {
    Write-Warn "Seed script not found. Skipping."
}
Write-Host ""

# ── Summary ────────────────────────────────────
Write-Host ""
Write-OK " JARVIS X setup complete!"
Write-Host ""
Write-Info "Quick start:"
Write-Host "  Backend:  cd backend; uvicorn app.main:app --reload --port 8000"
Write-Host "  Frontend: cd frontend; npm run dev"
Write-Host "  Docker:   docker compose up -d"
Write-Host ""
Write-Info "Make sure to edit the .env file with your configuration!"
