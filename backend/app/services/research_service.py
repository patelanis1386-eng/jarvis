import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from sqlalchemy import select, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.research import ResearchProject, ResearchSource, ResearchFinding


class ResearchNotFoundError(Exception):
    pass


class ResearchService:
    def __init__(
        self,
        db: AsyncSession,
        openai_client=None,
        model: str = "gpt-4o",
        search_api_key: Optional[str] = None,
    ):
        self.db = db
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model
        self.search_api_key = search_api_key
        self._active_research: Dict[str, bool] = {}

    async def start_research(
        self, user_id: str, topic: str, depth: str = "standard",
        include_images: bool = False, max_sources: int = 10
    ) -> ResearchProject:
        project = ResearchProject(
            id=str(uuid4()),
            user_id=user_id,
            topic=topic,
            status="in_progress",
            depth=depth,
            include_images=include_images,
            progress=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)

        asyncio.create_task(self._execute_research(project.id, max_sources))
        return project

    async def _execute_research(self, project_id: str, max_sources: int):
        self._active_research[project_id] = True
        result = await self.db.execute(
            select(ResearchProject).where(ResearchProject.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return

        try:
            project.progress = 10
            await self.db.commit()

            plan = await self._plan_research(project.topic)
            project.progress = 20
            project.research_plan = plan
            await self.db.commit()

            if not self._active_research.get(project_id):
                return

            sources = await self._search_web(project.topic, max_sources)
            project.progress = 40
            await self.db.commit()

            for src in sources:
                source = ResearchSource(
                    id=str(uuid4()),
                    project_id=project_id,
                    url=src["url"],
                    title=src.get("title", ""),
                    snippet=src.get("snippet", ""),
                    relevance_score=src.get("relevance", 0.5),
                    is_verified=False,
                    created_at=datetime.now(timezone.utc),
                )
                self.db.add(source)
            await self.db.commit()
            project.progress = 60

            if not self._active_research.get(project_id):
                return

            findings = await self._analyze_sources(project.topic, sources)
            for finding in findings:
                finding_entry = ResearchFinding(
                    id=str(uuid4()),
                    project_id=project_id,
                    claim=finding["claim"],
                    evidence=finding.get("evidence", ""),
                    confidence=finding.get("confidence", 0.5),
                    source_urls=finding.get("sources", []),
                    category=finding.get("category", "general"),
                    created_at=datetime.now(timezone.utc),
                )
                self.db.add(finding_entry)
            await self.db.commit()
            project.progress = 80

            if not self._active_research.get(project_id):
                return

            verified_findings = await self._fact_check(findings)
            for vf in verified_findings:
                find_result = await self.db.execute(
                    select(ResearchFinding).where(
                        ResearchFinding.project_id == project_id,
                        ResearchFinding.claim == vf["claim"],
                    )
                )
                find_entry = find_result.scalar_one_or_none()
                if find_entry:
                    find_entry.confidence = vf.get("verified_confidence", find_entry.confidence)
                    find_entry.is_verified = vf.get("is_verified", False)

            await self.db.commit()
            project.progress = 90

            if not self._active_research.get(project_id):
                return

            summary = await self._generate_summary(project.topic, findings, sources)
            project.summary = summary
            project.status = "completed"
            project.progress = 100
            project.completed_at = datetime.now(timezone.utc)
            await self.db.commit()

        except Exception as e:
            project.status = "failed"
            project.error = str(e)
            await self.db.commit()
        finally:
            self._active_research.pop(project_id, None)

    async def _plan_research(self, topic: str) -> Dict[str, Any]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a research planning assistant. Create a structured research plan for the given topic. Return JSON with: main_questions, sub_topics, search_queries, methodology.",
                },
                {"role": "user", "content": f"Create a research plan for: {topic}"},
            ],
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(response.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            return {"main_questions": [], "sub_topics": [topic], "search_queries": [topic]}

    async def _search_web(self, query: str, max_results: int = 10) -> List[Dict[str, str]]:
        if self.search_api_key:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        "https://api.duckduckgo.com/",
                        params={"q": query, "format": "json", "max_results": max_results},
                        timeout=10,
                    )
                    data = resp.json()
                    return [
                        {"url": r.get("url", ""), "title": r.get("title", ""),
                         "snippet": r.get("snippet", ""), "relevance": 0.5}
                        for r in data.get("results", [])[:max_results]
                    ]
            except Exception:
                pass

        return [
            {
                "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
                "title": f"Wikipedia: {query}",
                "snippet": f"Information about {query} from Wikipedia.",
                "relevance": 0.8,
            },
            {
                "url": f"https://www.google.com/search?q={query}",
                "title": f"Search results for {query}",
                "snippet": f"Various sources about {query}.",
                "relevance": 0.6,
            },
        ]

    async def _analyze_sources(
        self, topic: str, sources: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        source_text = "\n".join(
            f"- {s['title']}: {s['snippet']}" for s in sources[:5]
        )
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Analyze the research sources and extract key findings. Return a JSON array of findings with: claim, evidence, confidence (0-1), sources (array of URLs), category.",
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nSources:\n{source_text}",
                },
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            return data.get("findings", [data] if "claim" in data else [])
        except json.JSONDecodeError:
            return [{"claim": f"Analysis of {topic}", "evidence": response.choices[0].message.content, "confidence": 0.5}]

    async def _fact_check(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        claims_text = "\n".join(
            f"- Claim: {f['claim']} (confidence: {f.get('confidence', 0.5)})"
            for f in findings
        )
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Fact-check each claim. Return JSON array with: claim, is_verified (bool), verified_confidence (0-1), correction (if needed).",
                },
                {"role": "user", "content": f"Claims to verify:\n{claims_text}"},
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            return data.get("results", [])
        except json.JSONDecodeError:
            return [{"claim": f["claim"], "is_verified": True, "verified_confidence": f.get("confidence", 0.5)} for f in findings]

    async def _generate_summary(
        self, topic: str, findings: List[Dict[str, Any]], sources: List[Dict[str, str]]
    ) -> str:
        findings_text = json.dumps(findings, indent=2)
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Generate a comprehensive research summary based on the findings. Include key insights, evidence, and conclusions. Write in markdown format with sections.",
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nFindings:\n{findings_text}",
                },
            ],
        )
        return response.choices[0].message.content or ""

    async def get_results(self, project_id: str) -> ResearchProject:
        result = await self.db.execute(
            select(ResearchProject).where(ResearchProject.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise ResearchNotFoundError(f"Research project {project_id} not found")
        return project

    async def cancel_research(self, project_id: str) -> bool:
        self._active_research[project_id] = False
        result = await self.db.execute(
            select(ResearchProject).where(ResearchProject.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise ResearchNotFoundError(f"Research project {project_id} not found")
        project.status = "cancelled"
        await self.db.commit()
        return True

    async def export_research(
        self, project_id: str, format: str = "markdown"
    ) -> str:
        project = await self.get_results(project_id)

        sources_result = await self.db.execute(
            select(ResearchSource).where(ResearchSource.project_id == project_id)
        )
        sources = sources_result.scalars().all()

        findings_result = await self.db.execute(
            select(ResearchFinding).where(ResearchFinding.project_id == project_id)
        )
        findings = findings_result.scalars().all()

        if format == "markdown":
            md = f"# Research: {project.topic}\n\n"
            md += f"**Status:** {project.status}\n"
            md += f"**Depth:** {project.depth}\n"
            md += f"**Created:** {project.created_at.isoformat()}\n\n"

            if project.research_plan:
                md += "## Research Plan\n\n"
                plan = project.research_plan
                if isinstance(plan, dict):
                    for key, value in plan.items():
                        md += f"### {key}\n{value}\n\n"

            md += "## Findings\n\n"
            for f in findings:
                md += f"### {f.claim}\n"
                md += f"- **Confidence:** {f.confidence:.2f}\n"
                md += f"- **Category:** {f.category}\n"
                md += f"- **Evidence:** {f.evidence}\n\n"

            md += "## Sources\n\n"
            for s in sources:
                md += f"- [{s.title}]({s.url})\n"

            if project.summary:
                md += f"\n## Summary\n\n{project.summary}\n"

            return md
        elif format == "pdf":
            from app.utils.file import generate_pdf
            md_content = await self.export_research(project_id, "markdown")
            pdf_bytes = await generate_pdf(md_content, f"research_{project_id}.pdf")
            return pdf_bytes.decode("latin-1", errors="replace")

        raise ValueError(f"Unsupported export format: {format}")
