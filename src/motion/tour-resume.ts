import type { TourStep } from "./tour-engine.ts";

/** Pick readable content near the visitor, skipping headings already passed.
 * Equal targets (a pinned deck) retain the current card or start at its first. */
export function resumeStepIndex(steps: TourStep[], y: number, chapter?: string, previousId?: string): number {
  if (y < 120) return 0;
  const candidates = steps.map((step, index) => ({ step, index, top: step.target(), bottom: step.end?.() ?? step.target() }))
    .filter(({ step, top }) => (!chapter || step.chapter === chapter) && !(step.id.endsWith("-heading") && top < y - 80));
  const containing = candidates.filter(({ top, bottom }) => top <= y + 80 && bottom >= y - 80);
  if (containing.length) return (containing.find(({ step }) => step.id === previousId) ?? containing[0]).index;
  const next = candidates.find(({ top }) => top >= y - 80);
  if (next) return next.index;
  // All cards may share an already-reached pinned position. Read those cards
  // in place instead of skipping the chapter or rewinding its animation.
  const nearest = Math.max(...candidates.map(({ top }) => top));
  const last = candidates.filter(({ top }) => top === nearest);
  if (last.length) return (last.find(({ step }) => step.id === previousId) ?? last[0]).index;
  const following = steps.findIndex((step) => (step.end?.() ?? step.target()) >= y - 80);
  return following < 0 ? Math.max(0, steps.length - 1) : following;
}
