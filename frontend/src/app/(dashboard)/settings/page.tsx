"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings, User, Bell, Key, Shield, Link2, Palette, CreditCard, Save, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Bell },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
]

export default function SettingsPage() {
  const { user, updateUser: updateProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState("profile")
  const [showKey, setShowKey] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50">Configure your JARVIS X experience</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                      <p className="text-sm text-white/50">{user?.email}</p>
                      <Badge variant="default" className="mt-1">{user?.role}</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">Change Avatar</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue={user?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue={user?.email} type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input defaultValue="tony_stark" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <Button variant="glow" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preferences</CardTitle>
                  <CardDescription>Customize your notification and language preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Email Notifications</p>
                        <p className="text-xs text-white/40">Receive updates via email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Push Notifications</p>
                        <p className="text-xs text-white/40">Browser push notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Sound Effects</p>
                        <p className="text-xs text-white/40">Play sounds for events</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Auto-save Conversations</p>
                        <p className="text-xs text-white/40">Automatically save all conversations</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "api-keys" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API Keys</CardTitle>
                  <CardDescription>Manage your API keys for external services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "OpenAI", key: "sk-...a1b2c3d4e5f6", connected: true },
                    { name: "Anthropic", key: "sk-ant-...xyz789", connected: true },
                    { name: "Google AI", key: "AIza...not_configured", connected: false },
                    { name: "GitHub", key: "ghp_...configured", connected: true },
                  ].map((api) => (
                    <div key={api.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className={`w-3 h-3 rounded-full ${api.connected ? "bg-green-400" : "bg-red-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{api.name}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-white/40 font-mono">
                            {showKey === api.name ? api.key : api.key.slice(0, 8) + "..."}
                          </code>
                          <button
                            onClick={() => setShowKey(showKey === api.name ? null : api.name)}
                            className="text-white/30 hover:text-white"
                          >
                            {showKey === api.name ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <Badge variant={api.connected ? "success" : "error"} className="text-[10px]">
                        {api.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" />
                  </div>
                  <Button variant="glow">Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">2FA Status</p>
                      <p className="text-xs text-white/40">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { device: "Chrome on Windows", location: "New York, US", active: true },
                    { device: "Safari on iPhone", location: "New York, US", active: true },
                    { device: "Firefox on Linux", location: "Unknown", active: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${session.active ? "bg-green-400" : "bg-white/20"}`} />
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{session.device}</p>
                        <p className="text-xs text-white/40">{session.location}</p>
                      </div>
                      {session.active && (
                        <Button variant="ghost" size="sm" className="text-red-400 text-xs">Revoke</Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "integrations" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connected Services</CardTitle>
                  <CardDescription>Manage your third-party integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Google Drive", description: "Access and manage your Google Drive files", connected: true, icon: "G" },
                    { name: "Slack", description: "Send messages and notifications to Slack", connected: true, icon: "S" },
                    { name: "GitHub", description: "Repository management and code review", connected: true, icon: "GH" },
                    { name: "Notion", description: "Sync notes and documentation", connected: false, icon: "N" },
                    { name: "Discord", description: "Community notifications and updates", connected: false, icon: "D" },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white/60">
                        {service.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{service.name}</p>
                        <p className="text-xs text-white/40">{service.description}</p>
                      </div>
                      <Switch defaultChecked={service.connected} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Theme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {["Dark", "Light", "System"].map((theme) => (
                      <button
                        key={theme}
                        className={`px-6 py-3 rounded-lg border text-sm transition-all ${
                          theme === "Dark"
                            ? "bg-[#00d4ff]/20 border-[#00d4ff]/30 text-[#00d4ff]"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Font Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Slider defaultValue={[16]} min={12} max={24} step={1} />
                  <div className="flex justify-between text-xs text-white/30">
                    <span>Aa</span>
                    <span>Aa</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Compact Mode</p>
                      <p className="text-xs text-white/40">Reduce spacing for more content</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card variant="highlight" className="bg-gradient-to-br from-[#00d4ff]/10 to-purple-500/10 border-[#00d4ff]/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/50">Current Plan</p>
                      <h3 className="text-2xl font-bold text-white mt-1">JARVIS X Pro</h3>
                      <p className="text-lg text-[#00d4ff] font-semibold">$29<span className="text-sm text-white/40">/month</span></p>
                    </div>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Storage</span>
                      <span className="text-white/80">50 GB / 100 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">API Calls</span>
                      <span className="text-white/80">8,432 / 10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Team Members</span>
                      <span className="text-white/80">1 / 5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <CreditCard className="h-8 w-8 text-white/40" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80">Visa ending in 4242</p>
                      <p className="text-xs text-white/40">Expires 12/2027</p>
                    </div>
                    <Button variant="ghost" size="sm">Update</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { date: "Jun 1, 2026", amount: "$29.00", status: "Paid" },
                    { date: "May 1, 2026", amount: "$29.00", status: "Paid" },
                    { date: "Apr 1, 2026", amount: "$29.00", status: "Paid" },
                  ].map((bill, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5">
                      <span className="text-sm text-white/70">{bill.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/80">{bill.amount}</span>
                        <Badge variant="success" className="text-[10px]">{bill.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
