"use client";

import { useEffect, useRef, type RefObject } from "react";

type EventType = "mousedown" | "mouseup" | "click" | "touchstart";

interface ClickOutsideOptions {
  enabled?: boolean;
  eventType?: EventType;
  ignoreScrollbars?: boolean;
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: ClickOutsideOptions
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const {
    enabled = true,
    eventType = "mousedown",
    ignoreScrollbars = false,
  } = options ?? {};

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;

      if (ignoreScrollbars) {
        const target = event.target as HTMLElement;
        if (
          target.matches?.('*::-webkit-scrollbar, *::-webkit-scrollbar-thumb') ?? false
        ) {
          return;
        }
      }

      const target = event.target as Node;
      if (target && el.contains(target)) return;

      handlerRef.current(event);
    };

    document.addEventListener(eventType, listener, true);
    return () => document.removeEventListener(eventType, listener, true);
  }, [enabled, eventType, ignoreScrollbars]);

  return ref;
}
