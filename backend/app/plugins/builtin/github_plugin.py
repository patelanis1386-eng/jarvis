from typing import Any, Dict, List, Optional

import httpx

from app.plugins.base import BasePlugin


class GitHubPlugin(BasePlugin):
    name = "github"
    description = "GitHub integration - repos, issues, PRs, and activity"
    version = "1.0.0"
    author = "JARVIS X"
    config_schema = {
        "type": "object",
        "properties": {
            "token": {"type": "string", "description": "GitHub personal access token"},
            "username": {"type": "string", "description": "GitHub username"},
        },
        "required": ["token"],
    }
    actions = {
        "get_repos": {"description": "List repositories", "params": {"username": ""}},
        "create_issue": {"description": "Create an issue", "params": {"repo": "", "title": "", "body": ""}},
        "get_prs": {"description": "Get pull requests", "params": {"repo": "", "state": "open"}},
        "get_activity": {"description": "Get recent activity", "params": {"username": ""}},
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None
        self.api_base = "https://api.github.com"
        self.headers = {}

    async def initialize(self) -> bool:
        self.headers = {
            "Authorization": f"Bearer {self.config.get('token', '')}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "JARVIS-X-Agent",
        }
        self._client = httpx.AsyncClient(headers=self.headers)
        return await super().initialize()

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        if not self._client:
            raise RuntimeError("GitHub plugin not initialized")

        handlers = {
            "get_repos": self._get_repos,
            "create_issue": self._create_issue,
            "get_prs": self._get_prs,
            "get_activity": self._get_activity,
        }

        handler = handlers.get(action)
        if not handler:
            raise ValueError(f"Unknown action: {action}")
        return await handler(**params)

    async def _get_repos(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        username = username or self.config.get("username", "")
        if not username:
            raise ValueError("Username is required")
        try:
            response = await self._client.get(f"{self.api_base}/users/{username}/repos")
            response.raise_for_status()
            repos = response.json()
            return [
                {
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "description": repo.get("description", ""),
                    "language": repo.get("language"),
                    "stars": repo["stargazers_count"],
                    "forks": repo["forks_count"],
                    "url": repo["html_url"],
                    "private": repo["private"],
                    "updated_at": repo.get("updated_at"),
                }
                for repo in repos
            ]
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to fetch repos: {str(e)}")

    async def _create_issue(self, repo: str, title: str, body: str = "", labels: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            response = await self._client.post(
                f"{self.api_base}/repos/{repo}/issues",
                json={
                    "title": title,
                    "body": body,
                    "labels": labels or [],
                },
            )
            response.raise_for_status()
            issue = response.json()
            return {
                "number": issue["number"],
                "title": issue["title"],
                "state": issue["state"],
                "url": issue["html_url"],
                "created_at": issue.get("created_at"),
            }
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to create issue: {str(e)}")

    async def _get_prs(self, repo: str, state: str = "open") -> List[Dict[str, Any]]:
        try:
            response = await self._client.get(
                f"{self.api_base}/repos/{repo}/pulls",
                params={"state": state},
            )
            response.raise_for_status()
            prs = response.json()
            return [
                {
                    "number": pr["number"],
                    "title": pr["title"],
                    "state": pr["state"],
                    "user": pr["user"]["login"],
                    "body": pr.get("body", ""),
                    "url": pr["html_url"],
                    "created_at": pr.get("created_at"),
                    "draft": pr.get("draft", False),
                }
                for pr in prs
            ]
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to fetch PRs: {str(e)}")

    async def _get_activity(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        username = username or self.config.get("username", "")
        if not username:
            raise ValueError("Username is required")
        try:
            response = await self._client.get(
                f"{self.api_base}/users/{username}/events",
                params={"per_page": 30},
            )
            response.raise_for_status()
            events = response.json()
            return [
                {
                    "type": event["type"],
                    "repo": event["repo"]["name"],
                    "action": event.get("payload", {}).get("action", ""),
                    "created_at": event.get("created_at"),
                    "url": f"https://github.com/{event['repo']['name']}",
                }
                for event in events
            ]
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to fetch activity: {str(e)}")

    async def cleanup(self) -> bool:
        if self._client:
            await self._client.aclose()
            self._client = None
        return await super().cleanup()
