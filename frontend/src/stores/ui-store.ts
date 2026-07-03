import { create } from "zustand";
import type { ViewType, Notification } from "@/types";

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

interface UIState {
  sidebarOpen: boolean;
  theme: "dark" | "light" | "system";
  activeView: ViewType;
  notifications: Notification[];
  modalState: ModalState;
  commandPaletteOpen: boolean;
  settings: UISettings;
}

interface UISettings {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  messageFontSize: "sm" | "base" | "lg";
  showTimestamps: boolean;
  enterToSend: boolean;
  soundEnabled: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
  setActiveView: (view: ViewType) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateSettings: (settings: Partial<UISettings>) => void;
}

type UIStore = UIState & UIActions;

const defaultSettings: UISettings = {
  sidebarWidth: 280,
  sidebarCollapsed: false,
  messageFontSize: "base",
  showTimestamps: true,
  enterToSend: true,
  soundEnabled: true,
  reduceMotion: false,
  compactMode: false,
};

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  theme: "dark",
  activeView: "chat",
  notifications: [],
  modalState: { isOpen: false, type: null, data: null },
  commandPaletteOpen: false,
  settings: defaultSettings,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setTheme: (theme: "dark" | "light" | "system") => set({ theme }),

  setActiveView: (view: ViewType) => set({ activeView: view }),

  addNotification: (notification: Notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markNotificationRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),

  openModal: (type: string, data?: unknown) =>
    set({ modalState: { isOpen: true, type, data } }),

  closeModal: () =>
    set({ modalState: { isOpen: false, type: null, data: null } }),

  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),

  updateSettings: (settings: Partial<UISettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
}));
