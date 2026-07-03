"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 via-transparent to-purple-500/5" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-red-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center space-y-6 max-w-md mx-4"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto"
        >
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white">
            <span className="text-[#00d4ff]">4</span>0
            <span className="text-[#00d4ff]">4</span>
          </h1>
          <p className="text-xl text-white/80 font-medium">System Error</p>
          <p className="text-sm text-white/40">The requested resource could not be located in the system database.</p>
        </div>

        <div className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <code className="text-xs text-white/50 font-mono">
            ERROR_CODE: PAGE_NOT_FOUND | SYS: 0x404
          </code>
        </div>

        <Link href="/dashboard">
          <Button variant="glow" size="lg">
            <Home className="h-4 w-4" />
            Return to Command Center
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
