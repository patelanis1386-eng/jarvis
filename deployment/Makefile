.PHONY: help install migrate seed test lint format typecheck build deploy backup clean dev-backend dev-frontend docker-up docker-down

PROJECT_ROOT := $(shell git rev-parse --show-toplevel 2>/dev/null || pwd)
BACKEND_DIR := $(PROJECT_ROOT)/backend
FRONTEND_DIR := $(PROJECT_ROOT)/frontend
SCRIPTS_DIR := $(PROJECT_ROOT)/scripts

# ── Help ──────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Installation ──────────────────────────────
install: ## Install all dependencies
install: install-backend install-frontend

install-backend: ## Install backend Python dependencies
	cd $(BACKEND_DIR) && \
		python -m venv .venv && \
		. .venv/bin/activate && \
		pip install --upgrade pip && \
		pip install poetry && \
		poetry config virtualenvs.create false && \
		poetry install

install-frontend: ## Install frontend Node.js dependencies
	cd $(FRONTEND_DIR) && npm install

# ── Database ──────────────────────────────────
migrate: ## Run Alembic database migrations
	cd $(BACKEND_DIR) && alembic upgrade head

migrate-downgrade: ## Rollback last migration
	cd $(BACKEND_DIR) && alembic downgrade -1

migrate-new: ## Create a new migration revision
	cd $(BACKEND_DIR) && alembic revision --autogenerate -m "$(name)"

seed: ## Seed database with demo data
	python $(SCRIPTS_DIR)/seed.py

# ── Testing ───────────────────────────────────
test: ## Run all tests
test: test-backend test-frontend

test-backend: ## Run backend tests
	cd $(BACKEND_DIR) && pytest -v --cov=app --cov-report=term-missing

test-frontend: ## Run frontend tests
	cd $(FRONTEND_DIR) && npm test -- --ci --coverage

# ── Linting & Formatting ──────────────────────
lint: ## Run all linters
lint: lint-backend lint-frontend

lint-backend: ## Lint backend with ruff
	cd $(BACKEND_DIR) && ruff check app/

lint-frontend: ## Lint frontend
	cd $(FRONTEND_DIR) && npm run lint

format: ## Format code
format: format-backend format-frontend

format-backend: ## Format backend with ruff
	cd $(BACKEND_DIR) && ruff format app/

format-frontend: ## Format frontend with prettier
	cd $(FRONTEND_DIR) && npm run format

typecheck: ## Run type checking
	cd $(BACKEND_DIR) && mypy app/

# ── Building ──────────────────────────────────
build: ## Build all artifacts
build: build-backend build-frontend

build-backend: ## Build backend Docker image
	docker build -f Dockerfile.backend -t jarvisx-backend:latest .

build-frontend: ## Build frontend Docker image
	docker build -f Dockerfile.frontend -t jarvisx-frontend:latest .

# ── Development ──────────────────────────────
dev-backend: ## Run backend in development mode
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Run frontend in development mode
	cd $(FRONTEND_DIR) && npm run dev

dev: ## Run both backend and frontend in dev mode
	@echo "Starting development servers..."
	@$(MAKE) dev-backend & $(MAKE) dev-frontend & wait

# ── Docker ────────────────────────────────────
docker-up: ## Start all services with Docker Compose
	docker compose up -d --build

docker-down: ## Stop all Docker services
	docker compose down

docker-logs: ## View Docker logs
	docker compose logs -f

docker-restart: ## Restart all Docker services
	docker compose restart

# ── Deployment ────────────────────────────────
deploy: ## Deploy to production (requires SSH access)
	@echo "Starting deployment..."
	@$(MAKE) build
	@$(MAKE) docker-up

# ── Backup ────────────────────────────────────
backup: ## Backup database and uploads
	bash $(SCRIPTS_DIR)/backup.sh

backup-s3: ## Backup to S3
	bash $(SCRIPTS_DIR)/backup.sh s3

# ── Cleanup ───────────────────────────────────
clean: ## Clean up generated files
	rm -rf $(BACKEND_DIR)/*.egg-info
	rm -rf $(BACKEND_DIR)/dist
	rm -rf $(BACKEND_DIR)/build
	rm -rf $(FRONTEND_DIR)/.next
	rm -rf $(FRONTEND_DIR)/out
	rm -rf $(PROJECT_ROOT)/__pycache__
	rm -rf $(PROJECT_ROOT)/.pytest_cache
	rm -rf $(PROJECT_ROOT)/.mypy_cache
	rm -rf $(PROJECT_ROOT)/*.db
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned up generated files"

clean-all: clean ## Deep clean (remove dependencies)
	rm -rf $(BACKEND_DIR)/.venv
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(PROJECT_ROOT)/logs/*
	@echo "Deep clean complete"
