import re
import unicodedata
from typing import List, Optional, Tuple


def truncate(text: str, max_length: int = 1000, suffix: str = "...") -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)].rsplit(" ", 1)[0] + suffix


def sanitize(text: str, allow_unicode: bool = True) -> str:
    if allow_unicode:
        text = unicodedata.normalize("NFKC", text)
    else:
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")

    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text.strip()


def extract_code_blocks(text: str) -> List[Tuple[str, str]]:
    pattern = r"```(\w*)\n(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)
    return [(lang.strip() or "text", code.strip()) for lang, code in matches]


def format_markdown(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.*?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)

    lines = text.split("\n")
    formatted = []
    in_code_block = False
    in_list = False

    for line in lines:
        if line.startswith("```"):
            in_code_block = not in_code_block
            formatted.append(line)
            continue

        if in_code_block:
            formatted.append(line)
            continue

        if re.match(r"^#{1,6}\s", line):
            level = len(re.match(r"^#+", line).group())
            content = re.sub(r"^#+\s*", "", line)
            formatted.append(f"<h{level}>{content}</h{level}>")
        elif re.match(r"^[-*+]\s", line):
            if not in_list:
                formatted.append("<ul>")
                in_list = True
            formatted.append(f"<li>{re.sub(r'^[-*+]\s*', '', line)}</li>")
        elif re.match(r"^\d+\.\s", line):
            if not in_list:
                formatted.append("<ol>")
                in_list = True
            formatted.append(f"<li>{re.sub(r'^\d+\.\s*', '', line)}</li>")
        elif line.strip() == "":
            if in_list:
                formatted.append("</ul>" if "<ul>" in "".join(formatted[-3:]) else "</ol>")
                in_list = False
            formatted.append("<br>")
        else:
            if in_list:
                formatted.append("</ul>" if "<ul>" in "".join(formatted[-3:]) else "</ol>")
                in_list = False
            formatted.append(f"<p>{line}</p>")

    if in_list:
        formatted.append("</ul>")

    return "".join(formatted)


def detect_language(text: str) -> str:
    import langdetect
    try:
        lang = langdetect.detect(text)
        return lang if lang else "en"
    except Exception:
        return "en"


def strip_markdown(text: str) -> str:
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[([^\]]*)\]\(.*?\)", r"\1", text)
    text = re.sub(r"[#*_~`>|]", "", text)
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def count_tokens(text: str) -> int:
    return len(text) // 4


def split_text(text: str, max_length: int = 2000, overlap: int = 100) -> List[str]:
    if len(text) <= max_length:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + max_length
        if end >= len(text):
            chunks.append(text[start:])
            break

        split_at = text.rfind(" ", start, end)
        if split_at == -1 or split_at <= start:
            split_at = end

        chunks.append(text[start:split_at])
        start = split_at - overlap

    return chunks
