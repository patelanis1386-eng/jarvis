"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, AlertTriangle, X, Clock } from "lucide-react"
import { useNotificationStore, type Notification } from "@/stores/notification-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-400" />,
  success: <CheckCircle className="h-4 w-4 text-green-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
}

const typeColors: Record<string, string> = {
  info: "border-l-blue-500",
  success: "border-l-green-500",
  warning: "border-l-yellow-500",
  error: "border-l-red-500",
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-white/50">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "No unread notifications"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg">All caught up!</p>
              <p className="text-sm text-white/30 mt-1">No notifications to display</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification: Notification, i: number) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex items-start gap-4 px-5 py-4 border-l-2 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.read ? "bg-[#00d4ff]/5" : ""
                  } ${typeColors[notification.type] || "border-l-white/10"}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {typeIcons[notification.type] || <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${notification.read ? "text-white/60" : "text-white"}`}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-white/50 mt-0.5">{notification.description}</p>
                    <span className="text-xs text-white/30 flex items-center gap-1 mt-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.timestamp).toLocaleDateString()}{" "}
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {!notification.read && (
                    <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
