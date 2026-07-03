# Plugin Development Guide — JARVIS X

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-07-04

---

## Table of Contents

1. [Plugin Architecture Overview](#1-plugin-architecture-overview)
2. [Creating a Plugin](#2-creating-a-plugin)
3. [Plugin Configuration Schema](#3-plugin-configuration-schema)
4. [Plugin Lifecycle](#4-plugin-lifecycle)
5. [Available Hooks and Events](#5-available-hooks-and-events)
6. [Example: Weather Plugin Walkthrough](#6-example-weather-plugin-walkthrough)
7. [Testing Plugins](#7-testing-plugins)
8. [Publishing to Marketplace](#8-publishing-to-marketplace)


---

## 1. Plugin Architecture Overview

JARVIS X's plugin system allows developers to extend the platform with custom capabilities. Plugins can expose actions to the AI assistant, react to system events, and integrate with external services.

`
┌────────────────────────────────────────────────────────────────────────────┐
│                        PLUGIN ARCHITECTURE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN PACKAGE                                   │  │
│  │                                                                       │  │
│  │  my-weather-plugin/                                                   │  │
│  │  ├── manifest.json      # Plugin metadata and actions                │  │
│  │  ├── plugin.py          # Plugin implementation                       │  │
│  │  ├── config_schema.json # Optional: configuration schema              │  │
│  │  ├── requirements.txt   # Optional: Python dependencies               │  │
│  │  ├── assets/            # Optional: UI assets                         │  │
│  │  │   ├── icon.svg                                                      │  │
│  │  │   └── screenshot.png                                                │  │
│  │  └── README.md          # Optional: plugin documentation              │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      CORE INTERFACES                                  │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │  │   BasePlugin    │  │  PluginContext   │  │   PluginSandbox     │  │  │
│  │  │   (ABC)         │  │  (API for plugins)│  │  (Security wrapper) │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  │         │                      │                       │              │  │
│  └─────────┼──────────────────────┼───────────────────────┼──────────────┘  │
│            │                      │                       │                 │
│            ▼                      ▼                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN MANAGER (manager.py)                     │  │
│  │                                                                       │  │
│  │  - Discovers plugins from filesystem / marketplace                   │  │
│  │  - Loads and validates manifests                                     │  │
│  │  - Instantiates plugin classes                                       │  │
│  │  - Manages lifecycle (init, activate, deactivate, cleanup)           │  │
│  │  - Routes action calls to correct plugin                             │  │
│  │  - Enforces sandboxing and permissions                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      PLUGIN CONTEXT (passed to plugin)                │  │
│  │                                                                       │  │
│  │  PluginContext provides:                                              │  │
│  │  - config: Dict[str, Any]       # User plugin configuration          │  │
│  │  - user_id: UUID                # Current user                        │  │
│  │  - memory: MemoryService        # Store/retrieve memories            │  │
│  │  - knowledge: KnowledgeService  # Query knowledge graph              │  │
│  │  - http: AsyncHTTPClient        # Make HTTP requests                 │  │
│  │  - cache: CacheService          # Key-value cache                    │  │
│  │  - logger: Logger               # Plugin-specific logger             │  │
│  │  - secrets: Dict[str, str]      # User stored secrets                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
`

### Key Concepts

- **Plugin** - A self-contained package that adds functionality
- **Action** - An operation a plugin can perform (e.g., get_weather)
- **Event Hook** - A lifecycle callback (e.g., on_conversation_start)
- **Manifest** - JSON file describing the plugin metadata and API
- **Sandbox** - Security boundary for untrusted plugins
- **Context** - Object passed to plugins providing access to system services


---

## 2. Creating a Plugin

### 2.1 Minimum Structure

A plugin requires at least two files:

`
my-plugin/
├── manifest.json
└── plugin.py
`

### 2.2 Manifest File

\manifest.json\ defines the plugin metadata, permissions, and actions.

\\\json
{
  \"name\": \"my-plugin\",
  \"version\": \"1.0.0\",
  \"display_name\": \"My Plugin\",
  \"description\": \"Does something useful\",
  \"author\": \"Your Name\",
  \"license\": \"MIT\",
  \"homepage\": \"https://github.com/your-org/my-plugin\",
  \"icon\": \"assets/icon.svg\",
  \"min_api_version\": \"1.0.0\",
  \"permissions\": [
    \"network:http\",
    \"memory:read\",
    \"memory:write\"
  ],
  \"actions\": {
    \"greet\": {
      \"description\": \"Greet a person\",
      \"params\": {
        \"name\": {
          \"type\": \"string\",
          \"description\": \"The name of the person to greet\",
          \"required\": true
        },
        \"enthusiasm\": {
          \"type\": \"integer\",
          \"description\": \"Enthusiasm level (1-10)\",
          \"required\": false,
          \"default\": 5,
          \"minimum\": 1,
          \"maximum\": 10
        }
      }
    }
  },
  \"config_schema\": {
    \"type\": \"object\",
    \"properties\": {
      \"api_key\": {
        \"type\": \"string\",
        \"description\": \"API key for the service\"
      },
      \"units\": {
        \"type\": \"string\",
        \"enum\": [\"metric\", \"imperial\"],
        \"default\": \"metric\"
      }
    },
    \"required\": [\"api_key\"]
  }
}
\\\

