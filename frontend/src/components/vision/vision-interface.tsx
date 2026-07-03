"use client"

import * as React from "react"
import { ImageUploader } from "@/components/vision/image-uploader"
import { AnalysisResult } from "@/components/vision/analysis-result"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { ScanLine } from "lucide-react"

interface AnalysisData {
  description: string
  objects: { label: string; confidence: number }[]
  text: string
  labels: string[]
}

function VisionInterface() {
  const [image, setImage] = React.useState<string | null>(null)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<AnalysisData | null>(null)

  const handleImageSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setAnalysis(null)
      setAnalyzing(true)

      setTimeout(() => {
        setAnalysis({
          description: "This image appears to be a modern smart home setup with multiple connected devices. The scene features a central holographic display projecting real-time data visualizations including weather, energy consumption, and security camera feeds. The environment suggests an AI-integrated living space with voice-controlled automation.",
          objects: [
            { label: "Holographic Display", confidence: 0.98 },
            { label: "Smart Speaker", confidence: 0.95 },
            { label: "Security Camera", confidence: 0.92 },
            { label: "Smart Lighting", confidence: 0.89 },
            { label: "Temperature Sensor", confidence: 0.85 },
          ],
          text: "JARVIS X • AI COMMAND CENTER • STATUS: ONLINE • ENERGY OPTIMIZED • SECURITY ACTIVE",
          labels: ["technology", "smart home", "AI", "hologram", "automation", "future"],
        })
        setAnalyzing(false)
      }, 2500)
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    setImage(null)
    setAnalysis(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">Vision Analysis</h1>
        <p className="text-sm text-white/50 mt-1">Upload images for AI-powered analysis</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ImageUploader onImageSelect={handleImageSelect} />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={image} alt="Uploaded" className="w-full max-h-96 object-contain bg-black/60" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative h-16 w-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-[#00d4ff]/30 animate-ping" />
                      <div className="absolute inset-2 rounded-full border border-[#00d4ff]/40 animate-spin" style={{ animationDuration: "3s" }} />
                      <ScanLine className="absolute inset-3 h-10 w-10 text-[#00d4ff] m-auto animate-pulse" />
                    </div>
                    <p className="text-sm text-[#00d4ff]">Analyzing image...</p>
                  </div>
                </div>
              )}
            </div>

            {analysis && (
              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="objects">Objects</TabsTrigger>
                  <TabsTrigger value="text">OCR Text</TabsTrigger>
                  <TabsTrigger value="labels">Labels</TabsTrigger>
                </TabsList>
                <TabsContent value="description">
                  <AnalysisResult
                    title="Scene Description"
                    content={analysis.description}
                    icon="description"
                  />
                </TabsContent>
                <TabsContent value="objects">
                  <AnalysisResult
                    title="Detected Objects"
                    objects={analysis.objects}
                    icon="objects"
                  />
                </TabsContent>
                <TabsContent value="text">
                  <AnalysisResult
                    title="Detected Text (OCR)"
                    content={analysis.text}
                    icon="text"
                  />
                </TabsContent>
                <TabsContent value="labels">
                  <AnalysisResult
                    title="Classification Labels"
                    labels={analysis.labels}
                    icon="labels"
                  />
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="text-sm text-[#00d4ff] hover:text-[#00d4ff]/80 underline underline-offset-4 transition-colors"
              >
                Analyze another image
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { VisionInterface }
