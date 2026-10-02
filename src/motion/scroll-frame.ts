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
export function viewportEntry(el: HTMLElement, start = 0.95, end = 0.45): number {
  const vh = window.innerHeight;
  // Measure the layout edge, not the reveal transform from the last frame.
  const parent = el.offsetParent;
  const top = el.offsetTop + (parent instanceof HTMLElement
    ? parent.getBoundingClientRect().top + parent.clientTop - parent.scrollTop
    : -window.scrollY);
  return clamp01((vh * start - top) / (vh * (start - end)));
}

/** Number of explicit columns in a CSS grid container (1 when not a grid). */
export function gridColumnCount(el: Element): number {
  const cols = getComputedStyle(el).gridTemplateColumns;
  if (!cols || cols === "none") return 1;
  return Math.max(1, cols.trim().split(/\s+/).length);
}

/**
 * Runs `read` (layout and style reads only) in the scheduler's read phase,
 * then `write` (DOM and style writes, discrete state) in the write phase of
 * the same frame. Scroll events can fire several times per frame; coalescing
 * to one read/write pair per frame — on the same scheduler tick as every
 * other driver, right after Lenis advances in `scroll` — keeps scroll-linked
 * transforms from strobing, guarantees both callbacks see the same scroll
 * position, and never lets one driver's writes force another's layout.
 */
export function useScrollFrame(read: () => void, write: () => void, enabled = true): void {
  const readRef = useRef(read);
  const writeRef = useRef(write);
  useEffect(() => {
    readRef.current = read;
    writeRef.current = write;
  });

  useEffect(() => {
    if (!enabled) return;
    let pending = true; // run once immediately on mount/enable
    let armed = false; // the read phase produced a frame for the write phase
    const schedule = () => {
      pending = true;
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const stopRead = onFrame("read", () => {
      if (!pending) return;
      pending = false;
      readRef.current();
      armed = true;
    });
    const stopWrite = onFrame("write", () => {
      if (!armed) return;
      armed = false;
      writeRef.current();
    });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      stopRead();
      stopWrite();
    };
  }, [enabled]);
}
