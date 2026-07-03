"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  Eye,
  Zap,
  Brain,
  ShoppingBag,
  BookOpen,
  Beaker,
  Code,
  Settings,
  User,
  Bell,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import { useAuthStore } from "@/stores/auth-store"
import { useNotificationStore } from "@/stores/notification-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Voice", icon: Mic, href: "/voice" },
  { label: "Vision", icon: Eye, href: "/vision" },
  { label: "Automation", icon: Zap, href: "/automation" },
  { label: "Memory", icon: Brain, href: "/memory" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Knowledge", icon: BookOpen, href: "/knowledge" },
  { label: "Research", icon: Beaker, href: "/research" },
  { label: "Coding", icon: Code, href: "/coding" },
]

const bottomNavItems = [
  { label: "Notifications", icon: Bell, href: "/notifications" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Admin", icon: Shield, href: "/admin" },
  { label: "Profile", icon: User, href: "/profile" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed lg:relative z-50 h-full border-r border-white/10 bg-black/90 backdrop-blur-xl transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-[72px]" : "w-[240px]",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex items-center h-16 border-b border-white/10 px-4", sidebarCollapsed ? "justify-center" : "justify-between")}>
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center">
                <span className="text-[#00d4ff] font-bold text-sm">JX</span>
              </div>
              <span className="font-semibold text-white tracking-wide">JARVIS X</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center">
              <span className="text-[#00d4ff] font-bold text-sm">JX</span>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive(item.href)
                    ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}

          {!sidebarCollapsed && <div className="h-px bg-white/10 my-3 mx-3" />}

          {bottomNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive(item.href)
                    ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00d4ff] text-[10px] flex items-center justify-center text-black font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}
        </div>

        <div className={cn("border-t border-white/10 p-4", sidebarCollapsed && "flex flex-col items-center")}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white truncate max-w-[120px]">{user?.name || "User"}</span>
                  <span className="text-xs text-white/40">{user?.role || "user"}</span>
                </div>
              </div>
              <button onClick={logout} className="text-white/40 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Avatar className="h-8 w-8 cursor-pointer" onClick={logout}>
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen(true)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                placeholder="Search anything..."
                className="w-64 h-9 rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00d4ff] text-[10px] flex items-center justify-center text-black font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="glow" size="sm">
                <MessageSquare className="h-4 w-4" />
                New Chat
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
