import { Toaster as SonnerToaster } from "sonner"

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(24px)",
          color: "rgba(255, 255, 255, 0.9)",
          borderRadius: "12px",
        },
        className: "my-toast",
      }}
      icons={{
        success: <span className="text-emerald-400">✓</span>,
        error: <span className="text-red-400">✕</span>,
        loading: <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#00d4ff] border-t-transparent" />,
      }}
      theme="dark"
    />
  )
}

export { Toaster }
export { toast } from "sonner"
