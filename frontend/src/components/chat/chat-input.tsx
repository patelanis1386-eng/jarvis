"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Mic, Zap, Brain } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = React.useState("")
  const [mode, setMode] = React.useState<"fast" | "deep">("fast")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message JARVIS..."
          rows={1}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3 pr-24",
            "text-sm text-white placeholder:text-white/30 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff]/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/40 hover:text-white/60">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/40 hover:text-white/60">
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant={mode === "fast" ? "default" : "ghost"}
          className="h-8 px-2 text-xs"
          onClick={() => setMode("fast")}
        >
          <Zap className="h-3 w-3 mr-1" />
          Fast
        </Button>
        <Button
          size="sm"
          variant={mode === "deep" ? "default" : "ghost"}
          className="h-8 px-2 text-xs"
          onClick={() => setMode("deep")}
        >
          <Brain className="h-3 w-3 mr-1" />
          Deep
        </Button>
      </div>
      <Button
        size="lg"
        variant="glow"
        className="h-[42px] px-4"
        onClick={handleSend}
        disabled={!value.trim() || disabled}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

export { ChatInput }
