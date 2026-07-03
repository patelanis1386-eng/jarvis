"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Brain, Star, Trash2, Filter, Lightbulb, Calendar, Heart, BookOpen, ChevronDown } from "lucide-react"
import { useMemoryStore } from "@/stores/memory-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const typeIcons: Record<string, React.ReactNode> = {
  fact: <BookOpen className="h-4 w-4" />,
  concept: <Lightbulb className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  preference: <Heart className="h-4 w-4" />,
}

const typeColors: Record<string, string> = {
  fact: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  concept: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  event: "text-green-400 bg-green-500/20 border-green-500/30",
  preference: "text-pink-400 bg-pink-500/20 border-pink-500/30",
}

export default function MemoryPage() {
  const { items, searchQuery, filterType, setSearchQuery, setFilterType, deleteItem } = useMemoryStore()
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = items.filter((item) => {
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === "all" || item.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Memory Center</h1>
          <p className="text-sm text-white/50">{items.length} stored memories</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-[#00d4ff]" />
            <span className="text-white/50">Importance:</span>
            <span className="text-white/80 font-medium">{items.reduce((a, b) => a + b.importance, 0)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {filterType === "all" ? "All Types" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {filterOpen && (
            <div className="absolute top-full mt-1 right-0 w-40 rounded-lg border border-white/10 bg-black/95 backdrop-blur-xl p-1 z-10 shadow-xl">
              {["all", "fact", "concept", "event", "preference"].map((type) => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setFilterOpen(false) }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === type ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card variant="interactive" className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[item.type] || "bg-white/5 border border-white/10"}`}>
                      {typeIcons[item.type] || <Brain className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={item.type === "fact" ? "info" : item.type === "concept" ? "default" : item.type === "event" ? "success" : "warning"} className="text-[10px] h-4 px-1.5">
                          {item.type}
                        </Badge>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`h-3 w-3 ${j < Math.round(item.importance / 2) ? "text-yellow-400 fill-yellow-400" : "text-white/10"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-white/30">{item.createdAt.toLocaleDateString()}</span>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                        >
                          <Trash2 className="h-3 w-3 text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Brain className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No memories found</p>
          <p className="text-sm text-white/30 mt-1">{searchQuery ? "Try a different search term" : "Start interacting with JARVIS to build memories"}</p>
        </div>
      )}
    </motion.div>
  )
}
