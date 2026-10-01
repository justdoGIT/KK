import { useEffect, useRef, type RefObject } from "react";
import {
  clamp01,
  easeOutCubic,
  gridColumnCount,
  useScrollFrame,
  viewportEntry,
} from "./scroll-frame.ts";

// Delay (in local progress units) between neighbouring columns of one row,
// so cards sharing a row still open left-to-right instead of all at once.
const COLUMN_STAGGER = 0.15;

type RevealTransform = (inv: number, index: number) => string;

function settle(el: HTMLElement): void {
  el.style.setProperty("--r", "1");
  el.style.opacity = "";
  el.style.transform = "";
  el.classList.add("is-open");
}

/**
 * Scroll-linked, bidirectional reveal for the cards of a CSS grid. Each card
 * gets `--r` (0..1) for CSS-driven inner staging plus an inline opacity and
 * transform built by `transform(inv, index)`; at rest the inline styles are
 * cleared and `.is-open` is set so hover rules apply untouched. Returns
 * nothing; `onFrame(openedCount, meanProgress)` reports progress.
 */
export function useGridScrollReveal(
  gridRef: RefObject<HTMLElement | null>,
  itemRefs: RefObject<(HTMLElement | null)[]>,
  transform: RevealTransform,
  enabled: boolean,
  onFrame?: (opened: number, mean: number) => void,
  settleAt = 0.5,
): void {
  // Column count only changes on layout shifts (resize, font load), not on
  // every scroll tick — cached here instead of recomputed per card per frame.
  const colsRef = useRef(1);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      colsRef.current = gridColumnCount(grid);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [gridRef]);

  useScrollFrame(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cols = colsRef.current;
    const items = itemRefs.current;
    const span = 1 + (cols - 1) * COLUMN_STAGGER;
    let opened = 0;
    let sum = 0;
    let count = 0;
    items.forEach((el, i) => {
      if (!el) return;
      const local = clamp01(
        viewportEntry(el, 0.95, settleAt) * span - (i % cols) * COLUMN_STAGGER,
      );
      const t = easeOutCubic(local);
      count += 1;
      sum += t;
      if (t >= 0.999) {
        opened += 1;
        settle(el);
        return;
      }
      const inv = 1 - t;
      el.classList.remove("is-open");
      el.style.setProperty("--r", t.toFixed(3));
      el.style.opacity = t.toFixed(3);
      el.style.transform = transform(inv, i);
    });
    onFrame?.(opened, count ? sum / count : 1);
  }, enabled);

  useEffect(() => {
    if (enabled) return;
    itemRefs.current.forEach((el) => el && settle(el));
    onFrame?.(itemRefs.current.length, 1);
    // onFrame identity is irrelevant for the static (reduced-motion) pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, itemRefs]);
}
