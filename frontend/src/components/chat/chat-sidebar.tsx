"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Trash2, Search, Clock, ChevronLeft, PanelRightOpen } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ChatSidebar() {
  const { conversations, activeConversationId, setActiveConversation, addConversation, deleteConversation } = useChatStore()
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    const id = `conv-${Date.now()}`
    addConversation({
      id,
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: "gpt-4",
      mode: "fast",
    })
    setActiveConversation(id)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-r-lg bg-black/60 border border-white/10 border-l-0 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
      >
        {isOpen ? <ChevronLeft className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden shrink-0 relative"
          >
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-4 border-b border-white/10">
                <Button
                  variant="glow"
                  size="sm"
                  className="w-full"
                  onClick={handleNewChat}
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </div>

              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-8 rounded-md bg-white/5 border border-white/10 pl-8 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00d4ff]/50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                {filtered.map((conv, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      activeConversationId === conv.id
                        ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20"
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {conv.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                    </button>
                  </motion.div>
                ))}

                {filtered.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No conversations found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
