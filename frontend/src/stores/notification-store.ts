import { create } from "zustand"

export interface Notification {
  id: string
  title: string
  description: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: Date
  link?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: "n1",
      title: "System Update Complete",
      description: "JARVIS X has been updated to v2.1.0 with new features.",
      type: "success",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "n2",
      title: "Memory Optimization",
      description: "Memory optimization completed. 12 redundant entries consolidated.",
      type: "info",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "n3",
      title: "Plugin Installation Failed",
      description: "Failed to install 'Data Visualizer' plugin. Check compatibility.",
      type: "error",
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "n4",
      title: "New Automation Triggered",
      description: "Daily report automation generated successfully.",
      type: "info",
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      id: "n5",
      title: "Voice Command Processed",
      description: "Voice command 'Schedule meeting' was processed successfully.",
      type: "success",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
    },
  ],
  get unreadCount() {
    return this.notifications.filter((n) => !n.read).length
  },

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
    })),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),
}))
