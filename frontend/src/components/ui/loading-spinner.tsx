import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 border-2",
  md: "h-12 w-12 border-3",
  lg: "h-16 w-16 border-4",
}

function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full border-transparent border-t-[#00d4ff] border-r-[#0088ff] animate-spin",
          sizeMap[size]
        )}
      />
      <div
        className={cn(
          "absolute rounded-full border-transparent border-t-[#00d4ff]/30 border-l-[#0088ff]/20 animate-spin",
          sizeMap[size],
          "-rotate-45"
        )}
        style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
      />
    </div>
  )
}

export { LoadingSpinner }
