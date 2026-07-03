import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPreferences } from "@/types";

interface PluginConfig {
  [pluginId: string]: Record<string, unknown>;
}

interface SettingsState {
  theme: "dark" | "light" | "system";
  fontSize: "sm" | "base" | "lg";
  language: string;
  voiceEnabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    desktop: boolean;
    mentions: boolean;
  };
  privacy: {
    shareUsageData: boolean;
    saveConversations: boolean;
    showOnlineStatus: boolean;
    allowIndexing: boolean;
  };
  apiKeys: Record<string, string>;
  pluginConfigs: PluginConfig;
}

interface SettingsActions {
  setTheme: (theme: "dark" | "light" | "system") => void;
  setFontSize: (size: "sm" | "base" | "lg") => void;
  setLanguage: (language: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  updateNotifications: (
    updates: Partial<SettingsState["notifications"]>
  ) => void;
  updatePrivacy: (updates: Partial<SettingsState["privacy"]>) => void;
  setApiKey: (service: string, key: string) => void;
  removeApiKey: (service: string) => void;
  updatePluginConfig: (pluginId: string, config: Record<string, unknown>) => void;
  resetSettings: () => void;
  applyUserPreferences: (preferences: UserPreferences) => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultState: SettingsState = {
  theme: "dark",
  fontSize: "base",
  language: "en",
  voiceEnabled: true,
  notifications: {
    email: true,
    push: true,
    sound: true,
    desktop: true,
    mentions: true,
  },
  privacy: {
    shareUsageData: false,
    saveConversations: true,
    showOnlineStatus: true,
    allowIndexing: false,
  },
  apiKeys: {},
  pluginConfigs: {},
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),

      updateNotifications: (updates) =>
        set((state) => ({
          notifications: { ...state.notifications, ...updates },
        })),

      updatePrivacy: (updates) =>
        set((state) => ({
          privacy: { ...state.privacy, ...updates },
        })),

      setApiKey: (service: string, key: string) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [service]: key },
        })),

      removeApiKey: (service: string) =>
        set((state) => {
          const keys = { ...state.apiKeys };
          delete keys[service];
          return { apiKeys: keys };
        }),

      updatePluginConfig: (pluginId, config) =>
        set((state) => ({
          pluginConfigs: {
            ...state.pluginConfigs,
            [pluginId]: {
              ...(state.pluginConfigs[pluginId] ?? {}),
              ...config,
            },
          },
        })),

      resetSettings: () => set(defaultState),

      applyUserPreferences: (preferences: UserPreferences) =>
        set({
          theme: preferences.theme,
          fontSize: preferences.fontSize,
          language: preferences.language,
          voiceEnabled: preferences.voiceEnabled,
          notifications: preferences.notifications,
          privacy: preferences.privacy,
        }),
    }),
    {
      name: "jarvis-settings",
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        language: state.language,
        voiceEnabled: state.voiceEnabled,
        notifications: state.notifications,
        privacy: state.privacy,
        apiKeys: state.apiKeys,
      }),
    }
  )
);
