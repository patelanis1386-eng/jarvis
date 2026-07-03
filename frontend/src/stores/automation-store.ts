import { create } from "zustand"
import type { Automation } from "@/types"

interface AutomationState {
  automations: Automation[]
  addAutomation: (auto: Automation) => void
  updateAutomation: (id: string, data: Partial<Automation>) => void
  deleteAutomation: (id: string) => void
  toggleEnabled: (id: string) => void
}

export const useAutomationStore = create<AutomationState>((set) => ({
  automations: [
    { id: "a1", name: "Daily Report", description: "Generates and sends daily activity report", trigger: "Schedule: 9 AM daily", action: "Generate report + Email", enabled: true, lastRun: new Date(), config: {} },
    { id: "a2", name: "Memory Backup", description: "Backs up important memories to cloud", trigger: "Memory importance > 8", action: "Encrypt + Upload", enabled: true, lastRun: new Date(), config: {} },
    { id: "a3", name: "Smart Inbox", description: "Categorizes and prioritizes incoming messages", trigger: "New message received", action: "Analyze + Categorize", enabled: false, lastRun: undefined, config: {} },
    { id: "a4", name: "Code Review", description: "Auto-reviews code changes for quality", trigger: "Git push detected", action: "Lint + Test + Review", enabled: true, lastRun: new Date(), config: {} },
    { id: "a5", name: "Research Brief", description: "Compiles daily research digest from saved topics", trigger: "Schedule: 8 AM daily", action: "Research + Summarize", enabled: false, lastRun: undefined, config: {} },
  ],

  addAutomation: (auto) => set((s) => ({ automations: [...s.automations, auto] })),
  updateAutomation: (id, data) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  deleteAutomation: (id) => set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),
  toggleEnabled: (id) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),
}))
