"use client";

import { useEffect, useCallback, useRef } from "react";

type KeyModifier = "ctrl" | "alt" | "shift" | "meta";
type KeyCombo = string | string[];

interface Hotkey {
  keys: KeyCombo;
  handler: (event: KeyboardEvent) => void;
  modifiers?: KeyModifier[];
  enabled?: boolean;
  preventDefault?: boolean;
  description?: string;
}

interface KeyboardHookOptions {
  hotkeys: Hotkey[];
  enabled?: boolean;
  ignoreInputFields?: boolean;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace("control", "ctrl").replace("command", "meta");
}

function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.split("+").map(normalizeKey);
  const key = normalizeKey(event.key);

  const hasCtrl = parts.includes("ctrl");
  const hasAlt = parts.includes("alt");
  const hasShift = parts.includes("shift");
  const hasMeta = parts.includes("meta");

  const mainKey = parts.find(
    (p) => !["ctrl", "alt", "shift", "meta"].includes(p)
  );

  const modifierMatch =
    event.ctrlKey === hasCtrl &&
    event.altKey === hasAlt &&
    event.shiftKey === hasShift &&
    event.metaKey === hasMeta;

  if (!modifierMatch) return false;
  if (mainKey && key !== mainKey) return false;
  if (!mainKey && !hasCtrl && !hasAlt && !hasMeta) return key === combo;

  return true;
}

function isInputField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function useKeyboard(options: KeyboardHookOptions) {
  const { hotkeys, enabled = true, ignoreInputFields = true } = options;
  const hotkeysRef = useRef(hotkeys);
  hotkeysRef.current = hotkeys;

  const handler = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      if (ignoreInputFields && isInputField(event.target)) {
        return;
      }

      for (const hotkey of hotkeysRef.current) {
        if (hotkey.enabled === false) continue;

        const keys = Array.isArray(hotkey.keys)
          ? hotkey.keys
          : [hotkey.keys];

        for (const keyCombo of keys) {
          if (matchesCombo(event, keyCombo)) {
            if (hotkey.preventDefault !== false) {
              event.preventDefault();
              event.stopPropagation();
            }
            hotkey.handler(event);
            return;
          }
        }
      }
    },
    [enabled, ignoreInputFields]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, handler]);
}

export function useHotkey(
  keys: KeyCombo,
  handler: (event: KeyboardEvent) => void,
  options?: {
    modifiers?: KeyModifier[];
    enabled?: boolean;
    preventDefault?: boolean;
  }
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (options?.enabled === false) return;

    const keyHandler = (event: KeyboardEvent) => {
      const combos = Array.isArray(keys) ? keys : [keys];
      for (const combo of combos) {
        if (matchesCombo(event, combo)) {
          if (options?.preventDefault !== false) {
            event.preventDefault();
          }
          handlerRef.current(event);
          return;
        }
      }
    };

    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [keys, options?.enabled, options?.preventDefault]);
}
