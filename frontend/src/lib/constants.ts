export const APP_NAME = "JARVIS X";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "Next-generation AI assistant interface";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  chat: "/chat",
  chatWithId: (id: string) => `/chat/${id}`,
  memories: "/memories",
  plugins: "/plugins",
  automations: "/automations",
  knowledge: "/knowledge",
  analytics: "/analytics",
  settings: "/settings",
  settingsSection: (section: string) => `/settings/${section}`,
  voice: "/voice",
  vision: "/vision",
  profile: "/profile",
  notFound: "/404",
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const STORAGE_KEYS = {
  auth: "jarvis-auth",
  settings: "jarvis-settings",
  theme: "jarvis-theme",
  onboarding: "jarvis-onboarding",
  session: "jarvis-session",
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: "auth/login",
    register: "auth/register",
    logout: "auth/logout",
    refresh: "auth/refresh",
    me: "auth/me",
  },
  conversations: {
    list: "conversations",
    get: (id: string) => `conversations/${id}`,
    create: "conversations",
    update: (id: string) => `conversations/${id}`,
    delete: (id: string) => `conversations/${id}`,
  },
  messages: {
    list: (id: string) => `conversations/${id}/messages`,
    send: (id: string) => `conversations/${id}/messages`,
    stream: (id: string) => `conversations/${id}/messages/stream`,
    delete: (convId: string, msgId: string) =>
      `conversations/${convId}/messages/${msgId}`,
  },
  memories: {
    list: "memories",
    create: "memories",
    delete: (id: string) => `memories/${id}`,
    search: "memories/search",
  },
  plugins: {
    list: "plugins",
    get: (id: string) => `plugins/${id}`,
    install: (id: string) => `plugins/${id}/install`,
    uninstall: (id: string) => `plugins/${id}/uninstall`,
    toggle: (id: string) => `plugins/${id}/toggle`,
  },
  automations: {
    list: "automations",
    create: "automations",
    update: (id: string) => `automations/${id}`,
    delete: (id: string) => `automations/${id}`,
    execute: (id: string) => `automations/${id}/execute`,
  },
  knowledge: {
    list: "knowledge",
    get: (id: string) => `knowledge/${id}`,
    create: "knowledge",
    update: (id: string) => `knowledge/${id}`,
    delete: (id: string) => `knowledge/${id}`,
    search: "knowledge/search",
  },
  notifications: {
    list: "notifications",
    markRead: (id: string) => `notifications/${id}/read`,
    markAllRead: "notifications/read-all",
    delete: (id: string) => `notifications/${id}`,
  },
  analytics: {
    get: "analytics",
    daily: "analytics/daily",
  },
  voice: {
    transcribe: "voice/transcribe",
    synthesize: "voice/synthesize",
  },
  vision: {
    analyze: "vision/analyze",
    ocr: "vision/ocr",
  },
} as const;

export const TOAST_DURATION = 4000;
export const DEBOUNCE_DELAY = 300;
export const SEARCH_DEBOUNCE = 500;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
export const MAX_MESSAGE_LENGTH = 32000;
export const MAX_CONVERSATION_TITLE_LENGTH = 100;
export const DEFAULT_PAGE_SIZE = 20;
export const INFINITE_SCROLL_THRESHOLD = 200;

export const CHAT_MODES = {
  fast: {
    label: "Fast",
    description: "Quick responses for simple queries",
    icon: "Zap",
    model: "gpt-4o-mini",
  },
  deep: {
    label: "Deep",
    description: "In-depth analysis with reasoning",
    icon: "Brain",
    model: "gpt-4o",
  },
} as const;

export const ERROR_MESSAGES = {
  network: "Network error. Please check your connection.",
  unauthorized: "Session expired. Please log in again.",
  forbidden: "You don't have permission to perform this action.",
  notFound: "The requested resource was not found.",
  serverError: "Server error. Please try again later.",
  rateLimit: "Too many requests. Please wait a moment.",
  validation: "Please check your input and try again.",
} as const;
