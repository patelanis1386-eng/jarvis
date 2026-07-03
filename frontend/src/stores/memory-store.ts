import { create } from "zustand"
import type { Memory } from "@/types"

interface MemoryState {
  items: Memory[]
  searchQuery: string
  filterType: string
  setSearchQuery: (query: string) => void
  setFilterType: (type: string) => void
  addItem: (item: Memory) => void
  deleteItem: (id: string) => void
}

export const useMemoryStore = create<MemoryState>((set) => ({
  items: [
    { id: "mem1", content: "User prefers dark mode interfaces", type: "preference", importance: 8, timestamp: "2026-07-04T00:00:00Z", tags: ["ui", "theme"], accessCount: 12, lastAccessed: "2026-07-04T00:00:00Z" },
    { id: "mem2", content: "Weekly team standup every Monday 10 AM", type: "event", importance: 9, timestamp: "2026-07-04T00:00:00Z", tags: ["meeting", "recurring"], accessCount: 8, lastAccessed: "2026-07-04T00:00:00Z" },
    { id: "mem3", content: "Quantum computing basics understood", type: "concept", importance: 6, timestamp: "2026-07-04T00:00:00Z", tags: ["science", "computing"], accessCount: 3, lastAccessed: "2026-07-04T00:00:00Z" },
    { id: "mem4", content: "User is working on AI agent project", type: "fact", importance: 7, timestamp: "2026-07-04T00:00:00Z", tags: ["project", "ai"], accessCount: 5, lastAccessed: "2026-07-04T00:00:00Z" },
    { id: "mem5", content: "Birthday: March 15", type: "fact", importance: 10, timestamp: "2026-07-04T00:00:00Z", tags: ["personal"], accessCount: 1, lastAccessed: "2026-07-04T00:00:00Z" },
    { id: "mem6", content: "User enjoys synthwave music while coding", type: "preference", importance: 5, timestamp: "2026-07-04T00:00:00Z", tags: ["music", "focus"], accessCount: 7, lastAccessed: "2026-07-04T00:00:00Z" },
  ],
  searchQuery: "",
  filterType: "all",

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))
