"use client"

import { useVoiceStore } from "@/stores/voice-store"

export function useVoice() {
  const store = useVoiceStore()

  const simulateVoiceCommand = async () => {
    store.startListening()
    await new Promise((r) => setTimeout(r, 2000))
    store.setTranscript("Analyzing voice input...")
    await new Promise((r) => setTimeout(r, 1000))
    store.setResponse("I've processed your request. Opening the dashboard with personalized insights.")
    store.stopListening()
    store.addCommand("Processed voice command successfully")
  }

  return { ...store, simulateVoiceCommand }
}
