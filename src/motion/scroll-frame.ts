import { useEffect, useRef } from "react";

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function easeOutCubic(t: number): number {
  const c = 1 - clamp01(t);
  return 1 - c * c * c;
}

/**
 * Progress (0..1) of an element's top edge travelling from `start` to `end`,
 * both expressed as fractions of the viewport height. Bidirectional: scrolling
 * back up lowers the value again.
 */
export function viewportEntry(el: Element, start = 0.95, end = 0.45): number {
  const vh = window.innerHeight;
  const top = el.getBoundingClientRect().top;
  return clamp01((vh * start - top) / (vh * (start - end)));
}

/** Number of explicit columns in a CSS grid container (1 when not a grid). */
export function gridColumnCount(el: Element): number {
  const cols = getComputedStyle(el).gridTemplateColumns;
  if (!cols || cols === "none") return 1;
  return Math.max(1, cols.trim().split(/\s+/).length);
}

/**
 * Runs `apply` once per animation frame while the page scrolls or resizes.
 * Scroll events can fire several times per frame; coalescing to one style
 * write per frame keeps scroll-linked transforms from strobing.
 */
export function useScrollFrame(apply: () => void, enabled = true): void {
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    if (!enabled) return;
    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        applyRef.current();
      });
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    applyRef.current();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}
