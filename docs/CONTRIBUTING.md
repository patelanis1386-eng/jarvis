# Contributing Guidelines — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04

---

## Table of Contents

1. [Code of Conduct](#1-code-of-conduct)
2. [Development Workflow](#2-development-workflow)
3. [Branch Strategy](#3-branch-strategy)
4. [Commit Conventions](#4-commit-conventions)
5. [PR Process](#5-pr-process)
6. [Code Style](#6-code-style)
7. [Testing Requirements](#7-testing-requirements)
8. [Documentation Requirements](#8-documentation-requirements)

---

## 1. Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- **Be respectful** — Disagreement is healthy; personal attacks are not
- **Be inclusive** — We welcome contributors of all backgrounds
- **Be constructive** — Focus on solutions, not blame
- **Be collaborative** — Help others learn and grow
- **Be professional** — Harassment, offensive language, and inappropriate content will not be tolerated

Instances of unacceptable behavior may be reported to the project maintainers.

---

## 2. Development Workflow

`
  ┌─────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌─────────┐
  │  Issue  │───▶│  Fork  │───▶│ Branch │───▶│   PR   │───▶│  Merge  │
  └─────────┘    └────────┘    └────────┘    └────────┘    └─────────┘
       │              │              │              │             │
       ▼              ▼              ▼              ▼             ▼
  Find / create   Fork repo to   Create feature  Open pull     Maintainer
  an issue        your account   branch          request       reviews +
                                                                 merges
`

### Step-by-Step

1. **Find or create an issue** — Check existing issues or open a new one
2. **Discuss** — For significant changes, discuss the approach in the issue first
3. **Fork & clone** — Fork the repo and clone your fork locally
4. **Create a branch** — Follow the branch naming convention (see below)
5. **Make changes** — Write code, tests, and documentation
6. **Run tests** — Ensure all tests pass
7. **Commit** — Use conventional commit messages
8. **Push** — Push to your fork
9. **Open a PR** — Against the main branch of the original repo

---

## 3. Branch Strategy

### Branch Naming

| Pattern                | Example                        | Purpose                  |
| ---------------------- | ------------------------------ | ------------------------ |
| eat/short-description | eat/voice-streaming       | New feature              |
| ix/short-description  | ix/auth-token-expiry      | Bug fix                  |
| docs/short-description | docs/api-update            | Documentation            |
| efactor/description   | efactor/ai-engine         | Code refactoring         |
| 	est/add-voice-tests   | 	est/add-voice-tests       | Adding tests             |
| chore/deps-update      | chore/deps-update          | Maintenance / deps       |
| perf/query-optimization | perf/query-optimization   | Performance improvement  |
| hotfix/urgent-fix       | hotfix/security-patch     | Urgent production fix    |

### Branch Rules

- main — Production-ready code. Protected — no direct pushes
- develop — Integration branch (if used). Feature branches merge here
- Feature branches branch off main (or develop)
- Keep branches short-lived (ideally < 1 week)
- Delete branches after merge

---

## 4. Commit Conventions

We use **Conventional Commits** for all commit messages.

### Format

`
<type>(<scope>): <description>

[optional body]

[optional footer]
`

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| eat     | A new feature                                           |
| ix      | A bug fix                                               |
| docs     | Documentation only changes                              |
| style    | Changes that do not affect meaning (formatting, etc.)   |
| efactor | Code change that neither fixes a bug nor adds a feature |
| perf     | Performance improvement                                 |
| 	est     | Adding or correcting tests                              |
| chore    | Build process, dependencies, tooling                    |
| ci       | CI/CD configuration changes                             |
| security | Security-related fixes                                  |

### Examples

`
feat(voice): add streaming TTS support with audio chunking

Implement streaming text-to-speech using SSE to deliver audio
chunks progressively, reducing perceived latency for long responses.

Closes #234
`

`
fix(auth): handle expired refresh token gracefully

Return proper 401 error instead of 500 when refresh token
has expired. Added token expiry check before database lookup.

Fixes #156
`

`
docs(api): update WebSocket event documentation

Add missing voice:start, voice:chunk, voice:end events
with example payloads.
`

### Rules

- **Scope** is optional but encouraged (e.g., chat, oice, pi, docker)
- **Description** is imperative, lowercase, no period at end
- **Body** explains what and why, not how
- **Footer** references issues: Closes #123, Fixes #456
- Maximum line length: 72 characters for subject, 80 for body

---

## 5. PR Process

### Opening a PR

1. Ensure your branch is up to date with main
2. Run all tests and lint checks locally
3. Write a clear PR title following commit conventions
4. Use the PR template (provided when opening)
5. Link related issues

### PR Template

`markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No new warnings introduced

## Related Issues
Closes #123
`

### Review Process

1. **Self-review first** — Review your own diff before requesting reviews
2. **Two approvals required** — For maintainers merging to main
3. **Review criteria**:
   - Correctness — Does the code do what it claims?
   - Security — Are there any security implications?
   - Performance — Is the approach efficient?
   - Maintainability — Is the code clear and well-structured?
   - Test coverage — Are edge cases covered?
4. **Address feedback** — Make requested changes or explain why not
5. **Squash merge** — All PR commits are squashed into one on merge

### CI/CD Pipeline

Every PR triggers:
1. **Lint** — ruff (Python), prettier/eslint (TypeScript)
2. **Type check** — mypy (Python), tsc (TypeScript)
3. **Unit tests** — pytest (Python), vitest (TypeScript)
4. **Integration tests** — pytest with test database
5. **Build** — Frontend production build
6. **Security scan** — Dependency vulnerability check

All stages must pass before merging.

---

## 6. Code Style

### Python (Backend)

- **Formatter:** [ruff](https://github.com/astral-sh/ruff) (replaces black + isort)
- **Linter:** ruff
- **Type checker:** mypy (strict mode)
- **Line length:** 88 characters (ruff default)
- **Quotes:** Double quotes

`ash
# Run linting
cd backend
ruff check .
ruff format --check .

# Auto-fix
ruff check --fix .
ruff format .

# Type checking
mypy app/ --strict
`

**Key conventions:**
- Use sync/def for all route handlers and service methods
- Type annotate all function signatures and return types
- Use Pydantic v2 models for all input/output schemas
- Use SQLAlchemy 2.0 style queries (no legacy session.query())
- Prefer pathlib.Path over os.path
- Use dependency injection via FastAPI Depends

### TypeScript (Frontend)

- **Formatter:** [Prettier](https://prettier.io/)
- **Linter:** ESLint (with TypeScript plugin)
- **Line length:** 80 characters
- **Quotes:** Single quotes
- **Semicolons:** Required

`ash
# Run linting
cd frontend
npm run lint

# Format
npm run format
npx prettier --check "src/**/*.{ts,tsx}"

# Type checking
npx tsc --noEmit
`

**Key conventions:**
- Use TypeScript strict mode
- Prefer interface over 	ype for object shapes
- Use const over let; avoid ar
- Use named exports over default exports
- React components use PascalCase; hooks use camelCase with use prefix
- Use server components by default; add 'use client' only when needed

### CSS

- **Framework:** TailwindCSS
- **No plain CSS files** unless absolutely necessary
- Use Tailwind utility classes in JSX
- Extract reusable patterns to React components, not CSS classes

---

## 7. Testing Requirements

### Backend Tests

- **Framework:** pytest with pytest-asyncio
- **Coverage target:** 80% minimum
- **Test location:** ackend/tests/

`ash
# Run all tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_chat.py -v

# Run tests matching a pattern
pytest -k "voice"
`

**What to test:**
- All API endpoints (status codes, response schemas, error cases)
- Service layer logic
- AI engine integration (mock providers)
- Database models and relationships
- Permission checks and RBAC
- Rate limiting
- WebSocket handlers

**Testing patterns:**
`python
async def test_create_conversation(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/chat/conversations",
        json={"title": "Test", "model": "gpt-4o"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test"
    assert "id" in data

async def test_unauthorized_access(client: AsyncClient):
    response = await client.get("/api/v1/chat/conversations")
    assert response.status_code == 401
`

### Frontend Tests

- **Framework:** Vitest + React Testing Library
- **E2E:** Playwright
- **Coverage target:** 70% minimum
- **Test location:** rontend/tests/ or co-located *.test.tsx

`ash
# Unit tests
cd frontend
npm run test

# E2E tests
npm run test:e2e

# With coverage
npm run test -- --coverage
`

**What to test:**
- Component rendering and user interaction
- State management (Zustand stores)
- API client functions
- WebSocket event handling
- Error states and loading states
- Form validation

### Pre-commit Checklist

- [ ] All tests pass locally
- [ ] Linting passes with no warnings
- [ ] Type checking passes
- [ ] No print() / console.log() left in code
- [ ] No debugger statements
- [ ] Environment variables are documented in .env.example
- [ ] API changes are reflected in OpenAPI schemas

---

## 8. Documentation Requirements

### When to Document

- **New features** — Must include user-facing documentation
- **API changes** — Must update the relevant API docs
- **Configuration changes** — Must update environment variable docs
- **Architecture changes** — Must update architecture documentation
- **Breaking changes** — Must include migration guide

### Documentation Standards

| Document         | Location             | Format     |
| ---------------- | -------------------- | ---------- |
| Project overview | README.md          | Markdown   |
| API Reference    | docs/API.md        | Markdown   |
| Architecture     | docs/ARCHITECTURE.md | Markdown |
| Installation     | docs/INSTALLATION.md | Markdown |
| Deployment       | docs/DEPLOYMENT.md | Markdown   |
| Contributing     | docs/CONTRIBUTING.md | Markdown |
| Security         | docs/SECURITY.md   | Markdown   |
| Plugin dev       | docs/PLUGIN_DEV.md | Markdown   |

### Code Documentation

- **Python:** Docstrings follow Google style:
  `python
  def get_conversation(conversation_id: UUID) -> Conversation:
      \"\"\"Retrieve a conversation by its ID.

      Args:
          conversation_id: The UUID of the conversation.

      Returns:
          The Conversation object if found.

      Raises:
          NotFoundError: If no conversation exists with the given ID.
      \"\"\"
  `

- **TypeScript:** JSDoc for exported functions and complex types:
  `	ypescript
  /**
   * Creates a new chat conversation.
   * @param title - The conversation title
   * @param model - The AI model to use
   * @returns The created conversation
   * @throws {ApiError} If the request fails
   */
  `

### Changelog

Every release updates CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format:

- ### Added — New features
- ### Changed — Changes in behavior
- ### Deprecated — Soon-to-be-removed features
- ### Removed — Removed features
- ### Fixed — Bug fixes
- ### Security — Security fixes

---

*Thank you for contributing to JARVIS X! 🚀*
