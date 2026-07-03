"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BookOpen, Plus, Link2, Trash2, ExternalLink, Network, Globe } from "lucide-react"
import { useKnowledgeStore } from "@/stores/knowledge-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { v4 as uuidv4 } from "uuid"

export default function KnowledgePage() {
  const { entries, searchQuery, selectedEntry, setSearchQuery, setSelectedEntry, addEntry, deleteEntry } = useKnowledgeStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: "", content: "", source: "", tags: "" })

  const filtered = entries.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAdd = () => {
    if (!newEntry.title) return
    addEntry({
      id: uuidv4(),
      title: newEntry.title,
      content: newEntry.content,
      tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean),
      source: newEntry.source,
      connections: [],
    })
    setNewEntry({ title: "", content: "", source: "", tags: "" })
    setShowAdd(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
          <p className="text-sm text-white/50">{entries.length} knowledge entries interconnected</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button variant="glow">
              <Plus className="h-4 w-4" />
              Add Knowledge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Knowledge Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newEntry.title} onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })} placeholder="Entry title" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={newEntry.content} onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })} placeholder="Knowledge content..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={newEntry.source} onChange={(e) => setNewEntry({ ...newEntry, source: e.target.value })} placeholder="e.g., Research Paper, Wikipedia" />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={newEntry.tags} onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })} placeholder="ai, machine-learning, neural" />
              </div>
              <Button variant="glow" className="w-full" onClick={handleAdd}>
                <BookOpen className="h-4 w-4" />
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search knowledge base..." className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  variant="interactive"
                  onClick={() => setSelectedEntry(entry)}
                  className={selectedEntry?.id === entry.id ? "border-[#00d4ff]/40" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-[#00d4ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-white">{entry.title}</h3>
                          <Badge variant="outline" className="text-[10px] ml-auto">{entry.source}</Badge>
                        </div>
                        <p className="text-sm text-white/60 line-clamp-2">{entry.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="default" className="text-[10px] h-4 px-1.5">#{tag}</Badge>
                          ))}
                          {entry.connections.length > 0 && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1 ml-auto">
                              <Link2 className="h-3 w-3" />
                              {entry.connections.length} connections
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Network className="h-4 w-4 text-[#00d4ff]" />
                Knowledge Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-xl bg-gradient-to-br from-[#00d4ff]/5 to-purple-500/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                <Network className="h-12 w-12 text-white/20" />
                {selectedEntry && (
                  <div className="absolute inset-0 p-4">
                    <div className="w-full h-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                      {selectedEntry.connections.map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-purple-400/60"
                          style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${20 + Math.random() * 60}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="highlight">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">{selectedEntry.title}</h3>
                  <p className="text-xs text-white/60 mb-3">{selectedEntry.content}</p>
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Globe className="h-3 w-3" />
                    {selectedEntry.source}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40">No knowledge entries found</p>
        </div>
      )}
    </motion.div>
  )
}
