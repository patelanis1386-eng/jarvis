"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
  speed?: number
}

function StreamingText({ text, isStreaming = false, speed = 30 }: StreamingTextProps) {
  const [displayed, setDisplayed] = React.useState("")
  const indexRef = React.useRef(0)

  React.useEffect(() => {
    if (!isStreaming) {
      setDisplayed(text)
      return
    }

    indexRef.current = 0
    setDisplayed("")

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, isStreaming, speed])

  return (
    <span>
      {displayed}
      {isStreaming && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block h-4 w-0.5 bg-[#00d4ff] ml-0.5 align-text-bottom"
        />
      )}
    </span>
  )
}

export { StreamingText }
