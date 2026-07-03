"use client"

import { motion } from "framer-motion"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-8rem)] flex relative"
    >
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface />
      </div>
      <ChatSidebar />
    </motion.div>
  )
}
