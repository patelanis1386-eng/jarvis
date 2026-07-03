"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Sparkles, StopCircle, RefreshCw, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Message } from "@/types"
import { v4 as uuidv4 } from "uuid"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ChatInterface() {
  const { conversations, activeConversationId, sendMessage } = useChatStore()
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const messages = activeConversation?.messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    const content = input.trim()
    setInput("")
    setIsStreaming(true)
    await sendMessage(content)
    setIsStreaming(false)
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-[#00d4ff]/20 text-[#00d4ff]">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn("max-w-[80%] group", message.role === "user" && "order-first")}>
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-[#00d4ff]">JARVIS</span>
                    {message.model && (
                      <span className="text-[10px] text-white/30">{message.model}</span>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-[#00d4ff]/15 text-white border border-[#00d4ff]/20 rounded-tr-md"
                      : "bg-white/5 text-white/90 border border-white/10 rounded-tl-md"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>

                <div className={cn(
                  "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}>
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
                  >
                    {copiedId === message.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                  {message.role === "assistant" && (
                    <>
                      <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-green-400 transition-all">
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all">
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-white/10 text-white/60">U</AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm text-[#00d4ff]/60"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>JARVIS is processing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message JARVIS..."
            className="min-h-[56px] pr-24 resize-none bg-white/5 border-white/10 rounded-xl text-sm"
            disabled={isStreaming}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {isStreaming ? (
              <Button variant="ghost" size="sm" onClick={() => setIsStreaming(false)} className="text-red-400 hover:text-red-300">
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  variant="glow"
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-[10px] text-white/20 text-center mt-2">
          JARVIS X may produce inaccurate information. Verify important facts.
        </p>
      </div>
    </div>
  )
}
