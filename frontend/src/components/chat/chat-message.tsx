"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StreamingText } from "@/components/chat/streaming-text"
import { Message } from "@/types"
import { motion } from "framer-motion"
import { Copy, RefreshCw, Trash2, Check } from "lucide-react"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === "user"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar
        fallback={isUser ? "U" : "J"}
        size="md"
        glow={!isUser}
        className={cn(
          isUser ? "bg-[#00d4ff]/20" : "bg-gradient-to-br from-[#00d4ff] to-[#0088ff]"
        )}
      />
      <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-white"
              : "bg-white/5 border border-white/10 text-white/90"
          )}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <StreamingText text={message.content} isStreaming={isStreaming} />
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-white/30">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export { ChatMessage }
