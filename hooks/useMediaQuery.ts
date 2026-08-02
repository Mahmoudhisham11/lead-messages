import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function useIsMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

export function useIsDesktop(breakpoint: number = 768): boolean {
  return useMediaQuery(`(min-width: ${breakpoint}px)`);
}
