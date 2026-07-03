import { cn } from "@/lib/utils"

interface ScanLineProps {
  className?: string
  opacity?: number
}

function ScanLine({ className, opacity = 0.03 }: ScanLineProps) {
  return (
    <div
      className={cn("fixed inset-0 pointer-events-none z-[60]", className)}
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.15) 2px, rgba(0, 212, 255, 0.15) 4px)",
          backgroundSize: "100% 4px",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px bg-[#00d4ff]/20"
        style={{
          animation: "scanline 8s linear infinite",
        }}
      />
      <style>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export { ScanLine }
