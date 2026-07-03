import csv
import io
import mimetypes
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiofiles


class FileError(Exception):
    pass


async def read_file(file_path: str, encoding: str = "utf-8") -> str:
    if not os.path.exists(file_path):
        raise FileError(f"File not found: {file_path}")
    async with aiofiles.open(file_path, "r", encoding=encoding) as f:
        content = await f.read()
    return content


async def read_file_bytes(file_path: str) -> bytes:
    if not os.path.exists(file_path):
        raise FileError(f"File not found: {file_path}")
    async with aiofiles.open(file_path, "rb") as f:
        content = await f.read()
    return content


async def save_file(file_path: str, content: str, encoding: str = "utf-8") -> str:
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    async with aiofiles.open(file_path, "w", encoding=encoding) as f:
        await f.write(content)
    return file_path


async def save_file_bytes(file_path: str, content: bytes) -> str:
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    return file_path


def get_file_type(file_path: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        return mime_type

    ext = Path(file_path).suffix.lower()
    type_map = {
        ".py": "text/x-python",
        ".js": "text/javascript",
        ".ts": "text/typescript",
        ".json": "application/json",
        ".md": "text/markdown",
        ".html": "text/html",
        ".css": "text/css",
        ".yaml": "text/yaml",
        ".yml": "text/yaml",
        ".xml": "text/xml",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".mp4": "video/mp4",
        ".zip": "application/zip",
    }
    return type_map.get(ext, "application/octet-stream")


def get_file_size(file_path: str) -> int:
    if not os.path.exists(file_path):
        raise FileError(f"File not found: {file_path}")
    return os.path.getsize(file_path)


def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


async def generate_pdf(content: str, filename: str = "output.pdf") -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getattr(__import__("reportlab.lib.styles", fromlist=["getSampleStyleSheet"]), "getSampleStyleSheet")()
        story = []

        for line in content.split("\n"):
            if line.strip():
                story.append(Paragraph(line, styles["Normal"]))
                story.append(Spacer(1, 6))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
    except ImportError:
        raise FileError("reportlab is required for PDF generation. Install with: pip install reportlab")


async def generate_csv(
    data: List[Dict[str, Any]],
    fieldnames: Optional[List[str]] = None,
    filename: str = "output.csv",
) -> str:
    if not data:
        raise FileError("No data to generate CSV")

    fieldnames = fieldnames or list(data[0].keys())
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)

    csv_content = output.getvalue()
    file_path = save_file(filename, csv_content)
    return file_path


async def list_files(directory: str, pattern: Optional[str] = None) -> List[Dict[str, Any]]:
    if not os.path.isdir(directory):
        raise FileError(f"Directory not found: {directory}")

    files = []
    for entry in os.scandir(directory):
        if pattern and not Path(entry.name).match(pattern):
            continue

        stat = entry.stat()
        files.append({
            "name": entry.name,
            "path": entry.path,
            "is_dir": entry.is_dir(),
            "size": stat.st_size,
            "size_formatted": format_file_size(stat.st_size),
            "modified": stat.st_mtime,
            "type": get_file_type(entry.path) if not entry.is_dir() else "directory",
        })

    files.sort(key=lambda x: (-x["is_dir"], x["name"]))
    return files


async def delete_file(file_path: str) -> bool:
    if not os.path.exists(file_path):
        raise FileError(f"File not found: {file_path}")
    os.remove(file_path)
    return True
