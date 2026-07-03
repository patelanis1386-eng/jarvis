"use client"

import { motion } from "framer-motion"
import { VoiceInterface } from "@/components/voice/voice-interface"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function VoicePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Voice Assistant</h1>
          <p className="text-sm text-white/50">Speak commands and interact with JARVIS using your voice</p>
        </div>
        <Badge variant="default" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
          Voice Recognition Active
        </Badge>
      </div>

      <Card className="border-[#00d4ff]/20 bg-gradient-to-br from-[#00d4ff]/5 to-transparent">
        <CardContent className="p-6">
          <VoiceInterface />
        </CardContent>
      </Card>
    </motion.div>
  )
}
