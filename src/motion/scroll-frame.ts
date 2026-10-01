import { useEffect, useRef } from "react";
import { onFrame } from "./frame.ts";

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
 * Runs `apply` once per scheduler frame while the page scrolls or resizes.
 * Scroll events can fire several times per frame; coalescing to one `write`-
 * phase call per frame — on the same scheduler tick as every other driver,
 * right after Lenis advances in `scroll` — keeps scroll-linked transforms
 * from strobing and guarantees `apply` reads the same scroll position every
 * other layer painted from this frame, instead of the extra frame of lag a
 * privately-scheduled `requestAnimationFrame` added.
 */
export function useScrollFrame(apply: () => void, enabled = true): void {
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    if (!enabled) return;
    let pending = true; // run once immediately on mount/enable
    const schedule = () => {
      pending = true;
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const stop = onFrame("write", () => {
      if (!pending) return;
      pending = false;
      applyRef.current();
    });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      stop();
    };
  }, [enabled]);
}
