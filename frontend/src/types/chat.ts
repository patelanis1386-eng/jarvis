import type { ChatMode, Message } from "./index";

export type { ChatMode };

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface StreamChunk {
  id: string;
  type: "text" | "reasoning" | "tool_call" | "tool_result" | "sources" | "done" | "error";
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationSummary {
  id: string;
  title: string;
  mode: ChatMode;
  messageCount: number;
  lastMessageAt: string;
  lastMessage?: string;
  createdAt: string;
}

export interface ChatState {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface SendMessageOptions {
  conversationId?: string;
  mode?: ChatMode;
  files?: File[];
  image?: File;
  voice?: Blob;
}

export interface ChatError {
  code: string;
  message: string;
  recoverable: boolean;
}
