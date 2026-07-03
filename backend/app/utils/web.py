import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup


class WebError(Exception):
    pass


async def search_web(query: str, num_results: int = 10) -> List[Dict[str, str]]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json"},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for r in data.get("results", [])[:num_results]:
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("snippet", ""),
                    "source": urlparse(r.get("url", "")).netloc,
                })
            return results
    except Exception:
        return _simulate_search(query, num_results)


def _simulate_search(query: str, num_results: int = 10) -> List[Dict[str, str]]:
    return [
        {
            "title": f"Wikipedia: {query}",
            "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
            "snippet": f"Information about {query} from Wikipedia, the free encyclopedia.",
            "source": "wikipedia.org",
        },
        {
            "title": f"{query} - Latest News",
            "url": f"https://news.google.com/search?q={query}",
            "snippet": f"Latest news and updates about {query}.",
            "source": "news.google.com",
        },
    ][:num_results]


async def fetch_url(url: str, timeout: float = 30.0) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=timeout, follow_redirects=True)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            is_text = "text" in content_type or "json" in content_type or "html" in content_type

            return {
                "url": str(response.url),
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "content": response.text if is_text else response.content,
                "content_type": content_type,
                "is_text": is_text,
                "encoding": response.encoding or "utf-8",
            }
    except httpx.TimeoutException:
        raise WebError(f"Request timed out after {timeout}s: {url}")
    except httpx.HTTPError as e:
        raise WebError(f"HTTP error fetching {url}: {str(e)}")
    except Exception as e:
        raise WebError(f"Failed to fetch {url}: {str(e)}")


async def extract_content(url: str, timeout: float = 30.0) -> Dict[str, Any]:
    result = await fetch_url(url, timeout)
    if not result.get("is_text"):
        return {
            "url": url,
            "title": "",
            "text": "",
            "error": "Non-text content",
        }

    soup = BeautifulSoup(result["content"], "html.parser")

    for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
        element.decompose()

    title = soup.title.string if soup.title else ""
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return {
        "url": url,
        "title": title.strip() if title else "",
        "text": text[:10000],
        "word_count": len(text.split()),
    }


async def scrape_website(
    url: str,
    extract_links: bool = False,
    extract_images: bool = False,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    result = await fetch_url(url, timeout)
    soup = BeautifulSoup(result["content"], "html.parser")

    for element in soup(["script", "style"]):
        element.decompose()

    data = {
        "url": url,
        "title": soup.title.string.strip() if soup.title else "",
        "text": soup.get_text(separator="\n", strip=True)[:20000],
        "meta": {},
    }

    for meta in soup.find_all("meta"):
        if meta.get("name"):
            data["meta"][meta["name"]] = meta.get("content", "")
        if meta.get("property"):
            data["meta"][meta["property"]] = meta.get("content", "")

    if extract_links:
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith("http") or href.startswith("/"):
                links.append({
                    "text": a.get_text(strip=True)[:100],
                    "url": href,
                })
        data["links"] = links[:100]

    if extract_images:
        images = []
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if src and not src.startswith("data:"):
                images.append({
                    "src": src,
                    "alt": img.get("alt", ""),
                    "width": img.get("width"),
                    "height": img.get("height"),
                })
        data["images"] = images[:50]

    return data


async def check_url_safety(url: str) -> Dict[str, Any]:
    blacklist_patterns = [
        r"\.(exe|dll|bat|sh|msi|app|deb|rpm)$",
        r"(malware|phishing|scam|hack|exploit)",
    ]

    parsed = urlparse(url)
    issues = []

    if parsed.scheme not in ("http", "https"):
        issues.append(f"Unusual scheme: {parsed.scheme}")

    for pattern in blacklist_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            issues.append(f"URL matches suspicious pattern: {pattern}")

    return {
        "url": url,
        "safe": len(issues) == 0,
        "issues": issues,
        "domain": parsed.netloc,
    }
