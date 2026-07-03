"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { BookOpen, ExternalLink, Share2 } from "lucide-react"
import { Knowledge } from "@/types"

interface KnowledgeCardProps {
  entry: Knowledge
  onExpand?: (id: string) => void
}

function KnowledgeCard({ entry, onExpand }: KnowledgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card variant="interactive" className="group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-[#00d4ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1 truncate">{entry.title}</h3>
              <p className="text-xs text-white/60 line-clamp-2 mb-2">{entry.content}</p>

              <div className="flex flex-wrap gap-1 mb-2">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">Source: {entry.source}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onExpand?.(entry.id)}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { KnowledgeCard }
