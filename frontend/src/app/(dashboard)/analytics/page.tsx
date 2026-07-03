"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, MessageSquare, Users, Puzzle, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const overviewStats = [
  { label: "Total Conversations", value: "12,847", change: "+12.5%", trend: "up", icon: MessageSquare },
  { label: "Total Messages", value: "89,432", change: "+18.2%", trend: "up", icon: Activity },
  { label: "Active Users", value: "2,847", change: "+8.3%", trend: "up", icon: Users },
  { label: "Installed Plugins", value: "24", change: "+3", trend: "up", icon: Puzzle },
]

const weeklyData = [
  { day: "Mon", conversations: 420, messages: 3200, users: 180 },
  { day: "Tue", conversations: 380, messages: 2800, users: 165 },
  { day: "Wed", conversations: 510, messages: 4100, users: 210 },
  { day: "Thu", conversations: 490, messages: 3800, users: 195 },
  { day: "Fri", conversations: 450, messages: 3500, users: 188 },
  { day: "Sat", conversations: 320, messages: 2100, users: 120 },
  { day: "Sun", conversations: 280, messages: 1800, users: 95 },
]

const monthlyData = [
  { month: "Jan", conversations: 2800, messages: 22000, users: 950 },
  { month: "Feb", conversations: 3200, messages: 25000, users: 1100 },
  { month: "Mar", conversations: 3800, messages: 29000, users: 1350 },
  { month: "Apr", conversations: 4200, messages: 34000, users: 1600 },
  { month: "May", conversations: 4800, messages: 38000, users: 1900 },
  { month: "Jun", conversations: 5100, messages: 42000, users: 2100 },
]

const performanceMetrics = [
  { label: "Avg. Response Time", value: "1.2s", change: "-15%", trend: "up" },
  { label: "Uptime", value: "99.97%", change: "+0.02%", trend: "up" },
  { label: "Error Rate", value: "0.08%", change: "-0.03%", trend: "up" },
  { label: "Avg. Conversation Length", value: "7.2 messages", change: "+5%", trend: "up" },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("weekly")

  const data = period === "weekly" ? weeklyData : monthlyData
  const xKey = period === "weekly" ? "day" : "month"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-white/50">Performance metrics and usage statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  period === p ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-white/50 hover:text-white"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-[#00d4ff]" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
              Conversation Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={xKey} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="conversations" fill="rgba(0,212,255,0.6)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Message Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={xKey} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area type="monotone" dataKey="messages" stroke="#00d4ff" fill="rgba(0,212,255,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-[#00d4ff]" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={xKey} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-[#00d4ff]" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceMetrics.map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm text-white/70">{metric.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
                </div>
                <Badge variant={metric.trend === "up" ? "success" : "error"} className="text-xs">
                  {metric.change}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
