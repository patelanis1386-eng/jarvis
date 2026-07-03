import { create } from "zustand"
import type { Knowledge } from "@/types"

interface KnowledgeState {
  entries: Knowledge[]
  searchQuery: string
  selectedEntry: Knowledge | null
  setSearchQuery: (query: string) => void
  setSelectedEntry: (entry: Knowledge | null) => void
  addEntry: (entry: Knowledge) => void
  deleteEntry: (id: string) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  entries: [
    { id: "k1", title: "JARVIS X Architecture", content: "JARVIS X is built on a modular microservices architecture with a Next.js frontend and Go backend...", summary: "Architecture overview of JARVIS X system", tags: ["architecture", "system"], source: "Internal Docs", createdAt: "2026-07-04T00:00:00Z", updatedAt: "2026-07-04T00:00:00Z", connections: ["k2", "k3"] },
    { id: "k2", title: "Machine Learning Pipeline", content: "The ML pipeline processes data through ingestion, preprocessing, training, evaluation, and deployment stages...", summary: "ML pipeline stages and workflow", tags: ["ml", "pipeline"], source: "Research Paper", createdAt: "2026-07-04T00:00:00Z", updatedAt: "2026-07-04T00:00:00Z", connections: ["k1"] },
    { id: "k3", title: "Quantum Computing Basics", content: "Quantum computing leverages qubits that can exist in superposition states, enabling parallel computation...", summary: "Fundamentals of quantum computing", tags: ["quantum", "computing"], source: "Wikipedia", createdAt: "2026-07-04T00:00:00Z", updatedAt: "2026-07-04T00:00:00Z", connections: ["k1"] },
    { id: "k4", title: "Natural Language Processing", content: "NLP enables machines to understand and generate human language through tokenization, embeddings, and transformer models...", summary: "NLP concepts and techniques", tags: ["nlp", "ai"], source: "Course Material", createdAt: "2026-07-04T00:00:00Z", updatedAt: "2026-07-04T00:00:00Z", connections: [] },
  ],
  searchQuery: "",
  selectedEntry: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}))
