import { create } from "zustand"
import type { MemoryItem } from "@/types"

interface MemoryState {
  items: MemoryItem[]
  searchQuery: string
  filterType: string
  setSearchQuery: (query: string) => void
  setFilterType: (type: string) => void
  addItem: (item: MemoryItem) => void
  deleteItem: (id: string) => void
}

export const useMemoryStore = create<MemoryState>((set) => ({
  items: [
    { id: "mem1", content: "User prefers dark mode interfaces", type: "preference", importance: 8, createdAt: new Date(), tags: ["ui", "theme"] },
    { id: "mem2", content: "Weekly team standup every Monday 10 AM", type: "event", importance: 9, createdAt: new Date(), tags: ["meeting", "recurring"] },
    { id: "mem3", content: "Quantum computing basics understood", type: "concept", importance: 6, createdAt: new Date(), tags: ["science", "computing"] },
    { id: "mem4", content: "User is working on AI agent project", type: "fact", importance: 7, createdAt: new Date(), tags: ["project", "ai"] },
    { id: "mem5", content: "Birthday: March 15", type: "fact", importance: 10, createdAt: new Date(), tags: ["personal"] },
    { id: "mem6", content: "User enjoys synthwave music while coding", type: "preference", importance: 5, createdAt: new Date(), tags: ["music", "focus"] },
  ],
  searchQuery: "",
  filterType: "all",

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))