| Manifest Field    | Required | Description                                  |
| ----------------- | -------- | -------------------------------------------- |
| \
ame\           | Yes      | Unique plugin identifier (snake_case)        |
| \ersion\        | Yes      | Semantic version                             |
| \display_name\   | Yes      | Human-readable name                          |
| \description\    | Yes      | Short description                            |
| \uthor\         | Yes      | Plugin author                                |
| \license\        | Yes      | License identifier                           |
| \homepage\       | No       | Project URL                                  |
| \icon\           | No       | Path to icon file (relative to plugin dir)   |
| \min_api_version\| Yes      | Minimum JARVIS X API version required         |
| \permissions\    | Yes      | List of required permissions                 |
| \ctions\        | Yes      | Map of action names to action definitions    |
| \config_schema\  | No       | JSON Schema for plugin configuration         |
| \hooks\          | No       | Event hooks the plugin subscribes to         |


### 2.3 Plugin Class

\plugin.py\ implements the \BasePlugin\ abstract class:

\\\python
from app.plugins.base import BasePlugin, PluginContext, ActionResponse

class MyPlugin(BasePlugin):
    async def initialize(self, ctx: PluginContext) -> None:
        self.name = ctx.config.get(\"name\", \"World\")
        self.logger = ctx.logger
        self.logger.info(f\"Plugin initialized with name: {self.name}\")

    async def activate(self) -> None:
        self.logger.info(\"Plugin activated\")

    async def deactivate(self) -> None:
        self.logger.info(\"Plugin deactivated\")

    async def cleanup(self) -> None:
        self.logger.info(\"Plugin cleaned up\")

    async def execute_action(
        self, action: str, params: dict, ctx: PluginContext
    ) -> ActionResponse:
        if action == \"greet\":
            return await self._greet(params)
        raise ValueError(f\"Unknown action: {action}\")

    async def _greet(self, params: dict) -> ActionResponse:
        name = params.get(\"name\", \"World\")
        enthusiasm = min(params.get(\"enthusiasm\", 5), 10)
        greeting = f\"Hello, {name}!\" + (\"!!!\" if enthusiasm > 7 else \"\")
        return ActionResponse(
            success=True,
            result={\"greeting\": greeting},
            message=greeting,
        )
\\\

### 2.4 BasePlugin Reference

\\\python
class BasePlugin(ABC):
    name: str
    version: str
    display_name: str
    manifest: dict

    async def initialize(self, ctx: PluginContext) -> None:
        \"\"\"Initialize plugin resources. Called once during load.\"\"\"

    async def activate(self) -> None:
        \"\"\"Activate plugin for a user session.\"\"\"

    async def deactivate(self) -> None:
        \"\"\"Deactivate plugin for a user session.\"\"\"

    async def cleanup(self) -> None:
        \"\"\"Cleanup resources. Called during uninstall.\"\"\"

    @abstractmethod
    async def execute_action(
        self, action: str, params: dict, ctx: PluginContext
    ) -> ActionResponse:
        ...
\\\


---

## 3. Plugin Configuration Schema

Plugin configurations use JSON Schema (draft-07) format defined in \config_schema.json\:

\\\json
{
  \"\\": \"http://json-schema.org/draft-07/schema#\",
  \"type\": \"object\",
  \"properties\": {
    \"api_key\": {
      \"type\": \"string\",
      \"description\": \"API key for authentication\",
      \"secret\": true
    },
    \"timeout\": {
      \"type\": \"integer\",
      \"description\": \"Request timeout in seconds\",
      \"default\": 30,
      \"minimum\": 5,
      \"maximum\": 120
    },
    \"enable_notifications\": {
      \"type\": \"boolean\",
      \"description\": \"Send desktop notifications\",
      \"default\": false
    }
  },
  \"required\": [\"api_key\"]
}
\\\

### Supported Schema Types

| JSON Schema Type | UI Component              | Notes                          |
| ---------------- | ------------------------- | ------------------------------ |
| \string\        | Text input                |                                |
| string (format=password) | Password field       | Masked input                   |
| string (format=uri) | URL input              | Validation                     |
| string (enum)    | Dropdown                  |                                |
| \integer\       | Number input              |                                |
| \
umber\        | Slider / Number input     |                                |
| \oolean\       | Toggle switch             |                                |
| \rray\         | Multi-select / List       |                                |
| \object\        | Nested section            |                                |

### Secrets

Fields marked with \"secret\": true are encrypted at rest using AES-256-GCM, never returned in API responses, exposed to plugins via ctx.secrets (decrypted in-memory), and hidden in the UI.

---

## 4. Plugin Lifecycle

\\\
                    +-------------+
                    |  DISCOVERED |
                    +------+------+
                           |
                    +------v------+
                    |   LOADED    |  manifest validated, module imported
                    +------+------+
                           |
                    +------v------+
                    | INITIALIZED |  initialize() called
                    +------+------+
                           |
              +------------+------------+
              |            |            |
       +------v------+ +--v-------+ +--v----------+
       |  ACTIVATED  | |ACTIVATED | |  ACTIVATED   |
       | (user 1)    | | (user 2) | |  (user N)    |
       +------+------+ +--+-------+ +--+-----------+
              |            |            |
       +------v------+ +--v-------+ +--v----------+
       |DEACTIVATED  | |DEACTIVATED| |DEACTIVATED  |
       +------+------+ +--+-------+ +--+-----------+
              |            |            |
              +------------+------------+
                           |
                    +------v------+
                    |   CLEANED   |  cleanup() called
                    +-------------+
\\\

| Phase          | Trigger                        | Description                                 |
| -------------- | ------------------------------ | ------------------------------------------- |
| **Discovered** | Plugin directory scan          | Found in filesystem or marketplace           |
| **Loaded**     | User opens app                 | Manifest validated, module imported          |
| **Initialized**| First access by any user       | Resources allocated (API clients, DB pools) |
| **Activated**  | User enables plugin            | Per-user setup                              |
| **Deactivated**| User disables plugin           | Per-user teardown                           |
| **Cleaned**    | Plugin uninstalled or updated  | Resources released                          |


---

## 5. Available Hooks and Events

Plugins can subscribe to system events by listing hooks in the manifest:

\\\json
{
  \"hooks\": {
    \"on_message_created\": {
      \"description\": \"Called when a new message is created\"
    },
    \"on_conversation_start\": {
      \"description\": \"Called when a new conversation starts\"
    },
    \"on_user_login\": {
      \"description\": \"Called when user logs in\"
    }
  }
}
\\\

### Available Events

| Event                    | Payload                                          | Description                              |
| ------------------------ | ------------------------------------------------ | ---------------------------------------- |
| \pp:startup\          | {}                                               | Application started                      |
| \pp:shutdown\         | {}                                               | Application shutting down                |
| \user:login\           | { user_id, ip_address }                          | User logged in                           |
| \user:logout\          | { user_id }                                      | User logged out                          |
| \conversation:created\ | { conversation_id, user_id, model }              | New conversation started                 |
| \conversation:deleted\ | { conversation_id, user_id }                     | Conversation deleted                     |
| \message:created\      | { message_id, conversation_id, content, role }   | Message added                            |
| \message:completed\    | { message_id, tokens_used }                      | AI response completed                    |
| \memory:created\       | { memory_id, content, importance }               | Memory stored                            |
| \memory:retrieved\     | { query, results_count }                         | Memory retrieved                         |
| \utomation:completed\ | { automation_id, status, duration_ms }           | Automation workflow completed            |
| \plugin:installed\     | { plugin_id, user_id }                           | Plugin installed                         |
| \plugin:uninstalled\   | { plugin_id, user_id }                           | Plugin uninstalled                       |
| \oice:transcription_complete\ | { duration, text_length }                 | Voice transcription finished             |

### Implementing Hooks

\\\python
async def on_event(self, event: str, data: dict, ctx: PluginContext) -> None:
    if event == \"user:login\":
        ctx.logger.info(f\"User {data['user_id']} logged in\")
    elif event == \"conversation:created\":
        ctx.logger.info(f\"New conversation: {data['conversation_id']}\")
    elif event == \"message:created\":
        if data[\"role\"] == \"user\":
            await self._on_user_message(data, ctx)
\\\


---

## 6. Example: Weather Plugin Walkthrough

### Step 1: Create Plugin Directory

\\\
weather-plugin/
├── manifest.json
├── plugin.py
├── config_schema.json
├── requirements.txt
└── assets/
    └── icon.svg
\\\

### Step 2: Define Manifest

\manifest.json\:

\\\json
{
  \"name\": \"weather\",
  \"version\": \"1.0.0\",
  \"display_name\": \"Weather Assistant\",
  \"description\": \"Get real-time weather forecasts, current conditions, and severe weather alerts.\",
  \"author\": \"JARVIS X Official\",
  \"license\": \"MIT\",
  \"icon\": \"assets/icon.svg\",
  \"min_api_version\": \"1.0.0\",
  \"permissions\": [\"network:http\", \"memory:read\", \"memory:write\"],
  \"actions\": {
    \"get_current\": {
      \"description\": \"Get current weather conditions\",
      \"params\": {
        \"location\": { \"type\": \"string\", \"required\": true },
        \"units\": { \"type\": \"string\", \"enum\": [\"metric\", \"imperial\"], \"default\": \"metric\" }
      }
    },
    \"get_forecast\": {
      \"description\": \"Get weather forecast\",
      \"params\": {
        \"location\": { \"type\": \"string\", \"required\": true },
        \"days\": { \"type\": \"integer\", \"minimum\": 1, \"maximum\": 7, \"default\": 3 },
        \"units\": { \"type\": \"string\", \"enum\": [\"metric\", \"imperial\"], \"default\": \"metric\" }
      }
    }
  },
  \"config_schema\": {
    \"type\": \"object\",
    \"properties\": {
      \"api_key\": { \"type\": \"string\", \"description\": \"OpenWeatherMap API key\", \"secret\": true },
      \"default_units\": { \"type\": \"string\", \"enum\": [\"metric\", \"imperial\"], \"default\": \"metric\" },
      \"cache_ttl_minutes\": { \"type\": \"integer\", \"default\": 15, \"minimum\": 1, \"maximum\": 60 }
    },
    \"required\": [\"api_key\"]
  }
}
\\\

