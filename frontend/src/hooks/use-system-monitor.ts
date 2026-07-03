"use client"

import { useState, useEffect } from "react"

interface SystemMetrics {
  cpu: number
  memory: number
  uptime: string
  activeProcesses: number
  networkLatency: number
}

export function useSystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 23,
    memory: 45,
    uptime: "72h 34m",
    activeProcesses: 156,
    networkLatency: 12,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 40) + 10,
        memory: Math.floor(Math.random() * 30) + 35,
        uptime: "72h 34m",
        activeProcesses: Math.floor(Math.random() * 50) + 130,
        networkLatency: Math.floor(Math.random() * 20) + 5,
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}
