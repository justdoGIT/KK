import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Live `matchMedia` result; re-renders when the query flips. */
export function useMediaQuery(query: string): boolean {
  const list = useMemo(() => window.matchMedia(query), [query]);
  const subscribe = useCallback((update: () => void) => {
    let resizeFrame: number | null = null;
    const resize = () => {
      update();
      // Recheck after viewport styles reconcile, even when the retained
      // media-query list has not delivered its change notification yet.
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        update();
      });
    };
    list.addEventListener("change", update);
    window.addEventListener("resize", resize);
    return () => {
      list.removeEventListener("change", update);
      window.removeEventListener("resize", resize);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    };
  }, [list]);
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  // Breakpoint changes must commit before ongoing scroll renders can use an
  // obsolete viewport layout, including when switching to the static deck.
  return useSyncExternalStore(subscribe, snapshot);
}
