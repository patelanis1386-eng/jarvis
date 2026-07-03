import json
from typing import Any, Dict, List, Optional

import httpx

from app.agents.base import BaseAgent


RESEARCH_SYSTEM_PROMPT = """You are an expert research agent. You conduct thorough, multi-step research on any topic.

Your research methodology:
1. Plan: Break down the research topic into sub-questions and search queries
2. Search: Execute web searches to gather information
3. Analyze: Extract key facts, claims, and evidence from sources
4. Verify: Cross-reference information and assess source credibility
5. Synthesize: Generate a comprehensive, well-structured report

Guidelines:
- Prioritize authoritative sources (academic, government, established institutions)
- Distinguish between facts, opinions, and speculation
- Note when information is contradictory or uncertain
- Cite sources for all claims
- Structure reports with clear sections and summaries
"""


class ResearchAgent(BaseAgent):
    name = "research_agent"
    description = "Multi-step research and report generation"
    capabilities = [
        "web_search", "content_analysis", "fact_checking",
        "source_verification", "report_generation"
    ]

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        openai_client=None,
        model: str = "gpt-4o",
    ):
        super().__init__(config)
        if openai_client is None:
            from app.services.mock_ai_client import MockOpenAIClient
            openai_client = MockOpenAIClient()
        self.openai_client = openai_client
        self.model = model
        self.system_prompt = config.get("system_prompt", RESEARCH_SYSTEM_PROMPT) if config else RESEARCH_SYSTEM_PROMPT
        self.max_search_results = config.get("max_search_results", 10) if config else 10

    async def process(self, input_data: Any, **kwargs) -> Any:
        topic = input_data if isinstance(input_data, str) else str(input_data)
        depth = kwargs.get("depth", "standard")

        self.add_to_history("user", f"Research topic: {topic}")
        self.update_context("topic", topic)

        plan = await self._plan_research(topic)
        self.update_context("plan", plan)

        all_sources = []
        all_findings = []

        for query in plan.get("search_queries", [topic]):
            sources = await self._search_web(query)
            all_sources.extend(sources)

            for source in sources:
                analysis = await self._analyze_source(source, topic)
                if analysis:
                    all_findings.append(analysis)

        verified_findings = await self._fact_check(all_findings)

        report = await self._generate_report(
            topic, plan, verified_findings, all_sources
        )

        result = {
            "topic": topic,
            "plan": plan,
            "sources_consulted": len(all_sources),
            "findings_count": len(verified_findings),
            "sources": all_sources[:10],
            "findings": verified_findings,
            "report": report,
            "metadata": {
                "depth": depth,
                "model": self.model,
                "timestamp": self._get_timestamp(),
            },
        }

        self.add_to_history("assistant", json.dumps({"report_summary": report[:200]}))
        return result

    async def _plan_research(self, topic: str) -> Dict[str, Any]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a research planner. Break down the research topic. Return JSON with: main_questions (list of key questions to answer), sub_topics (list of subtopics), search_queries (list of specific search queries).",
                },
                {"role": "user", "content": f"Plan research for: {topic}"},
            ],
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(response.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            return {
                "main_questions": [f"What is {topic}?"],
                "sub_topics": [topic],
                "search_queries": [topic],
            }

    async def _search_web(self, query: str) -> List[Dict[str, str]]:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json"},
                    timeout=10,
                )
                data = resp.json()
                return [
                    {
                        "url": r.get("url", ""),
                        "title": r.get("title", ""),
                        "snippet": r.get("snippet", ""),
                        "source": self._extract_domain(r.get("url", "")),
                    }
                    for r in data.get("results", [])[:self.max_search_results]
                ]
        except Exception:
            return [{
                "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
                "title": f"Wikipedia: {query}",
                "snippet": f"General information about {query}.",
                "source": "wikipedia.org",
            }]

    def _extract_domain(self, url: str) -> str:
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc
        except Exception:
            return url

    async def _analyze_source(self, source: Dict[str, str], topic: str) -> Optional[Dict[str, Any]]:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract key information from this source. Return JSON with: claim, evidence, relevance (0-1), category, source_credibility (0-1).",
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\nSource: {source['title']}\nContent: {source['snippet']}",
                },
            ],
            response_format={"type": "json_object"},
        )
        try:
            data = json.loads(response.choices[0].message.content or "{}")
            data["source_url"] = source.get("url", "")
            data["source_title"] = source.get("title", "")
            return data if data.get("claim") else None
        except json.JSONDecodeError:
            return None

    async def _fact_check(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        verified = []
        for finding in findings:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Fact-check this claim. Return JSON with: claim, is_verified (boolean), confidence (0-1), correction (if needed), evidence_summary.",
                    },
                    {
                        "role": "user",
                        "content": f"Claim: {finding.get('claim', '')}\nEvidence: {finding.get('evidence', '')}",
                    },
                ],
                response_format={"type": "json_object"},
            )
            try:
                data = json.loads(response.choices[0].message.content or "{}")
                data["original_source"] = finding.get("source_url", "")
                verified.append(data)
            except json.JSONDecodeError:
                verified.append(finding)
        return verified

    async def _generate_report(
        self,
        topic: str,
        plan: Dict[str, Any],
        findings: List[Dict[str, Any]],
        sources: List[Dict[str, str]],
    ) -> str:
        findings_summary = json.dumps(findings, indent=2)
        sources_summary = "\n".join(
            f"- [{s['title']}]({s['url']})" for s in sources[:10]
        )

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Generate a comprehensive research report in markdown format. Include: executive summary, key findings with evidence, analysis, conclusions, and recommendations. Cite sources using [Source: title](url) format.",
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nResearch Plan:\n{json.dumps(plan, indent=2)}\n\nFindings:\n{findings_summary}\n\nSources:\n{sources_summary}",
                },
            ],
            temperature=0.5,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""

    def _get_timestamp(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
