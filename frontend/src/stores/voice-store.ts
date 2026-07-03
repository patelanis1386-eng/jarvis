import { create } from "zustand"

interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  response: string
  commands: Array<{ text: string; timestamp: Date }>
  startListening: () => void
  stopListening: () => void
  setTranscript: (text: string) => void
  setResponse: (text: string) => void
  addCommand: (text: string) => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  isProcessing: false,
  transcript: "",
  response: "",
  commands: [
    { text: "Schedule meeting with team at 3 PM", timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { text: "What's the weather like today?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { text: "Send email to David about project update", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  ],

  startListening: () => set({ isListening: true, isProcessing: false }),
  stopListening: () => set({ isListening: false, isProcessing: false }),
  setTranscript: (text) => set({ transcript: text }),
  setResponse: (text) => set({ response: text }),
  addCommand: (text) => set((s) => ({ commands: [{ text, timestamp: new Date() }, ...s.commands] })),
}))
