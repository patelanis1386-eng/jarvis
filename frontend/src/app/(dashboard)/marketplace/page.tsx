"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ShoppingBag, Download, Star, Check, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const plugins = [
  { id: "p1", name: "Data Visualizer", description: "Create stunning interactive data visualizations and dashboards", category: "Visualization", rating: 4.8, downloads: "12.4k", installed: true, color: "from-blue-500/20 to-cyan-500/20" },
  { id: "p2", name: "Code Assistant Pro", description: "Advanced code analysis, generation, and refactoring tools", category: "Development", rating: 4.9, downloads: "18.7k", installed: true, color: "from-green-500/20 to-emerald-500/20" },
  { id: "p3", name: "Web Scraper", description: "Extract and monitor data from any website automatically", category: "Data", rating: 4.6, downloads: "8.2k", installed: false, color: "from-purple-500/20 to-pink-500/20" },
  { id: "p4", name: "Email Assistant", description: "Smart email management, drafting, and auto-reply system", category: "Productivity", rating: 4.7, downloads: "15.3k", installed: false, color: "from-yellow-500/20 to-orange-500/20" },
  { id: "p5", name: "Social Media Manager", description: "Schedule, analyze, and manage social media content", category: "Social", rating: 4.5, downloads: "6.8k", installed: false, color: "from-pink-500/20 to-rose-500/20" },
  { id: "p6", name: "Research Assistant", description: "Automated research with source gathering and summarization", category: "Research", rating: 4.9, downloads: "21.1k", installed: true, color: "from-indigo-500/20 to-blue-500/20" },
  { id: "p7", name: "Calendar Sync", description: "Two-way calendar sync with Google, Outlook, and Apple", category: "Productivity", rating: 4.4, downloads: "9.5k", installed: false, color: "from-red-500/20 to-rose-500/20" },
  { id: "p8", name: "Weather Intelligence", description: "Real-time weather data, forecasts, and alerts", category: "Utility", rating: 4.3, downloads: "5.7k", installed: false, color: "from-cyan-500/20 to-teal-500/20" },
  { id: "p9", name: "Git Integration", description: "Full Git workflow management with PR reviews and CI/CD", category: "Development", rating: 4.8, downloads: "14.2k", installed: false, color: "from-orange-500/20 to-amber-500/20" },
]

const categories = ["All", "Development", "Productivity", "Visualization", "Data", "Research", "Social", "Utility"]

export default function MarketplacePage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [installed, setInstalled] = useState<string[]>(plugins.filter((p) => p.installed).map((p) => p.id))

  const filtered = plugins.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "All" || p.category === category
    return matchesSearch && matchesCategory
  })

  const handleInstall = (id: string) => {
    setInstalled((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugin Marketplace</h1>
          <p className="text-sm text-white/50">Extend JARVIS with powerful plugins</p>
        </div>
        <Badge variant="default" className="gap-1.5">
          <ShoppingBag className="h-3 w-3" />
          {plugins.length} Available
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plugins..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                category === cat
                  ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((plugin, i) => (
          <motion.div
            key={plugin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card variant="interactive" className={`bg-gradient-to-br ${plugin.color} group h-full`}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-white/60" />
                  </div>
                  <Badge variant={installed.includes(plugin.id) ? "success" : "outline"} className="text-[10px]">
                    {installed.includes(plugin.id) ? "Installed" : plugin.category}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{plugin.name}</h3>
                <p className="text-sm text-white/50 flex-1 mb-4">{plugin.description}</p>
                <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    {plugin.rating}
                  </span>
                  <span>{plugin.downloads} downloads</span>
                </div>
                <Button
                  variant={installed.includes(plugin.id) ? "outline" : "glow"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleInstall(plugin.id)}
                  disabled={installed.includes(plugin.id)}
                >
                  {installed.includes(plugin.id) ? (
                    <><Check className="h-4 w-4" /> Installed</>
                  ) : (
                    <><Download className="h-4 w-4" /> Install</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No plugins found</p>
          <p className="text-sm text-white/30 mt-1">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </motion.div>
  )
}
