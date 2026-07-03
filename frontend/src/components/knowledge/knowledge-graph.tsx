"use client"

import { useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"

interface Node {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface Edge {
  source: string
  target: string
  label?: string
}

interface KnowledgeGraphProps {
  data?: { nodes: Node[]; edges: Edge[] }
}

const defaultData = {
  nodes: [
    { id: "1", label: "JARVIS", x: 400, y: 300, vx: 0, vy: 0, radius: 30, color: "#00d4ff" },
    { id: "2", label: "AI", x: 250, y: 200, vx: 0, vy: 0, radius: 22, color: "#0088ff" },
    { id: "3", label: "Machine\nLearning", x: 550, y: 200, vx: 0, vy: 0, radius: 22, color: "#0088ff" },
    { id: "4", label: "Vision", x: 150, y: 400, vx: 0, vy: 0, radius: 18, color: "#6366f1" },
    { id: "5", label: "Voice", x: 350, y: 450, vx: 0, vy: 0, radius: 18, color: "#6366f1" },
    { id: "6", label: "Automation", x: 550, y: 400, vx: 0, vy: 0, radius: 18, color: "#6366f1" },
    { id: "7", label: "Memory", x: 650, y: 300, vx: 0, vy: 0, radius: 18, color: "#6366f1" },
  ],
  edges: [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
    { source: "2", target: "4" },
    { source: "2", target: "5" },
    { source: "3", target: "6" },
    { source: "3", target: "7" },
    { source: "1", target: "6" },
    { source: "1", target: "7" },
  ],
}

function KnowledgeGraph({ data = defaultData }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>(data.nodes.map((n) => ({ ...n })))
  const edgesRef = useRef(data.edges)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const draggedRef = useRef<string | null>(null)
  const animRef = useRef<number>(0)
  const offsetRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)

  const getNode = useCallback((id: string) => nodesRef.current.find((n) => n.id === id), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth ?? 800
      canvas.height = canvas.parentElement?.clientHeight ?? 500
    }
    resize()
    window.addEventListener("resize", resize)

    const getCanvasPos = (clientX: number, clientY: number) => ({
      x: (clientX - canvas.getBoundingClientRect().left - offsetRef.current.x) / scaleRef.current,
      y: (clientY - canvas.getBoundingClientRect().top - offsetRef.current.y) / scaleRef.current,
    })

    const onMouseDown = (e: MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY)
      const node = nodesRef.current.find(
        (n) => Math.hypot(n.x - pos.x, n.y - pos.y) < n.radius
      )
      if (node) {
        draggedRef.current = node.id
        node.vx = 0
        node.vy = 0
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = getCanvasPos(e.clientX, e.clientY)
      if (draggedRef.current) {
        const node = getNode(draggedRef.current)
        if (node) {
          node.x = mouseRef.current.x
          node.y = mouseRef.current.y
        }
      }
    }

    const onMouseUp = () => {
      draggedRef.current = null
    }

    canvas.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(offsetRef.current.x, offsetRef.current.y)
      ctx.scale(scaleRef.current, scaleRef.current)

      const nodes = nodesRef.current

      for (const edge of edgesRef.current) {
        const source = getNode(edge.source)
        const target = getNode(edge.target)
        if (!source || !target) continue

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = "rgba(0, 212, 255, 0.15)"
        ctx.lineWidth = 1.5
        ctx.stroke()

        const grad = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
        grad.addColorStop(0, "rgba(0, 212, 255, 0.05)")
        grad.addColorStop(0.5, "rgba(0, 212, 255, 0.15)")
        grad.addColorStop(1, "rgba(0, 136, 255, 0.05)")
        ctx.strokeStyle = grad
        ctx.stroke()
      }

      for (const node of nodes) {
        if (node.id !== draggedRef.current) {
          for (const other of nodes) {
            if (other.id === node.id) continue
            const dx = node.x - other.x
            const dy = node.y - other.y
            const dist = Math.hypot(dx, dy)
            if (dist < 100 && dist > 0) {
              const force = (100 - dist) / 100 * 0.1
              node.vx += (dx / dist) * force
              node.vy += (dy / dist) * force
            }
          }

          node.x += node.vx
          node.y += node.vy
          node.vx *= 0.95
          node.vy *= 0.95

          node.x = Math.max(node.radius, Math.min(canvas.width / scaleRef.current - node.radius, node.x))
          node.y = Math.max(node.radius, Math.min(canvas.height / scaleRef.current - node.radius, node.y))
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)

        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius)
        gradient.addColorStop(0, `${node.color}40`)
        gradient.addColorStop(0.6, `${node.color}20`)
        gradient.addColorStop(1, `${node.color}10`)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.strokeStyle = `${node.color}60`
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.shadowColor = node.color
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0

        if (node.id === draggedRef.current) {
          ctx.strokeStyle = `${node.color}80`
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.font = "10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const lines = node.label.split("\n")
        lines.forEach((line, i) => {
          ctx.fillText(line, node.x, node.y + (i - (lines.length - 1) / 2) * 14)
        })
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      cancelAnimationFrame(animRef.current)
    }
  }, [getNode])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-[500px] rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </motion.div>
  )
}

export { KnowledgeGraph }
