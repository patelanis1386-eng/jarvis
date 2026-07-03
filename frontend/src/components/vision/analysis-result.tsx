"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, BoxSelect, Type, Tags } from "lucide-react"

interface AnalysisResultProps {
  title: string
  content?: string
  objects?: { label: string; confidence: number }[]
  labels?: string[]
  icon?: "description" | "objects" | "text" | "labels"
}

const iconMap = {
  description: Eye,
  objects: BoxSelect,
  text: Type,
  labels: Tags,
}

function AnalysisResult({ title, content, objects, labels, icon = "description" }: AnalysisResultProps) {
  const Icon = iconMap[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-[#00d4ff]" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>

          {content && (
            <p className="text-sm text-white/70 leading-relaxed">{content}</p>
          )}

          {objects && (
            <div className="space-y-3">
              {objects.map((obj, index) => (
                <motion.div
                  key={obj.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm text-white/70 w-32 truncate">{obj.label}</span>
                  <div className="flex-1">
                    <Progress value={obj.confidence * 100} variant="default" />
                  </div>
                  <span className="text-xs text-white/40 w-10 text-right">
                    {Math.round(obj.confidence * 100)}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {labels && (
            <div className="flex flex-wrap gap-2">
              {labels.map((label, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge variant="info">{label}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { AnalysisResult }
