"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface WaveformVisualizationProps {
  isActive?: boolean
  barCount?: number
}

function WaveformVisualization({ isActive = false, barCount = 48 }: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    resize()
    window.addEventListener("resize", resize)

    const bars = Array.from({ length: barCount }, () => ({
      height: 0,
      target: 0,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const w = canvas.width / barCount - 2

      bars.forEach((bar, i) => {
        if (isActive) {
          bar.target = Math.random() * canvas.height * 0.8
        } else {
          bar.target = canvas.height * 0.05
        }
        bar.height += (bar.target - bar.height) * 0.1

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - bar.height)
        gradient.addColorStop(0, "rgba(0, 212, 255, 0.2)")
        gradient.addColorStop(0.5, "rgba(0, 212, 255, 0.6)")
        gradient.addColorStop(1, "rgba(0, 136, 255, 0.9)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        const x = i * (w + 2)
        const y = canvas.height - bar.height
        ctx.roundRect(x, y, w, bar.height, [w / 2, w / 2, 0, 0])
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [isActive, barCount])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-24"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  )
}

export { WaveformVisualization }
