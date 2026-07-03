"use client"

import { motion } from "framer-motion"

interface CircularMicProps {
  isRecording: boolean
  onToggle: () => void
}

function CircularMic({ isRecording, onToggle }: CircularMicProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-32 h-32 flex items-center justify-center outline-none group"
    >
      {/* Outer glow rings */}
      {isRecording && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-[#00d4ff]/20"
              animate={{
                scale: [1, 1.4 + i * 0.2],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Main ring */}
      <motion.div
        className={`absolute inset-2 rounded-full border-2 ${
          isRecording
            ? "border-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            : "border-white/20 group-hover:border-white/40"
        }`}
        animate={
          isRecording
            ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(0,212,255,0.2)",
                  "0 0 40px rgba(0,212,255,0.4)",
                  "0 0 20px rgba(0,212,255,0.2)",
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: isRecording ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Gradient ring fill */}
        <div
          className={`absolute inset-1 rounded-full transition-colors duration-300 ${
            isRecording ? "bg-[#00d4ff]/10" : "bg-white/5"
          }`}
        />
      </motion.div>

      {/* Mic icon */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-10 h-10 z-10 transition-colors ${
          isRecording ? "text-[#00d4ff]" : "text-white/60"
        }`}
        animate={
          isRecording
            ? {
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: isRecording ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </motion.svg>
    </button>
  )
}

export { CircularMic }
