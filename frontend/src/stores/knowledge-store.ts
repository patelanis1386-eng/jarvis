import { create } from "zustand"
import type { KnowledgeEntry } from "@/types"

interface KnowledgeState {
  entries: KnowledgeEntry[]
  searchQuery: string
  selectedEntry: KnowledgeEntry | null
  setSearchQuery: (query: string) => void
  setSelectedEntry: (entry: KnowledgeEntry | null) => void
  addEntry: (entry: KnowledgeEntry) => void
  deleteEntry: (id: string) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  entries: [
    { id: "k1", title: "JARVIS X Architecture", content: "JARVIS X is built on a modular microservices architecture with a Next.js frontend and Go backend...", tags: ["architecture", "system"], source: "Internal Docs", connections: ["k2", "k3"] },
    { id: "k2", title: "Machine Learning Pipeline", content: "The ML pipeline processes data through ingestion, preprocessing, training, evaluation, and deployment stages...", tags: ["ml", "pipeline"], source: "Research Paper", connections: ["k1"] },
    { id: "k3", title: "Quantum Computing Basics", content: "Quantum computing leverages qubits that can exist in superposition states, enabling parallel computation...", tags: ["quantum", "computing"], source: "Wikipedia", connections: ["k1"] },
    { id: "k4", title: "Natural Language Processing", content: "NLP enables machines to understand and generate human language through tokenization, embeddings, and transformer models...", tags: ["nlp", "ai"], source: "Course Material", connections: [] },
  ],
  searchQuery: "",
  selectedEntry: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}))
