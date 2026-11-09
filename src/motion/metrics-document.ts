import { clamp01 } from "./scroll-frame.ts";

/** A short closed/open hold brackets the reversible downward unroll. */
export function documentTimeline(progress: number, paperHeight: number, availableHeight: number) {
  const t = clamp01((progress - 0.04) / 0.8);
  const opening = t * t * (3 - 2 * t);
  const edge = paperHeight * opening;
  // A paper roll's radius shrinks with the amount of paper left on it.
  const rollHeight = 8 + 48 * Math.sqrt(1 - opening);
  return {
    opening,
    cut: paperHeight - edge,
    rollTop: edge - rollHeight / 2,
    rollHeight,
    // Short phones can read the foot of a long document as it unrolls.
    shift: Math.max(0, edge + rollHeight / 2 - availableHeight),
  };
}
