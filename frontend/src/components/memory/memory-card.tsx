"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Star, Clock, Trash2, RefreshCw } from "lucide-react"
import { MemoryItem } from "@/types"

interface MemoryCardProps {
  item: MemoryItem
  onDelete?: (id: string) => void
  onRefresh?: (id: string) => void
}

const typeConfig = {
  fact: { label: "Fact", variant: "info" as const },
  concept: { label: "Concept", variant: "purple" as const },
  event: { label: "Event", variant: "success" as const },
  preference: { label: "Preference", variant: "warning" as const },
}

function MemoryCard({ item, onDelete, onRefresh }: MemoryCardProps) {
  const config = typeConfig[item.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card variant="interactive" className="group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge variant={config.variant} className="text-[10px]">
              {config.label}
            </Badge>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRefresh?.(item.id)}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => onDelete?.(item.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-white/80 mb-3 line-clamp-2">{item.content}</p>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30">Importance</span>
                <span className="text-[10px] text-[#00d4ff]">{Math.round(item.importance * 100)}%</span>
              </div>
              <Progress value={item.importance * 100} variant="default" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <Clock className="h-3 w-3" />
              {item.createdAt.toLocaleDateString()}
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { MemoryCard }