### Step 3: Implement Plugin

\\\python
import httpx
from datetime import datetime, timezone
from app.plugins.base import BasePlugin, PluginContext, ActionResponse


class WeatherPlugin(BasePlugin):
    BASE_URL = \"https://api.openweathermap.org/data/2.5\"
    GEO_URL = \"https://api.openweathermap.org/geo/1.0\"

    async def initialize(self, ctx: PluginContext) -> None:
        self.api_key = ctx.config.get(\"api_key\")
        self.default_units = ctx.config.get(\"default_units\", \"metric\")
        self.cache_ttl = ctx.config.get(\"cache_ttl_minutes\", 15) * 60
        self.client = httpx.AsyncClient(timeout=10.0)

    async def cleanup(self) -> None:
        await self.client.aclose()

    async def execute_action(
        self, action: str, params: dict, ctx: PluginContext
    ) -> ActionResponse:
        try:
            if action == \"get_current\":
                return await self._get_current(params, ctx)
            elif action == \"get_forecast\":
                return await self._get_forecast(params, ctx)
            else:
                raise ValueError(f\"Unknown action: {action}\")
        except httpx.HTTPStatusError as e:
            return ActionResponse(success=False, error=f\"API error: {e.response.status_code}\")
        except Exception as e:
            return ActionResponse(success=False, error=str(e))

    async def _geocode(self, location: str) -> dict:
        response = await self.client.get(
            f\"{self.GEO_URL}/direct\",
            params={\"q\": location, \"limit\": 1, \"appid\": self.api_key},
        )
        response.raise_for_status()
        data = response.json()
        if not data:
            raise ValueError(f\"Location not found: {location}\")
        return data[0]

    async def _get_current(self, params: dict, ctx: PluginContext) -> ActionResponse:
        location = params[\"location\"]
        units = params.get(\"units\", self.default_units)

        cache_key = f\"weather:current:{location}:{units}\"
        cached = await ctx.cache.get(cache_key)
        if cached:
            return ActionResponse(success=True, result=cached)

        geo = await self._geocode(location)
        response = await self.client.get(
            f\"{self.BASE_URL}/weather\",
            params={
                \"lat\": geo[\"lat\"], \"lon\": geo[\"lon\"],
                \"units\": units, \"appid\": self.api_key,
            },
        )
        response.raise_for_status()
        data = response.json()

        result = {
            \"location\": geo[\"name\"],
            \"temperature\": data[\"main\"][\"temp\"],
            \"feels_like\": data[\"main\"][\"feels_like\"],
            \"humidity\": data[\"main\"][\"humidity\"],
            \"description\": data[\"weather\"][0][\"description\"],
            \"wind_speed\": data[\"wind\"][\"speed\"],
            \"units\": units,
        }

        await ctx.cache.set(cache_key, result, ttl=self.cache_ttl)
        return ActionResponse(success=True, result=result)

    async def _get_forecast(self, params: dict, ctx: PluginContext) -> ActionResponse:
        location = params[\"location\"]
        days = min(params.get(\"days\", 3), 7)
        units = params.get(\"units\", self.default_units)

        cache_key = f\"weather:forecast:{location}:{days}:{units}\"
        cached = await ctx.cache.get(cache_key)
        if cached:
            return ActionResponse(success=True, result=cached)

        geo = await self._geocode(location)
        response = await self.client.get(
            f\"{self.BASE_URL}/forecast\",
            params={
                \"lat\": geo[\"lat\"], \"lon\": geo[\"lon\"],
                \"units\": units, \"cnt\": days * 8, \"appid\": self.api_key,
            },
        )
        response.raise_for_status()
        data = response.json()

        daily = {}
        for item in data[\"list\"]:
            dt = datetime.fromtimestamp(item[\"dt\"], tz=timezone.utc)
            date_str = dt.strftime(\"%Y-%m-%d\")
            if date_str not in daily:
                daily[date_str] = {\"date\": date_str, \"temps\": [], \"descriptions\": []}
            daily[date_str][\"temps\"].append(item[\"main\"][\"temp\"])
            daily[date_str][\"descriptions\"].append(item[\"weather\"][0][\"description\"])

        forecast = []
        for date_str, d in list(daily.items())[:days]:
            forecast.append({
                \"date\": date_str,
                \"high\": max(d[\"temps\"]),
                \"low\": min(d[\"temps\"]),
                \"description\": max(set(d[\"descriptions\"]), key=d[\"descriptions\"].count),
            })

        result = {\"location\": geo[\"name\"], \"forecast\": forecast, \"units\": units}
        await ctx.cache.set(cache_key, result, ttl=self.cache_ttl)
        return ActionResponse(success=True, result=result)
\\\


### Step 4: Test the Plugin

\\\python
import pytest
from unittest.mock import AsyncMock, patch
from weather_plugin.plugin import WeatherPlugin

@pytest.fixture
def plugin():
    return WeatherPlugin()

@pytest.fixture
def mock_ctx():
    ctx = AsyncMock()
    ctx.config = {\"api_key\": \"test-key\", \"default_units\": \"metric\", \"cache_ttl_minutes\": 15}
    ctx.memory = AsyncMock()
    ctx.cache = AsyncMock()
    ctx.cache.get.return_value = None
    ctx.logger = AsyncMock()
    return ctx

@pytest.mark.asyncio
async def test_get_current_weather(plugin, mock_ctx):
    with patch(\"httpx.AsyncClient.get\") as mock_get:
        mock_get.side_effect = [
            AsyncMock(status_code=200, json=lambda: [{\"name\": \"London\", \"lat\": 51.5, \"lon\": -0.13}]),
            AsyncMock(status_code=200, json=lambda: {
                \"main\": {\"temp\": 15.0, \"feels_like\": 13.0, \"humidity\": 72},
                \"weather\": [{\"description\": \"clear sky\", \"icon\": \"01d\"}],
                \"wind\": {\"speed\": 5.2},
            }),
        ]

        await plugin.initialize(mock_ctx)
        result = await plugin.execute_action(\"get_current\", {\"location\": \"London\"}, mock_ctx)

        assert result.success is True
        assert result.result[\"temperature\"] == 15.0
        assert result.result[\"description\"] == \"clear sky\"

@pytest.mark.asyncio
async def test_invalid_location(plugin, mock_ctx):
    with patch(\"httpx.AsyncClient.get\") as mock_get:
        mock_get.return_value = AsyncMock(status_code=200, json=lambda: [])
        await plugin.initialize(mock_ctx)
        result = await plugin.execute_action(\"get_current\", {\"location\": \"Nowhere\"}, mock_ctx)
        assert result.success is False
\\\

---

## 7. Testing Plugins

### Framework

Use \pytest\ with \pytest-asyncio\ for testing plugins.

### Running Tests

\\\ash
# Run plugin tests in isolation
cd weather-plugin
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx
python -m pytest tests/ -v
\\\

### Test Coverage Areas

- Unit tests for each action with valid, invalid, and edge-case inputs
- Error handling for network failures, API errors, invalid config
- Caching behavior (cache hits vs misses)
- Memory/knowledge storage side effects
- Permission enforcement

---

## 8. Publishing to Marketplace

### Submission Requirements

1. Manifest is valid with all required fields and semver versioning
2. Plugin has passing tests
3. No hardcoded secrets - use ctx.config and ctx.secrets
4. Minimal permissions declared (only what is needed)
5. README.md explains usage
6. Icon provided at assets/icon.svg (SVG, min 48x48)

### Submission Process

\\\ash
# Package your plugin
cd weather-plugin
zip -r ../weather-plugin.zip . -x \"tests/*\" -x \"__pycache__/*\"

# Submit via CLI or marketplace UI
# Go to Settings > Plugins > Publish Plugin
\\\

### Marketplace Listing Fields

| Field             | Required | Description                           |
| ----------------- | -------- | ------------------------------------- |
| name              | Yes      | Unique slug                             |
| display_name      | Yes      | Title shown in marketplace              |
| description       | Yes      | Short description (max 200 chars)       |
| long_description  | No       | Full description (markdown)             |
| category          | Yes      | utilities, productivity, social, etc.   |
| screenshots       | No       | Up to 5 screenshots                     |
| source_url        | No       | Link to source repository               |

### Review Process

1. Automated checks: manifest validation, permissions review, virus scan
2. Manual review: code quality, security, documentation
3. Beta testing in sandbox environment
4. Approval and publication to marketplace

### Approval Criteria

- Plugin works as described
- No security vulnerabilities
- No excessive permissions
- Proper error handling
- User data handled responsibly
- No deceptive functionality

### Updating

\\\ash
# Update version in manifest.json
# Re-package and submit
jarvis plugin:publish weather-plugin.zip --update
\\\

---

*For questions about plugin development, join our developer community or open a discussion on GitHub.*
