"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type WebSocketState = "connecting" | "open" | "closing" | "closed" | "reconnecting";

interface WebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  heartbeatInterval?: number;
}

interface WebSocketActions {
  connect: (url: string) => void;
  disconnect: (code?: number, reason?: string) => void;
  send: (data: unknown) => void;
  reconnect: () => void;
  state: WebSocketState;
  isConnected: boolean;
}

export function useWebSocket(options: WebSocketOptions = {}): WebSocketActions {
  const [state, setState] = useState<WebSocketState>("closed");

  const wsRef = useRef<WebSocket | null>(null);
  const urlRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 10,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    heartbeatInterval = 30000,
  } = options;

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(
    (ws: WebSocket) => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, heartbeatInterval);
    },
    [heartbeatInterval]
  );

  const disconnect = useCallback(
    (code = 1000, reason?: string) => {
      clearTimers();
      reconnectAttemptRef.current = 0;

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;

        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          wsRef.current.close(code, reason);
        }
        wsRef.current = null;
      }

      setState("closed");
    },
    [clearTimers]
  );

  const connect = useCallback(
    (url: string) => {
      urlRef.current = url;
      disconnect();

      setState("connecting");

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setState("open");
          reconnectAttemptRef.current = 0;
          startHeartbeat(ws);
          onOpen?.();
        };

        ws.onclose = (event) => {
          clearTimers();
          onClose?.(event.code, event.reason);

          if (event.code !== 1000 && event.code !== 1001) {
            if (reconnectAttemptRef.current < reconnectAttempts) {
              setState("reconnecting");
              const delay = Math.min(
                reconnectInterval * Math.pow(2, reconnectAttemptRef.current),
                maxReconnectInterval
              );
              reconnectAttemptRef.current++;
              reconnectTimerRef.current = setTimeout(() => {
                if (urlRef.current) {
                  connect(urlRef.current);
                }
              }, delay);
            } else {
              setState("closed");
            }
          } else {
            setState("closed");
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "pong") return;
            onMessage?.(data);
          } catch {
            onMessage?.(event.data);
          }
        };

        ws.onerror = (event) => {
          onError?.(event);
        };
      } catch (err) {
        setState("closed");
        console.error("WebSocket connection error:", err);
      }
    },
    [
      disconnect,
      onOpen,
      onClose,
      onMessage,
      onError,
      reconnectAttempts,
      reconnectInterval,
      maxReconnectInterval,
      startHeartbeat,
      clearTimers,
    ]
  );

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof data === "string" ? data : JSON.stringify(data)
      );
    }
  }, []);

  const reconnect = useCallback(() => {
    if (urlRef.current) {
      reconnectAttemptRef.current = 0;
      connect(urlRef.current);
    }
  }, [connect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    reconnect,
    state,
    isConnected: state === "open",
  };
}
