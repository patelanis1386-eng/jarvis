"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Github, Chrome, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
    if (!error) router.push("/dashboard")
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl p-8 shadow-xl shadow-[#00d4ff]/5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-[#00d4ff] text-xl font-bold">JX</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to JARVIS X</h1>
        <p className="text-sm text-white/50 mt-1">Sign in to access your AI command center</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tony@starkindustries.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
          >
            {error}
          </motion.p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-white/20 bg-white/5 text-[#00d4ff] focus:ring-[#00d4ff]" />
            <span className="text-white/50">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-[#00d4ff] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="glow" size="lg" className="w-full" loading={isLoading}>
          {!isLoading && <Lock className="h-4 w-4" />}
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 px-2 text-xs text-white/30">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="md" className="w-full">
          <Github className="h-4 w-4" />
          Github
        </Button>
        <Button variant="outline" size="md" className="w-full">
          <Chrome className="h-4 w-4" />
          Google
        </Button>
      </div>

      <p className="text-center text-sm text-white/40 mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-[#00d4ff] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}
