"use client"

import { motion } from "framer-motion"
import { User, MessageSquare, Brain, Zap, Calendar, Clock, Activity, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"
import { useChatStore } from "@/stores/chat-store"
import { useMemoryStore } from "@/stores/memory-store"
import { useAutomationStore } from "@/stores/automation-store"
import { Button } from "@/components/ui/button"

const stats = [
  { label: "Conversations", value: "1,247", icon: MessageSquare, color: "text-[#00d4ff]" },
  { label: "Memory Items", value: "8,432", icon: Brain, color: "text-purple-400" },
  { label: "Automations", value: "12", icon: Zap, color: "text-green-400" },
  { label: "Days Active", value: "186", icon: Calendar, color: "text-yellow-400" },
]

const activityHistory = [
  { action: "Started new chat about quantum computing", type: "chat", time: "2 hours ago" },
  { action: "Created automation 'Daily Report'", type: "automation", time: "5 hours ago" },
  { action: "Added memory: User prefers dark mode", type: "memory", time: "1 day ago" },
  { action: "Installed plugin 'Data Visualizer'", type: "plugin", time: "2 days ago" },
  { action: "Completed deep research on AI trends", type: "research", time: "3 days ago" },
  { action: "Refactored codebase with Code Assistant", type: "coding", time: "4 days ago" },
]

export default function ProfilePage() {
  const { user } = useAuthStore()
  const conversations = useChatStore((s) => s.conversations)
  const memoryItems = useMemoryStore((s) => s.items)
  const automations = useAutomationStore((s) => s.automations)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-white/50">Your JARVIS X identity and activity</p>
      </div>

      <Card className="bg-gradient-to-br from-[#00d4ff]/5 to-purple-500/5 border-[#00d4ff]/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-2 border-[#00d4ff]/30">
              <AvatarFallback className="text-3xl bg-[#00d4ff]/10 text-[#00d4ff]">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
                <Badge variant="default">{user?.role || "user"}</Badge>
              </div>
              <p className="text-sm text-white/50 mt-1">{user?.email}</p>
              <p className="text-sm text-white/40 mt-1">Member since January 2026</p>
              <div className="flex items-center gap-4 mt-4">
                <Button variant="outline" size="sm">Edit Profile</Button>
                <Button variant="outline" size="sm">Share Profile</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {activityHistory.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {item.type === "chat" && <MessageSquare className="h-3.5 w-3.5 text-[#00d4ff]" />}
                  {item.type === "automation" && <Zap className="h-3.5 w-3.5 text-green-400" />}
                  {item.type === "memory" && <Brain className="h-3.5 w-3.5 text-purple-400" />}
                  {item.type === "plugin" && <Star className="h-3.5 w-3.5 text-yellow-400" />}
                  {item.type === "research" && <Activity className="h-3.5 w-3.5 text-blue-400" />}
                  {item.type === "coding" && <Code className="h-3.5 w-3.5 text-pink-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{item.action}</p>
                </div>
                <span className="text-xs text-white/30 shrink-0">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-[#00d4ff]" />
              Preferences Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Theme</span>
              <Badge variant="outline" className="text-xs">Dark Mode</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Language</span>
              <Badge variant="outline" className="text-xs">English</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">AI Model</span>
              <Badge variant="default" className="text-xs">GPT-4 Omni</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Notification</span>
              <Badge variant="success" className="text-xs">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-white/50">2FA</span>
              <Badge variant="warning" className="text-xs">Not Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function Code(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
