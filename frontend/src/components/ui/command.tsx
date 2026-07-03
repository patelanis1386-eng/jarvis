import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Command as CommandIcon } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
  category?: string
}

const defaultItems: CommandItem[] = [
  { id: "1", label: "Dashboard", shortcut: "⌘1", onSelect: () => {} },
  { id: "2", label: "Chat", shortcut: "⌘2", onSelect: () => {} },
  { id: "3", label: "Voice", shortcut: "⌘3", onSelect: () => {} },
  { id: "4", label: "Settings", shortcut: "⌘,", onSelect: () => {} },
]

function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filtered = defaultItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  React.useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].onSelect()
      onClose()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%]"
          >
            <div className="rounded-xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <Search className="h-4 w-4 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
                  <CommandIcon className="h-3 w-3" />K
                </kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onSelect()
                      onClose()
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      index === selectedIndex
                        ? "bg-[#00d4ff]/10 text-[#00d4ff]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-white/30">{item.shortcut}</kbd>
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/30">No results</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { CommandPalette }
export type { CommandItem, CommandPaletteProps }
