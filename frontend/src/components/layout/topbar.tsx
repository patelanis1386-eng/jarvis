"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  Bell,
  Sun,
  Moon,
  Circle,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  onSearchOpen?: () => void
  notificationCount?: number
}

function Topbar({ onSearchOpen, notificationCount = 0 }: TopbarProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")
  const [status, setStatus] = React.useState<"online" | "away" | "busy">("online")

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all w-64"
        >
          <Search className="h-4 w-4" />
          <span>Search anything...</span>
          <kbd className="ml-auto text-[10px] text-white/20 border border-white/10 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "online" && "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
              status === "away" && "bg-amber-500",
              status === "busy" && "bg-red-500"
            )}
          />
          <span className="text-white/40 capitalize">{status}</span>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-[#00d4ff] text-[10px] font-bold text-black flex items-center justify-center px-1">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none">
              <Avatar
                fallback="TS"
                online
                size="sm"
                glow
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-white font-medium">Tony Stark</span>
                <span className="text-xs text-white/40 font-normal">tony@stark.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-400 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { Topbar }
