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
    { id: "a1", name: "Daily Report", description: "Generates and sends daily activity report", trigger: { type: "schedule", config: {} }, action: { type: "api_call", config: {} }, enabled: true, lastRun: "2026-07-04T00:00:00Z", createdAt: "2026-07-04T00:00:00Z" },
    { id: "a2", name: "Memory Backup", description: "Backs up important memories to cloud", trigger: { type: "event", config: {} }, action: { type: "custom", config: {} }, enabled: true, lastRun: "2026-07-04T00:00:00Z", createdAt: "2026-07-04T00:00:00Z" },
    { id: "a3", name: "Smart Inbox", description: "Categorizes and prioritizes incoming messages", trigger: { type: "event", config: {} }, action: { type: "custom", config: {} }, enabled: false, createdAt: "2026-07-04T00:00:00Z" },
    { id: "a4", name: "Code Review", description: "Auto-reviews code changes for quality", trigger: { type: "webhook", config: {} }, action: { type: "custom", config: {} }, enabled: true, lastRun: "2026-07-04T00:00:00Z", createdAt: "2026-07-04T00:00:00Z" },
    { id: "a5", name: "Research Brief", description: "Compiles daily research digest from saved topics", trigger: { type: "schedule", config: {} }, action: { type: "send_message", config: {} }, enabled: false, createdAt: "2026-07-04T00:00:00Z" },
  ],

  addAutomation: (auto) => set((s) => ({ automations: [...s.automations, auto] })),
  updateAutomation: (id, data) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  deleteAutomation: (id) => set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),
  toggleEnabled: (id) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) })),
}))
