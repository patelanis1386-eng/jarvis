"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface StreamOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  onToken?: (token: string) => void;
  onReasoning?: (reasoning: string) => void;
  onSources?: (sources: unknown[]) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

interface StreamState {
  data: string;
  error: Error | null;
  isLoading: boolean;
  isStreaming: boolean;
}

interface StreamActions {
  start: (url: string, options?: StreamOptions) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

type UseStreamReturn = StreamState & StreamActions;

export function useStream(): UseStreamReturn {
  const [data, setData] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    readerRef.current?.cancel();
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setData("");
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const start = useCallback(
    async (url: string, options?: StreamOptions) => {
      stop();
      setData("");
      setError(null);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const combinedSignal = options?.signal
        ? combineAbortSignals(controller.signal, options.signal)
        : controller.signal;

      try {
        const response = await fetch(url, {
          method: options?.method ?? "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...options?.headers,
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: combinedSignal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        setIsLoading(false);
        setIsStreaming(true);

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed.startsWith("data: ")) {
              const payload = trimmed.slice(6).trim();
              if (payload === "[DONE]") {
                options?.onDone?.();
                continue;
              }
              try {
                const parsed = JSON.parse(payload);
                if (parsed.type === "token" && typeof parsed.content === "string") {
                  setData((prev) => prev + parsed.content);
                  options?.onToken?.(parsed.content);
                } else if (parsed.type === "reasoning") {
                  options?.onReasoning?.(parsed.content ?? "");
                } else if (parsed.type === "sources") {
                  options?.onSources?.(parsed.sources ?? []);
                } else if (parsed.type === "error") {
                  throw new Error(parsed.content ?? "Stream error");
                } else if (parsed.type === "done") {
                  options?.onDone?.();
                }
              } catch (parseError) {
                if (parseError instanceof Error) {
                  throw parseError;
                }
              }
            }
          }
        }

        options?.onDone?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        readerRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [stop]
  );

  return { data, error, isLoading, isStreaming, start, stop, reset };
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}
