import { cn } from "@/lib/utils"

interface GlowBorderProps {
  className?: string
  children: React.ReactNode
  color?: string
  animate?: boolean
}

function GlowBorder({
  className,
  children,
  color = "#00d4ff",
  animate = false,
}: GlowBorderProps) {
  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          animate && "animate-pulse"
        )}
        style={{
          background: `linear-gradient(135deg, ${color}40, transparent, ${color}20, transparent)`,
          filter: "blur(4px)",
        }}
      />
      <div
        className={cn(
          "absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          animate && "opacity-100"
        )}
        style={{
          background: `linear-gradient(135deg, ${color}30, transparent 40%, transparent 60%, ${color}20)`,
          animation: animate ? "gradientShift 4s ease-in-out infinite" : undefined,
        }}
      />
      <div className="relative">{children}</div>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}

export { GlowBorder }
