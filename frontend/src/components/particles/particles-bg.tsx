"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  pulse: number
  pulseSpeed: number
}

interface ParticlesBgProps {
  particleCount?: number
  color?: string
  linkDistance?: number
  className?: string
}

function ParticlesBg({
  particleCount = 80,
  color = "#00d4ff",
  linkDistance = 150,
  className = "",
}: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }))

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }
    window.addEventListener("mousemove", onMouse)
    document.addEventListener("mouseleave", onMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current
      const mouse = mouseRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.pulse += p.pulseSpeed
        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse))
        const currentSize = p.size * (0.8 + 0.2 * Math.sin(p.pulse))

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${Math.round(currentAlpha * 255).toString(16).padStart(2, "0")}`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < linkDistance) {
            const linkAlpha = 0.12 * (1 - dist / linkDistance)

            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `${color}${Math.round(linkAlpha * 255).toString(16).padStart(2, "0")}`
            ctx.lineWidth = 0.8
            ctx.stroke()

            if (dist < 50) {
              ctx.shadowColor = color
              ctx.shadowBlur = 4
              ctx.stroke()
              ctx.shadowBlur = 0
            }
          }
        }

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) {
          const mouseAlpha = 0.08 * (1 - dist / 200)
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `${color}${Math.round(mouseAlpha * 255).toString(16).padStart(2, "0")}`
          ctx.lineWidth = 1
          ctx.stroke()

          if (dist < 100) {
            const force = (100 - dist) / 100 * 0.3
            p.vx -= (dx / dist) * force * 0.1
            p.vy -= (dy / dist) * force * 0.1
          }
        }

        p.vx += (Math.random() - 0.5) * 0.01
        p.vy += (Math.random() - 0.5) * 0.01

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5
          p.vy = (p.vy / speed) * 1.5
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouse)
      document.removeEventListener("mouseleave", onMouseLeave)
      cancelAnimationFrame(animRef.current)
    }
  }, [particleCount, color, linkDistance])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  )
}

export { ParticlesBg }
