import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class KnowledgeGraph:
    def __init__(self, store_path: str = "data/knowledge_graph.json"):
        self.store_path = Path(store_path)
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if self.store_path.exists():
            try:
                with open(self.store_path, "r") as f:
                    data = json.load(f)
                    self.nodes = {n["id"]: n for n in data.get("nodes", [])}
                    self.edges = data.get("edges", [])
            except Exception:
                self.nodes = {}
                self.edges = []

    def _save(self):
        with open(self.store_path, "w") as f:
            json.dump({
                "nodes": list(self.nodes.values()),
                "edges": self.edges,
            }, f)

    def add_node(
        self,
        id: str,
        label: str,
        category: str = "general",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.nodes[id] = {
            "id": id,
            "label": label,
            "category": category,
            "metadata": metadata or {},
        }
        self._save()

    def add_edge(
        self,
        source: str,
        target: str,
        label: str = "related",
        weight: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        edge = {
            "source": source,
            "target": target,
            "label": label,
            "weight": weight,
            "metadata": metadata or {},
        }
        if edge not in self.edges:
            self.edges.append(edge)
            self._save()

    def remove_node(self, node_id: str):
        self.nodes.pop(node_id, None)
        self.edges = [
            e for e in self.edges
            if e.get("source") != node_id and e.get("target") != node_id
        ]
        self._save()

    def remove_edge(self, source: str, target: str, label: Optional[str] = None):
        self.edges = [
            e for e in self.edges
            if not (e["source"] == source and e["target"] == target
                    and (label is None or e["label"] == label))
        ]
        self._save()

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        for node in self.nodes.values():
            if query_lower in node["label"].lower():
                results.append(node)
            elif node.get("metadata"):
                for value in node["metadata"].values():
                    if isinstance(value, str) and query_lower in value.lower():
                        results.append(node)
                        break
        return results[:limit]

    def get_related(
        self, node_id: str, depth: int = 1, max_nodes: int = 50
    ) -> Dict[str, Any]:
        visited: Set[str] = set()
        related_nodes = []
        related_edges = []
        queue = [(node_id, 0)]

        while queue and len(related_nodes) < max_nodes:
            current_id, current_depth = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)

            if current_id in self.nodes:
                related_nodes.append(self.nodes[current_id])

            if current_depth < depth:
                for edge in self.edges:
                    if edge["source"] == current_id and edge["target"] not in visited:
                        queue.append((edge["target"], current_depth + 1))
                        related_edges.append(edge)
                    elif edge["target"] == current_id and edge["source"] not in visited:
                        queue.append((edge["source"], current_depth + 1))
                        related_edges.append(edge)

        return {
            "center": self.nodes.get(node_id),
            "nodes": related_nodes,
            "edges": related_edges,
            "total_count": len(related_nodes),
        }

    def export_graph(self) -> Dict[str, Any]:
        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges,
            "metadata": {
                "total_nodes": len(self.nodes),
                "total_edges": len(self.edges),
            },
        }

    def build_graph(self, items: List[Dict[str, Any]]):
        self.nodes.clear()
        self.edges.clear()
        for item in items:
            self.add_node(
                id=item.get("id", str(hash(str(item)))),
                label=item.get("label", item.get("title", "Unknown")),
                category=item.get("category", "general"),
                metadata=item.get("metadata"),
            )
        self._save()

    def clear(self):
        self.nodes.clear()
        self.edges.clear()
        self._save()

    def get_stats(self) -> Dict[str, Any]:
        categories = {}
        for node in self.nodes.values():
            cat = node.get("category", "general")
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "categories": categories,
            "avg_connections": (
                (len(self.edges) * 2) / len(self.nodes) if self.nodes else 0
            ),
        }
