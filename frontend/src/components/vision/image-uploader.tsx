"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Upload, Image, FileWarning } from "lucide-react"

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
}

function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validate = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, WebP, or GIF)")
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB")
      return false
    }
    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && validate(file)) {
      onImageSelect(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validate(file)) {
      onImageSelect(file)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
        dragging
          ? "border-[#00d4ff] bg-[#00d4ff]/5 shadow-[0_0_30px_rgba(0,212,255,0.1)]"
          : error
          ? "border-red-500/50 bg-red-500/5"
          : "border-white/20 hover:border-white/40 bg-white/5"
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center py-16 px-8">
        {error ? (
          <FileWarning className="h-12 w-12 text-red-400 mb-4" />
        ) : (
          <motion.div
            animate={dragging ? { y: -5 } : {}}
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#0088ff]/20 border border-[#00d4ff]/30 flex items-center justify-center mb-4"
          >
            {dragging ? (
              <Image className="h-8 w-8 text-[#00d4ff]" />
            ) : (
              <Upload className="h-8 w-8 text-[#00d4ff]" />
            )}
          </motion.div>
        )}
        <p className={cn("text-sm mb-1", error ? "text-red-400" : "text-white/60")}>
          {error || (dragging ? "Drop your image here" : "Drop an image or click to browse")}
        </p>
        <p className="text-xs text-white/30">JPEG, PNG, WebP, GIF • Max 10MB</p>
      </div>
    </motion.div>
  )
}

export { ImageUploader }
