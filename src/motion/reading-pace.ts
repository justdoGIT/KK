/** Technical copy needs time to understand, as well as time to scan. */
export const READING_WORDS_PER_MINUTE = 150;

export function readingSeconds(text: string): number {
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(8, 4 + words * 60 / READING_WORDS_PER_MINUTE);
}

export function easeTour(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Overlapping reading windows: hold text still, then move to the next part. */
export function readingWindows(seconds: number, distance: number, viewport: number) {
  const turns = Math.ceil(Math.max(0, distance) / Math.max(80, viewport * 0.7));
  const dwell = seconds / (turns + 1);
  const transition = 1.4;
  return {
    duration: seconds + turns * transition,
    position(elapsed: number, reduced = false): number {
      if (!turns) return 0;
      const segment = Math.min(turns, Math.floor(elapsed / (dwell + transition)));
      const local = elapsed - segment * (dwell + transition);
      const move = segment < turns ? Math.max(0, (local - dwell) / transition) : 0;
      return Math.min(1, (segment + (reduced ? (move >= 1 ? 1 : 0) : easeTour(move))) / turns);
    },
  };
}
