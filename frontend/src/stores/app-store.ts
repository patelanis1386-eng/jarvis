import { create } from "zustand"

interface AppState {
  sidebarOpen: boolean
  theme: "dark" | "light"
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: "dark" | "light") => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  theme: "dark",
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme) => set({ theme }),
}))
