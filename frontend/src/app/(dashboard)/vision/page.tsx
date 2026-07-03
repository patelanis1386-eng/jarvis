"use client"

import { motion } from "framer-motion"
import { VisionInterface } from "@/components/vision/vision-interface"
import { Badge } from "@/components/ui/badge"

export default function VisionPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vision Analysis</h1>
          <p className="text-sm text-white/50">Upload images for AI-powered analysis, OCR, and object detection</p>
        </div>
        <Badge variant="outline">Powered by GPT-4 Vision</Badge>
      </div>

      <VisionInterface />
    </motion.div>
  )
}
