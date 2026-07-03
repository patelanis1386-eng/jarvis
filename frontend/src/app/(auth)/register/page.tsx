"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) return
    await register(formData.name, formData.email, formData.password)
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
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-sm text-white/50 mt-1">Initialize your JARVIS X identity</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Tony Stark"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="h-4 w-4" />}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tony@starkindustries.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-sm text-red-400">Passwords do not match</p>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
          >
            {error}
          </motion.p>
        )}

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 rounded border-white/20 bg-white/5 text-[#00d4ff] focus:ring-[#00d4ff]"
          />
          <span className="text-sm text-white/50">
            I agree to the{" "}
            <Link href="/terms" className="text-[#00d4ff] hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#00d4ff] hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <Button
          type="submit"
          variant="glow"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!acceptedTerms || formData.password !== formData.confirmPassword}
        >
          {!isLoading && <Check className="h-4 w-4" />}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#00d4ff] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
