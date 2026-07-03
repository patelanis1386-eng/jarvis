import type { Metadata } from "next"
import { Providers } from "./providers"
import { ParticleBackground } from "@/components/particles/particle-background"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "JARVIS X - AI Operating System",
  description: "Next-generation AI operating system powered by advanced neural networks",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-inter bg-black text-white antialiased">
        <Providers>
          <ParticleBackground />
          {children}
        </Providers>
      </body>
    </html>
  )
}
