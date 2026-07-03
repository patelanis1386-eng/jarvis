"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/dashboard" : "/login")
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center">
          <span className="text-[#00d4ff] text-2xl font-bold">JX</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
        <p className="text-sm text-white/40">Initializing JARVIS X...</p>
      </div>
    </div>
  )
}
