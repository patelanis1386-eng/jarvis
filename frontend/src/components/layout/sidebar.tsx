"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  Eye,
  Bot,
  Database,
  ShoppingBag,
  BookOpen,
  Search,
  Code2,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeItem?: string
  onNavigate?: (href: string) => void
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Voice", icon: Mic, href: "/voice" },
  { label: "Vision", icon: Eye, href: "/vision" },
  { label: "Automation", icon: Bot, href: "/automation" },
  { label: "Memory", icon: Database, href: "/memory" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Knowledge", icon: BookOpen, href: "/knowledge" },
  { label: "Research", icon: Search, href: "/research" },
  { label: "Coding", icon: Code2, href: "/coding" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Admin", icon: Shield, href: "/admin" },
]

function Sidebar({ collapsed, onToggle, activeItem, onNavigate }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "border-r border-white/10 bg-black/80 backdrop-blur-2xl",
        "flex flex-col"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0088ff] flex items-center justify-center text-black font-bold text-sm">
                J
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0088ff] flex items-center justify-center text-black font-bold text-sm">
                J
              </div>
              <span className="text-white font-semibold tracking-wider">JARVIS X</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.href
          return (
            <button
              key={item.href}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                "relative group",
                isActive
                  ? "text-[#00d4ff] bg-[#00d4ff]/10"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#00d4ff] rounded-full shadow-[0_0_8px_rgba(0,212,255,0.5)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-all",
            collapsed && "justify-center"
          )}
        >
          <User className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Tony Stark</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  )
}

export { Sidebar }
