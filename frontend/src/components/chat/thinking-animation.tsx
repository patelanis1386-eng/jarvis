"use client"

import { motion } from "framer-motion"

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative flex items-center justify-center h-10 w-10">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#00d4ff]/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border border-[#00d4ff]/40"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.5)]"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-0.5 bg-[#00d4ff]/40 rounded-full" />
        </motion.div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-[#00d4ff]/60">Processing</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1 w-1 rounded-full bg-[#00d4ff]/60"
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export { ThinkingAnimation }
