import { useCallback, useSyncExternalStore } from "react";

function subscribe(update: () => void): () => void {
  let frame: number | null = null;
  const schedule = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      update();
    });
  };
  const resize = () => {
    update();
    schedule();
  };
  const viewport = window.visualViewport;
  // Device metrics, window events, and media-query notifications need not
  // arrive together. Layout and visual-viewport events see the reconciled size.
  // Defer layout-triggered commits to avoid resizing the observed root during
  // ResizeObserver delivery and causing a feedback-loop warning.
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  observer?.observe(document.documentElement);
  window.addEventListener("resize", resize);
  viewport?.addEventListener("resize", resize);
  return () => {
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    viewport?.removeEventListener("resize", resize);
    if (frame !== null) cancelAnimationFrame(frame);
  };
}

/** Whether the current layout viewport has room for a fixed-size arrangement. */
export function useViewportFits(minWidth: number, minHeight: number): boolean {
  const snapshot = useCallback(
    () => window.innerWidth >= minWidth && window.innerHeight >= minHeight,
    [minWidth, minHeight],
  );
  return useSyncExternalStore(subscribe, snapshot);
}
