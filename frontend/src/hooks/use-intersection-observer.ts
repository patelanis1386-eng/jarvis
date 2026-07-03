"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

interface IntersectionObserverReturn {
  ref: RefObject<Element | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  ratio: number;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): IntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0px",
    triggerOnce = false,
    enabled = true,
  } = options;

  const ref = useRef<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [ratio, setRatio] = useState(0);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (triggerOnce && hasTriggered.current) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
        setRatio(entry.intersectionRatio);

        if (triggerOnce && entry.isIntersecting) {
          hasTriggered.current = true;
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, triggerOnce, enabled]);

  return { ref, isIntersecting, entry, ratio };
}

interface LazyLoadOptions extends IntersectionObserverOptions {
  placeholder?: boolean;
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    triggerOnce: true,
    ...options,
  });

  return { ref, isLoaded: isIntersecting };
}

interface VirtualScrollOptions {
  itemCount: number;
  overscan?: number;
  enabled?: boolean;
}

export function useVirtualScroll(options: VirtualScrollOptions) {
  const { itemCount, overscan = 5, enabled = true } = options;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight } = container;
      const itemHeight = 40;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        itemCount,
        Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan
      );
      setVisibleRange({ start, end });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [itemCount, overscan, enabled]);

  return { containerRef, visibleRange };
}
