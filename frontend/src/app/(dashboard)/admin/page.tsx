"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Users, Activity, FileText, CheckCircle, XCircle, Settings as SettingsIcon, AlertTriangle, Search, Ban, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

const users = [
  { id: "u1", name: "Tony Stark", email: "tony@stark.com", role: "admin", status: "active", conversations: 847, joined: "Jan 2026" },
  { id: "u2", name: "Steve Rogers", email: "steve@avengers.com", role: "user", status: "active", conversations: 523, joined: "Feb 2026" },
  { id: "u3", name: "Natasha Romanoff", email: "natasha@avengers.com", role: "user", status: "active", conversations: 691, joined: "Jan 2026" },
  { id: "u4", name: "Bruce Banner", email: "bruce@avengers.com", role: "user", status: "suspended", conversations: 234, joined: "Mar 2026" },
  { id: "u5", name: "Thor Odinson", email: "thor@asgard.com", role: "user", status: "active", conversations: 156, joined: "Apr 2026" },
]

const systemLogs = [
  { action: "System Update v2.1.0 deployed", timestamp: "2026-07-04 02:00:00", status: "success" },
  { action: "Memory optimization completed", timestamp: "2026-07-04 01:30:00", status: "success" },
  { action: "Plugin 'Data Visualizer' installed", timestamp: "2026-07-03 22:15:00", status: "success" },
  { action: "Backup database completed", timestamp: "2026-07-03 20:00:00", status: "success" },
  { action: "Failed login attempt detected", timestamp: "2026-07-03 18:45:00", status: "warning" },
  { action: "API rate limit reached for user 'bruce'", timestamp: "2026-07-03 16:30:00", status: "error" },
  { action: "Certificate renewal successful", timestamp: "2026-07-03 14:00:00", status: "success" },
]

const pluginApprovals = [
  { name: "Web Scraper Pro", author: "DataForge Inc.", version: "2.1.0", status: "pending", downloads: 0 },
  { name: "Email Assistant", author: "CommTools", version: "1.3.0", status: "pending", downloads: 0 },
  { name: "Calendar Sync", author: "TimeLabs", version: "3.0.0", status: "approved", downloads: 1247 },
]

const systemConfig = [
  { key: "MAX_TOKENS_PER_REQUEST", value: "4096", type: "number" },
  { key: "RATE_LIMIT_PER_MINUTE", value: "60", type: "number" },
  { key: "ENABLE_VOICE_ASSISTANT", value: "true", type: "boolean" },
  { key: "LOG_LEVEL", value: "info", type: "select" },
  { key: "MAX_FILE_UPLOAD_SIZE", value: "50MB", type: "string" },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [userSearch, setUserSearch] = useState("")

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-white/50">System administration and configuration</p>
        </div>
        <Badge variant="default" className="gap-1.5">
          <Shield className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "2,847", change: "+12%", icon: Users },
          { label: "Active Today", value: "1,234", change: "+8%", icon: Activity },
          { label: "Pending Approvals", value: "3", change: "-", icon: FileText },
          { label: "System Alerts", value: "1", change: "Critical", icon: AlertTriangle },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="h-5 w-5 text-[#00d4ff]" />
                  <span className="text-xs text-green-400">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><Activity className="h-4 w-4" /> System Logs</TabsTrigger>
          <TabsTrigger value="plugins" className="gap-2"><FileText className="h-4 w-4" /> Plugin Approvals</TabsTrigger>
          <TabsTrigger value="config" className="gap-2"><SettingsIcon className="h-4 w-4" /> Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">User Management</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <Badge variant={user.role === "admin" ? "default" : "outline"} className="text-[10px]">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40">{user.email}</p>
                    <p className="text-xs text-white/30 mt-0.5">{user.conversations} conversations &middot; Joined {user.joined}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.status === "active" ? "success" : "error"} className="text-[10px]">
                      {user.status}
                    </Badge>
                    {user.status !== "suspended" ? (
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Logs</CardTitle>
              <CardDescription>Recent system events and errors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {systemLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    log.status === "success" ? "bg-green-400" :
                    log.status === "warning" ? "bg-yellow-400" : "bg-red-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{log.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/30">{log.timestamp}</span>
                    <Badge variant={log.status === "success" ? "success" : log.status === "warning" ? "warning" : "error"} className="text-[10px]">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plugin Approval Queue</CardTitle>
              <CardDescription>Review and approve plugins for the marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pluginApprovals.map((plugin, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#00d4ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{plugin.name}</p>
                    <p className="text-xs text-white/40">by {plugin.author} &middot; v{plugin.version}</p>
                    {plugin.downloads > 0 && (
                      <p className="text-xs text-white/30">{plugin.downloads} downloads</p>
                    )}
                  </div>
                  <Badge variant={plugin.status === "approved" ? "success" : "warning"} className="text-[10px]">
                    {plugin.status}
                  </Badge>
                  {plugin.status === "pending" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-green-400">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Configuration</CardTitle>
              <CardDescription>Manage system-wide settings and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {systemConfig.map((config, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <code className="text-sm text-[#00d4ff] font-mono">{config.key}</code>
                    <Badge variant="outline" className="ml-2 text-[10px]">{config.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {config.type === "boolean" ? (
                      <Switch defaultChecked={config.value === "true"} />
                    ) : (
                      <code className="text-sm text-white/80 font-mono bg-black/40 px-2 py-1 rounded border border-white/10">
                        {config.value}
                      </code>
                    )}
                    <Button variant="ghost" size="sm">
                      <SettingsIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
