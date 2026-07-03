"use client"

import * as React from "react"
import { CircularMic } from "@/components/voice/circular-mic"
import { WaveformVisualization } from "@/components/voice/waveform-visualization"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, Languages, Settings } from "lucide-react"

function VoiceInterface() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [transcription, setTranscription] = React.useState("")
  const [response, setResponse] = React.useState("")
  const [mode, setMode] = React.useState("general")

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setTranscription("Hello JARVIS, what is the status of my latest project?")
      setTimeout(() => {
        setResponse("All systems are operational. Your latest project has completed 78% of the analysis phase. Would you like me to provide a detailed breakdown?")
      }, 1500)
    } else {
      setIsRecording(true)
      setTranscription("")
      setResponse("")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-white">Voice Interface</h1>
        <p className="text-sm text-white/50 mt-1">Speak to JARVIS naturally</p>
      </motion.div>

      <div className="flex items-center gap-2 bg-white/5 rounded-lg p-0.5 border border-white/10">
        {["general", "coding", "research", "command"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${
              mode === m ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-white/40 hover:text-white/60"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <CircularMic isRecording={isRecording} onToggle={handleToggleRecording} />

      <AnimatePresence mode="wait">
        {!isRecording && transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl space-y-4"
          >
            <Card variant="default">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">You said</span>
                </div>
                <p className="text-sm text-white/80">{transcription}</p>
              </CardContent>
            </Card>

            {response && (
              <Card variant="highlight">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                    <span className="text-xs text-[#00d4ff] uppercase tracking-wider">JARVIS Response</span>
                  </div>
                  <p className="text-sm text-white/90">{response}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isRecording && (
        <div className="w-full max-w-xl">
          <WaveformVisualization isActive={isRecording} />
          <p className="text-center text-xs text-[#00d4ff]/60 mt-2 animate-pulse">
            Listening...
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-white/30">
        <Button variant="ghost" size="sm">
          <Languages className="h-3 w-3 mr-1" />
          Language
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="h-3 w-3 mr-1" />
          Voice Settings
        </Button>
      </div>
    </div>
  )
}

export { VoiceInterface }
