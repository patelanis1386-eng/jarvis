"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { AnalyticsData } from "@/types"

interface StatCardProps {
  data: AnalyticsData
  icon?: React.ReactNode
  delay?: number
}

function StatCard({ data, icon, delay = 0 }: StatCardProps) {
  const trendIcon = data.trend === "up"
    ? <TrendingUp className="h-4 w-4 text-emerald-400" />
    : data.trend === "down"
    ? <TrendingDown className="h-4 w-4 text-red-400" />
    : <Minus className="h-4 w-4 text-white/40" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant="default" className="group hover:border-[#00d4ff]/20 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            {icon && (
              <div className="h-8 w-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs">
              {trendIcon}
              {data.change !== undefined && (
                <span className={cn(
                  data.trend === "up" && "text-emerald-400",
                  data.trend === "down" && "text-red-400",
                  data.trend === "neutral" && "text-white/40"
                )}>
                  {data.change > 0 ? "+" : ""}{data.change}%
                </span>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{data.value.toLocaleString()}</p>
          <p className="text-xs text-white/40">{data.label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { StatCard }
