"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Brain, X } from "lucide-react"
import { MemoryItem } from "@/types"

interface MemorySearchProps {
  onSearch?: (query: string) => void
  results?: MemoryItem[]
}

function MemorySearch({ onSearch, results = [] }: MemorySearchProps) {
  const [query, setQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.length > 2) {
      setIsSearching(true)
      onSearch?.(value)
      setTimeout(() => setIsSearching(false), 1000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search memories across time..."
          className={cn(
            "w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl pl-10 pr-10 py-3",
            "text-sm text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff]/50",
            "transition-all duration-200"
          )}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); onSearch?.("") }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-[#00d4ff]/60">
          <Brain className="h-4 w-4 animate-pulse" />
          Searching semantic memory...
        </div>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {results.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <Brain className="h-4 w-4 mt-0.5 text-[#00d4ff] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{item.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-[10px]">{item.type}</Badge>
                    <span className="text-[10px] text-white/30">
                      {Math.round(item.importance * 100)}% relevance
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { MemorySearch }
