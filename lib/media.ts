"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** 快捷判断 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
