"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MessageSquare, Brain, Zap, Puzzle, Mic, Eye, Command, Cpu, Activity, Clock, Bot, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSystemMonitor } from "@/hooks/use-system-monitor"
import { useChatStore } from "@/stores/chat-store"
import { useMemoryStore } from "@/stores/memory-store"
import { useAutomationStore } from "@/stores/automation-store"

const statCards = [
  { label: "Conversations", value: "1,247", icon: MessageSquare, change: "+12%", trend: "up", color: "#00d4ff" },
  { label: "Memory Items", value: "8,432", icon: Brain, change: "+5%", trend: "up", color: "#a855f7" },
  { label: "Active Automations", value: "12", icon: Zap, change: "+2", trend: "up", color: "#22c55e" },
  { label: "Installed Plugins", value: "24", icon: Puzzle, change: "+3", trend: "up", color: "#f59e0b" },
]

const quickActions = [
  { label: "New Chat", icon: MessageSquare, href: "/chat", color: "from-[#00d4ff]/20 to-[#0088ff]/20 border-[#00d4ff]/30" },
  { label: "Voice Command", icon: Mic, href: "/voice", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
  { label: "Analyze Image", icon: Eye, href: "/vision", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
  { label: "Create Automation", icon: Zap, href: "/automation", color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30" },
]

const recentActivity = [
  { action: "Chat completed", detail: "Discussed quantum computing architecture", time: "2 min ago", type: "chat" },
  { action: "Memory optimized", detail: "12 redundant entries consolidated", time: "15 min ago", type: "memory" },
  { action: "Automation triggered", detail: "Daily report generated successfully", time: "1 hour ago", type: "automation" },
  { action: "Plugin installed", detail: "Data Visualizer v2.1.0", time: "2 hours ago", type: "plugin" },
  { action: "Voice command processed", detail: "Schedule meeting with team", time: "3 hours ago", type: "voice" },
]

export default function DashboardPage() {
  const metrics = useSystemMonitor()
  const { conversations } = useChatStore()
  const { items: memoryItems } = useMemoryStore()
  const { automations } = useAutomationStore()

  const activeAutomations = automations.filter((a) => a.enabled).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-white/50">Welcome back, Tony. All systems operational.</p>
        </div>
        <Badge variant="success" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          System Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="highlight" className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20`, borderColor: `${stat.color}30`, borderWidth: 1 }}
                  >
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link href={action.href}>
                  <Card variant="interactive" className={`bg-gradient-to-br ${action.color}`}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <action.icon className="h-6 w-6 text-white/80" />
                      <span className="text-xs font-medium text-white/80">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {item.type === "chat" && <MessageSquare className="h-4 w-4 text-[#00d4ff]" />}
                    {item.type === "memory" && <Brain className="h-4 w-4 text-purple-400" />}
                    {item.type === "automation" && <Zap className="h-4 w-4 text-green-400" />}
                    {item.type === "plugin" && <Puzzle className="h-4 w-4 text-yellow-400" />}
                    {item.type === "voice" && <Mic className="h-4 w-4 text-pink-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">{item.action}</p>
                    <p className="text-xs text-white/40">{item.detail}</p>
                  </div>
                  <span className="text-xs text-white/30 shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-[#00d4ff]/5 to-transparent border-[#00d4ff]/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">JARVIS AI</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Active
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Model</span>
                  <span className="text-white/80">GPT-4 Omni</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Context</span>
                  <span className="text-white/80">128K tokens</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Mode</span>
                  <Badge variant="default" className="text-[10px] h-4">Fast</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/50">Daily Usage</span>
                  <span className="text-white/80">847 / 2000 requests</span>
                </div>
                <Progress value={42} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-sm font-medium text-white">System Resources</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/50">CPU</span>
                    <span className="text-[#00d4ff]">{metrics.cpu}%</span>
                  </div>
                  <Progress value={metrics.cpu} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/50">Memory</span>
                    <span className="text-[#00d4ff]">{metrics.memory}%</span>
                  </div>
                  <Progress value={metrics.memory} className="h-1.5" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Uptime</span>
                  <span className="text-white/70">{metrics.uptime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Processes</span>
                  <span className="text-white/70">{metrics.activeProcesses}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Network Latency</span>
                  <span className="text-white/70">{metrics.networkLatency}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[#00d4ff]" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {conversations.slice(0, 4).map((conv) => (
                <Link key={conv.id} href={`/chat?conv=${conv.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <MessageSquare className="h-4 w-4 text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 truncate">{conv.title}</p>
                      <p className="text-[10px] text-white/30">{conv.messages.length} messages</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
