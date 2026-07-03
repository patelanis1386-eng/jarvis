export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "premium";
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  fontSize: "sm" | "base" | "lg";
  language: string;
  voiceEnabled: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sound: boolean;
  desktop: boolean;
  mentions: boolean;
}

export interface PrivacySettings {
  shareUsageData: boolean;
  saveConversations: boolean;
  showOnlineStatus: boolean;
  allowIndexing: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  model: string;
  messages: number;
  tokens: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export type ChatMode = "fast" | "deep";

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string;
  metadata?: MessageMetadata;
  tokens?: number;
  model?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  createdAt: string;
}

export interface MessageMetadata {
  sources?: Source[];
  images?: string[];
  attachments?: Attachment[];
  thinking?: boolean;
  latency?: number;
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: ToolResult;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
}

export interface Memory {
  id: string;
  content: string;
  type: "short_term" | "long_term" | "working";
  tags: string[];
  importance: number;
  timestamp: string;
  accessCount: number;
  lastAccessed: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  enabled: boolean;
  installed: boolean;
  config: Record<string, unknown>;
  permissions: string[];
  category: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
  lastRun?: string;
  createdAt: string;
}

export interface AutomationTrigger {
  type: "schedule" | "event" | "condition" | "webhook";
  config: Record<string, unknown>;
}

export interface AutomationAction {
  type: "api_call" | "send_message" | "run_plugin" | "custom";
  config: Record<string, unknown>;
}

export interface Knowledge {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  source: string;
  embeddings?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  action?: NotificationAction;
  createdAt: string;
}

export interface NotificationAction {
  label: string;
  url?: string;
  onClick?: string;
}

export interface Analytics {
  id: string;
  date: string;
  metrics: AnalyticsMetrics;
  summary: string;
}

export interface AnalyticsMetrics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  activeUsers: number;
  topModels: Record<string, number>;
  usageByHour: Record<string, number>;
  errorRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StreamEvent {
  type: "token" | "done" | "error" | "tool_call" | "tool_result" | "reasoning" | "sources";
  data: unknown;
  id: string;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  id: string;
  timestamp: string;
}

export type ViewType =
  | "chat"
  | "memories"
  | "plugins"
  | "automations"
  | "knowledge"
  | "analytics"
  | "settings"
  | "voice"
  | "vision";

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  view: ViewType;
  shortcut?: string;
  badge?: number;
}
