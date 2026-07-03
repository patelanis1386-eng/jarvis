"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Plus, Power, PowerOff, Trash2, Clock, Play, Settings, ExternalLink, AlertCircle } from "lucide-react"
import { useAutomationStore } from "@/stores/automation-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { v4 as uuidv4 } from "uuid"
import type { Automation } from "@/types"

export default function AutomationPage() {
  const { automations, addAutomation, toggleEnabled, deleteAutomation } = useAutomationStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newAuto, setNewAuto] = useState({ name: "", description: "", trigger: "", action: "" })

  const handleCreate = () => {
    if (!newAuto.name) return
    addAutomation({
      id: uuidv4(),
      name: newAuto.name,
      description: newAuto.description,
      trigger: newAuto.trigger,
      action: newAuto.action,
      enabled: true,
      config: {},
    })
    setNewAuto({ name: "", description: "", trigger: "", action: "" })
    setShowCreate(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Automation Center</h1>
          <p className="text-sm text-white/50">Create and manage automated workflows</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="glow">
              <Plus className="h-4 w-4" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Automation</DialogTitle>
              <DialogDescription>Define a new automated workflow for JARVIS to execute</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newAuto.name}
                  onChange={(e) => setNewAuto({ ...newAuto, name: e.target.value })}
                  placeholder="e.g., Daily Report Generator"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newAuto.description}
                  onChange={(e) => setNewAuto({ ...newAuto, description: e.target.value })}
                  placeholder="What does this automation do?"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Condition</Label>
                <Input
                  value={newAuto.trigger}
                  onChange={(e) => setNewAuto({ ...newAuto, trigger: e.target.value })}
                  placeholder="e.g., Schedule: 9 AM daily"
                />
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Input
                  value={newAuto.action}
                  onChange={(e) => setNewAuto({ ...newAuto, action: e.target.value })}
                  placeholder="e.g., Generate report + Email"
                />
              </div>
              <Button variant="glow" className="w-full" onClick={handleCreate}>
                <Zap className="h-4 w-4" />
                Deploy Automation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {automations.map((auto, i) => (
            <motion.div
              key={auto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant={auto.enabled ? "highlight" : "default"} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auto.enabled ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"}`}>
                      <Zap className={`h-5 w-5 ${auto.enabled ? "text-green-400" : "text-white/30"}`} />
                    </div>
                    <Switch
                      checked={auto.enabled}
                      onCheckedChange={() => toggleEnabled(auto.id)}
                    />
                  </div>
                  <CardTitle className="text-base mt-2">{auto.name}</CardTitle>
                  <CardDescription>{auto.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-white/50">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Trigger: {auto.trigger}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      <Play className="h-3.5 w-3.5" />
                      <span>Action: {auto.action}</span>
                    </div>
                    {auto.lastRun && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last run: {auto.lastRun.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-red-400" onClick={() => deleteAutomation(auto.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Badge variant={auto.enabled ? "success" : "outline"} className="ml-auto text-[10px]">
                      {auto.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {automations.length === 0 && (
        <div className="text-center py-16">
          <Zap className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No automations created yet</p>
          <p className="text-sm text-white/30 mt-1">Create your first automation to start automating workflows</p>
        </div>
      )}
    </motion.div>
  )
}
