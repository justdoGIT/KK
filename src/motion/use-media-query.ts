import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Live `matchMedia` result; re-renders when the query flips. */
export function useMediaQuery(query: string): boolean {
  const list = useMemo(() => window.matchMedia(query), [query]);
  const subscribe = useCallback((update: () => void) => {
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [list]);
  const snapshot = useCallback(() => list.matches, [list]);
  // Breakpoint changes must commit before ongoing scroll renders can use an
  // obsolete viewport layout, including when switching to the static deck.
  return useSyncExternalStore(subscribe, snapshot);
}
