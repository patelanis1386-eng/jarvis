"use client";

import { useState, useEffect, useCallback } from "react";
import { breakpoints } from "@/styles/theme";

type Breakpoint = keyof typeof breakpoints;

const queries = Object.entries(breakpoints).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [key]: `(min-width: ${value}px)`,
  }),
  {} as Record<Breakpoint, string>
);

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(queries[breakpoint]);
}

export function useBreakpoints() {
  const sm = useBreakpoint("sm");
  const md = useBreakpoint("md");
  const lg = useBreakpoint("lg");
  const xl = useBreakpoint("xl");
  const xxl = useBreakpoint("2xl");

  const activeBreakpoint: Breakpoint | null = xxl
    ? "2xl"
    : xl
      ? "xl"
      : lg
        ? "lg"
        : md
          ? "md"
          : sm
            ? "sm"
            : null;

  const isMobile = !sm;
  const isTablet = sm && !lg;
  const isDesktop = lg;

  return { sm, md, lg, xl, xxl, activeBreakpoint, isMobile, isTablet, isDesktop };
}
