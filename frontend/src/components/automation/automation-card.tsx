"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Play, Clock, Zap, Trash2 } from "lucide-react"
import { Automation } from "@/types"

interface AutomationCardProps {
  automation: Automation
  onToggle?: (id: string, enabled: boolean) => void
  onRun?: (id: string) => void
  onDelete?: (id: string) => void
}

const triggerIcons: Record<string, React.ReactNode> = {
  schedule: <Clock className="h-4 w-4" />,
  webhook: <Zap className="h-4 w-4" />,
}

function AutomationCard({ automation, onToggle, onRun, onDelete }: AutomationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card variant="interactive" className="group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
                {triggerIcons[automation.trigger.type] || <Zap className="h-4 w-4 text-[#00d4ff]" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{automation.name}</h3>
                <p className="text-xs text-white/40">{automation.description}</p>
              </div>
            </div>
            <Switch
              checked={automation.enabled}
              onCheckedChange={(checked) => onToggle?.(automation.id, checked)}
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info" className="text-[10px]">
              Trigger: {automation.trigger.type}
            </Badge>
            <Badge variant="default" className="text-[10px]">
              Action: {automation.action.type}
            </Badge>
          </div>

          {automation.lastRun && (
            <p className="text-[10px] text-white/30 mb-3">
              Last run: {new Date(automation.lastRun).toLocaleString()}
            </p>
          )}

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onRun?.(automation.id)}
            >
              <Play className="h-3 w-3 mr-1" />
              Run
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
              onClick={() => onDelete?.(automation.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { AutomationCard }
