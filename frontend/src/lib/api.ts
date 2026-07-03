import ky from "ky";
import type { KyInstance } from "ky";
import type {
  ApiResponse,
  User,
  Conversation,
  Message,
  Memory,
  Plugin,
  Automation,
  Knowledge,
  Notification,
  Analytics,
  PaginatedResponse,
} from "@/types";

interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefresh: (token: string, refreshToken: string) => void;
  onLogout: () => void;
}

let apiClientInstance: KyInstance | null = null;
let apiConfig: ApiClientConfig | null = null;

export function createApiClient(config: ApiClientConfig): KyInstance {
  apiConfig = config;

  apiClientInstance = ky.create({
    prefixUrl: config.baseUrl,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
    hooks: {
      beforeRequest: [
        (request) => {
          const token = config.getToken();
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        },
      ],
      afterResponse: [
        async (request, _options, response) => {
          if (response.status === 401 && !request.url.includes("/auth/")) {
            const refreshToken = config.getRefreshToken();
            if (!refreshToken) {
              config.onLogout();
              return response;
            }

            try {
              const refreshResponse = await ky
                .post(`${config.baseUrl}/auth/refresh`, {
                  json: { refreshToken },
                  timeout: 10000,
                })
                .json<{ accessToken: string; refreshToken: string }>();

              config.onTokenRefresh(
                refreshResponse.accessToken,
                refreshResponse.refreshToken
              );

              const newToken = config.getToken();
              if (newToken) {
                request.headers.set("Authorization", `Bearer ${newToken}`);
              }
              return apiClientInstance!(request);
            } catch {
              config.onLogout();
            }
          }
          return response;
        },
      ],
    },
    retry: {
      limit: 2,
      methods: ["get", "put", "patch", "delete"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
  });

  return apiClientInstance;
}

export function getApiClient(): KyInstance {
  if (!apiClientInstance) {
    throw new Error("API client not initialized. Call createApiClient first.");
  }
  return apiClientInstance;
}

async function request<T>(
  path: string,
  options?: Record<string, unknown>
): Promise<T> {
  const client = getApiClient();
  const response = await client(path, options);
  const data = await response.json<ApiResponse<T>>();
  if (!data.success) {
    throw new Error(data.error ?? "API request failed");
  }
  return data.data as T;
}

async function requestPaginated<T>(
  path: string,
  options?: Record<string, unknown>
): Promise<PaginatedResponse<T>> {
  const client = getApiClient();
  const response = await client(path, options);
  return response.json<PaginatedResponse<T>>();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User; accessToken: string; refreshToken: string }>(
        "auth/login",
        { method: "POST", json: { email, password } }
      ),
    register: (data: {
      email: string;
      password: string;
      name: string;
    }) =>
      request<{ user: User; accessToken: string; refreshToken: string }>(
        "auth/register",
        { method: "POST", json: data }
      ),
    logout: () => request<void>("auth/logout", { method: "POST" }),
    me: () => request<User>("auth/me"),
    updateProfile: (data: Partial<User>) =>
      request<User>("auth/me", { method: "PATCH", json: data }),
  },

  conversations: {
    list: (params?: Record<string, unknown>) =>
      requestPaginated<Conversation>("conversations", {
        searchParams: params as Record<string, string>,
      }),
    get: (id: string) => request<Conversation>(`conversations/${id}`),
    create: (data: { title: string; mode?: string }) =>
      request<Conversation>("conversations", {
        method: "POST",
        json: data,
      }),
    delete: (id: string) =>
      request<void>(`conversations/${id}`, { method: "DELETE" }),
    update: (id: string, data: Partial<Conversation>) =>
      request<Conversation>(`conversations/${id}`, {
        method: "PATCH",
        json: data,
      }),
  },

  messages: {
    list: (conversationId: string, params?: Record<string, unknown>) =>
      requestPaginated<Message>(`conversations/${conversationId}/messages`, {
        searchParams: params as Record<string, string>,
      }),
    send: (
      conversationId: string,
      data: { content: string; mode?: string }
    ) =>
      request<Message>(`conversations/${conversationId}/messages`, {
        method: "POST",
        json: data,
      }),
    delete: (conversationId: string, messageId: string) =>
      request<void>(`conversations/${conversationId}/messages/${messageId}`, {
        method: "DELETE",
      }),
  },

  memories: {
    list: (params?: Record<string, unknown>) =>
      requestPaginated<Memory>("memories", {
        searchParams: params as Record<string, string>,
      }),
    create: (data: { content: string; tags?: string[] }) =>
      request<Memory>("memories", { method: "POST", json: data }),
    delete: (id: string) => request<void>(`memories/${id}`, { method: "DELETE" }),
    search: (query: string) =>
      request<Memory[]>("memories/search", {
        searchParams: { q: query },
      }),
  },

  plugins: {
    list: () => request<Plugin[]>("plugins"),
    get: (id: string) => request<Plugin>(`plugins/${id}`),
    install: (id: string) =>
      request<Plugin>(`plugins/${id}/install`, { method: "POST" }),
    uninstall: (id: string) =>
      request<Plugin>(`plugins/${id}/uninstall`, { method: "POST" }),
    toggle: (id: string, enabled: boolean) =>
      request<Plugin>(`plugins/${id}/toggle`, {
        method: "PATCH",
        json: { enabled },
      }),
  },

  automations: {
    list: () => request<Automation[]>("automations"),
    create: (data: Partial<Automation>) =>
      request<Automation>("automations", { method: "POST", json: data }),
    update: (id: string, data: Partial<Automation>) =>
      request<Automation>(`automations/${id}`, {
        method: "PATCH",
        json: data,
      }),
    delete: (id: string) =>
      request<void>(`automations/${id}`, { method: "DELETE" }),
    execute: (id: string) =>
      request<void>(`automations/${id}/execute`, { method: "POST" }),
  },

  knowledge: {
    list: (params?: Record<string, unknown>) =>
      requestPaginated<Knowledge>("knowledge", {
        searchParams: params as Record<string, string>,
      }),
    get: (id: string) => request<Knowledge>(`knowledge/${id}`),
    create: (data: { title: string; content: string; tags?: string[] }) =>
      request<Knowledge>("knowledge", { method: "POST", json: data }),
    update: (id: string, data: Partial<Knowledge>) =>
      request<Knowledge>(`knowledge/${id}`, { method: "PATCH", json: data }),
    delete: (id: string) =>
      request<void>(`knowledge/${id}`, { method: "DELETE" }),
    search: (query: string) =>
      request<Knowledge[]>("knowledge/search", {
        searchParams: { q: query },
      }),
  },

  notifications: {
    list: () => request<Notification[]>("notifications"),
    markRead: (id: string) =>
      request<void>(`notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request<void>("notifications/read-all", { method: "PATCH" }),
    delete: (id: string) =>
      request<void>(`notifications/${id}`, { method: "DELETE" }),
  },

  analytics: {
    get: (params?: Record<string, unknown>) =>
      request<Analytics>("analytics", {
        searchParams: params as Record<string, string>,
      }),
    daily: (days?: number) =>
      request<Analytics[]>(`analytics/daily`, {
        searchParams: days ? { days: String(days) } : undefined,
      }),
  },

  voice: {
    transcribe: (audio: Blob) =>
      request<{ text: string; confidence: number }>("voice/transcribe", {
        method: "POST",
        body: audio,
        headers: { "Content-Type": "audio/webm" },
      }),
    synthesize: (data: { text: string; voice?: string }) =>
      request<{ audio: string }>("voice/synthesize", {
        method: "POST",
        json: data,
      }),
  },

  vision: {
    analyze: (image: Blob) =>
      request<{ description: string; objects: string[] }>("vision/analyze", {
        method: "POST",
        body: image,
        headers: { "Content-Type": "image/jpeg" },
      }),
    ocr: (image: Blob) =>
      request<{ text: string; confidence: number }>("vision/ocr", {
        method: "POST",
        body: image,
        headers: { "Content-Type": "image/jpeg" },
      }),
  },
};

export type ApiClient = typeof api;
