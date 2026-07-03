import { create } from "zustand";
import type { Conversation, Message, ChatMode } from "@/types";
import { api } from "@/lib/api";
import { generateId } from "@/lib/utils";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

interface ChatActions {
  sendMessage: (content: string, mode?: ChatMode) => Promise<void>;
  createConversation: (title?: string, mode?: ChatMode) => Promise<string>;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearMessages: () => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  streamMessage: (conversationId: string, content: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.conversations.list({ limit: "50" });
      set({ conversations: result.data, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load conversations";
      set({ isLoading: false, error: message });
    }
  },

  loadMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.messages.list(conversationId, { limit: "100" });
      set({ messages: result.data, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load messages";
      set({ isLoading: false, error: message });
    }
  },

  sendMessage: async (content: string, mode: ChatMode = "fast") => {
    let conversationId = get().activeConversationId;
    if (!conversationId) {
      conversationId = await get().createConversation(
        content.slice(0, 50),
        mode
      );
    }

    const tempMessage: Message = {
      id: generateId(),
      conversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempMessage],
      isStreaming: true,
    }));

    try {
      await get().streamMessage(conversationId, content);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      set({ isStreaming: false, error: message });
    }
  },

  streamMessage: async (conversationId: string, content: string) => {
    const token = localStorage.getItem("jarvis-auth")
      ? JSON.parse(localStorage.getItem("jarvis-auth")!).state?.token
      : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) throw new Error("Stream request failed");
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const assistantMessage: Message = {
      id: generateId(),
      conversationId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, assistantMessage],
      isStreaming: true,
    }));

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token" && parsed.content) {
                assistantMessage.content += parsed.content;
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantMessage.content }
                      : m
                  ),
                }));
              } else if (parsed.type === "reasoning" && parsed.content) {
                assistantMessage.reasoning =
                  (assistantMessage.reasoning ?? "") + parsed.content;
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, reasoning: assistantMessage.reasoning }
                      : m
                  ),
                }));
              } else if (parsed.type === "sources") {
                assistantMessage.metadata = {
                  ...assistantMessage.metadata,
                  sources: parsed.sources,
                };
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, metadata: assistantMessage.metadata }
                      : m
                  ),
                }));
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      set({ isStreaming: false });
    }
  },

  createConversation: async (title?: string, mode: ChatMode = "fast") => {
    try {
      const conversation = await api.conversations.create({
        title: title ?? "New Conversation",
        mode,
      });
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
        messages: [],
      }));
      return conversation.id;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create conversation";
      set({ error: message });
      throw error;
    }
  },

  switchConversation: async (id: string) => {
    set({ activeConversationId: id, messages: [], isLoading: true });
    await get().loadMessages(id);
  },

  deleteConversation: async (id: string) => {
    try {
      await api.conversations.delete(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId:
          state.activeConversationId === id
            ? state.conversations[0]?.id ?? null
            : state.activeConversationId,
        messages:
          state.activeConversationId === id ? [] : state.messages,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete conversation";
      set({ error: message });
    }
  },

  clearMessages: () => set({ messages: [] }),

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id });
    if (id) {
      get().loadMessages(id);
    } else {
      set({ messages: [] });
    }
  },

  clearError: () => set({ error: null }),
}));
