"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Beaker, Download, Clock, Globe, FileText, ExternalLink, Sparkles, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

const researchHistory = [
  { topic: "Quantum Computing Breakthroughs 2026", depth: "Deep", date: "2 hours ago", sources: 24, status: "completed" },
  { topic: "Neural Network Architecture Trends", depth: "Deep", date: "1 day ago", sources: 18, status: "completed" },
  { topic: "AI Regulation Framework EU", depth: "Moderate", date: "3 days ago", sources: 12, status: "completed" },
  { topic: "Renewable Energy Storage Solutions", depth: "Fast", date: "1 week ago", sources: 8, status: "completed" },
]

const sampleResults = {
  summary: "Our research into this topic reveals significant developments across multiple domains. Key findings indicate a paradigm shift in how organizations approach this subject, with particular emphasis on AI-driven solutions. The data suggests a 47% increase in adoption rates over the past quarter, with enterprise solutions leading the charge. Emerging trends point toward decentralized architectures and increased automation.",
  keyFindings: [
    "Market adoption has increased by 47% in Q1 2026",
    "Enterprise solutions dominate with 62% market share",
    "AI integration reduced operational costs by 34%",
    "Security concerns remain the primary adoption barrier",
  ],
  sources: [
    { title: "Industry Report 2026 - Market Analysis", url: "#", relevance: 98, type: "Report" },
    { title: "Academic Paper: Neural Approaches", url: "#", relevance: 95, type: "Academic" },
    { title: "TechCrunch Analysis: Latest Trends", url: "#", relevance: 91, type: "News" },
    { title: "Government White Paper on Regulation", url: "#", relevance: 88, type: "Government" },
    { title: "Stanford Research Lab Publication", url: "#", relevance: 85, type: "Academic" },
  ],
}

export default function ResearchPage() {
  const [topic, setTopic] = useState("")
  const [depth, setDepth] = useState("Moderate")
  const [isResearching, setIsResearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<typeof sampleResults | null>(null)
  const handleResearch = async () => {
    if (!topic.trim()) return
    setIsResearching(true)
    setProgress(0)
    setResults(null)

    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 150))
      setProgress(i)
    }

    setResults(sampleResults)
    setIsResearching(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Mode</h1>
          <p className="text-sm text-white/50">Deep research powered by AI with multi-source analysis</p>
        </div>
        <Badge variant="default" className="gap-1.5">
          <Beaker className="h-3 w-3" />
          Deep Research Active
        </Badge>
      </div>

      <Card className="border-[#00d4ff]/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Research Topic</Label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your research topic or question..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Research Depth</Label>
                <div className="flex gap-2">
                  {["Fast", "Moderate", "Deep"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        depth === d
                          ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                          : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="glow"
                size="lg"
                className="ml-auto"
                onClick={handleResearch}
                disabled={!topic.trim() || isResearching}
                loading={isResearching}
              >
                {!isResearching && <Sparkles className="h-4 w-4" />}
                Start Research
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isResearching && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#00d4ff] flex items-center gap-2">
              <Beaker className="h-4 w-4 animate-pulse" />
              Conducting deep research...
            </span>
            <span className="text-white/50">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-white/30">Analyzing sources, cross-referencing data, generating insights</p>
        </motion.div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card variant="highlight">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-sm font-medium text-white">Executive Summary</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{results.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-[#00d4ff]" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.keyFindings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center shrink-0 text-xs text-[#00d4ff] font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm text-white/70">{finding}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-[#00d4ff]" />
                  Sources ({results.sources.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{source.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4">{source.type}</Badge>
                        <span className="text-[10px] text-white/30">Relevance: {source.relevance}%</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/30 hover:text-[#00d4ff] cursor-pointer" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Research
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#00d4ff]" />
            Research History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {researchHistory.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              <Beaker className="h-4 w-4 text-white/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70">{item.topic}</p>
                <p className="text-xs text-white/30">{item.date} &middot; {item.sources} sources</p>
              </div>
              <Badge variant={item.depth === "Deep" ? "default" : item.depth === "Moderate" ? "info" : "outline"} className="text-[10px]">
                {item.depth}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
