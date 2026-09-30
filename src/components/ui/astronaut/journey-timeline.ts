// Scroll timeline for the contact astronaut journey. Modelled on Lusion's
// goal-section range table: every phase owns a weighted slice of the pinned
// scroll, visuals read per-phase ratios, and the "window" frame is a rect that
// grows from a small card to the full stage, shrinks into a 16:9 screen, then
export const PHASES = [
  ["cardShow", 0.05],
  ["frameIn", 0.06],
  ["title", 0.12],
  ["blackTunnel", 0.17],
  ["whiteTunnel", 0.06],
  ["frameOut", 0.05],
  ["frameBreak", 0.09],
  ["drop", 0.05],
  ["wait", 0.35],
] as const;

export type PhaseId = (typeof PHASES)[number][0];
type Span = { from: number; to: number };

export const PHASE_SPANS: Record<PhaseId, Span> = (() => {
  const spans = {} as Record<PhaseId, Span>;
  let cursor = 0;
  for (const [id, weight] of PHASES) {
    spans[id] = { from: cursor, to: cursor + weight };
    cursor += weight;
  }
  return spans;
})();

/** Scroll length of the pinned section, in viewport heights. */
export const JOURNEY_VIEWPORTS = 4.5;

/**
 * Wait-phase ratio by which the astronaut has flown up close to the camera:
 * the wave, the root framing, and the finale heading all key off it.
 */
export const ARRIVE_AT = 0.2;

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Ratio of `t` across the span starting at phase `from` and ending at phase `to`. */
export function phaseRatio(t: number, from: PhaseId, to: PhaseId = from): number {
  const start = PHASE_SPANS[from].from;
  const end = PHASE_SPANS[to].to;
  return clamp01((t - start) / (end - start));
}

export function phaseAt(t: number): PhaseId {
  for (const [id] of PHASES) {
    if (t < PHASE_SPANS[id].to) return id;
  }
  return "wait";
}

export function fit(v: number, a: number, b: number, c: number, d: number): number {
  return c + (d - c) * clamp01((v - a) / (b - a));
}

export function smoothstep(a: number, b: number, v: number): number {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeInCubic(x: number): number {
  return x * x * x;
}

/** Penner back-in-out, as used by Lusion for the astronaut drop. */
export function backInOut(x: number): number {
  const c = 1.70158 * 1.525;
  return x < 0.5
    ? ((2 * x) ** 2 * ((c + 1) * 2 * x - c)) / 2
    : ((2 * x - 2) ** 2 * ((c + 1) * (x * 2 - 2) + c) + 2) / 2;
}

export type FrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  rotation: number;
};

export function cardRect(width: number, height: number): FrameRect {
  let w = Math.min(width * 0.46, 860);
  let h = w / 1.43;
  if (h > height * 0.56) {
    h = height * 0.56;
    w = h * 1.43;
  }
  return { x: (width - w) / 2, y: height * 0.56 - h / 2, width: w, height: h, radius: 20, rotation: 0 };
}

export function screenRect(width: number, height: number): FrameRect {
  const w = Math.min(width * 0.76, ((height * 0.78) * 16) / 9);
  const h = (w * 9) / 16;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h, radius: 6, rotation: 0 };
}

function lerpRect(a: FrameRect, b: FrameRect, k: number): FrameRect {
  const mix = (p: number, q: number) => p + (q - p) * k;
  return {
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    width: mix(a.width, b.width),
    height: mix(a.height, b.height),
    radius: mix(a.radius, b.radius),
    rotation: mix(a.rotation, b.rotation),
  };
}

/** The masked "window" into the 3D world at progress `t` on a `width`x`height` stage. */
export function frameRect(t: number, width: number, height: number): FrameRect {
  const card = cardRect(width, height);
  const full: FrameRect = { x: 0, y: 0, width, height, radius: 0, rotation: 0 };
  const screen = screenRect(width, height);

  const frameIn = phaseRatio(t, "frameIn");
  if (frameIn < 1) return lerpRect(card, full, easeInOutCubic(frameIn));

  const white = phaseRatio(t, "whiteTunnel");
  if (white === 0) return full;
  if (white < 1) return lerpRect(full, screen, easeInOutCubic(white));

  const shatter = shatterRatio(t);
  const shake = Math.sin(shatter * Math.PI) * Math.sin(shatter * Math.PI * 9) * 2.2;
  const rise = easeInCubic(phaseRatio(t, "drop")) * (screen.y + screen.height + height * 0.05);
  return { ...screen, y: screen.y - rise, rotation: shake };
}

/** frameBreak ratio at which the flying kick meets the glass. */
export const IMPACT_AT = 0.46;

/** 0..1 through the shatter, starting at the kick's impact. */
export function shatterRatio(t: number): number {
  return clamp01((phaseRatio(t, "frameBreak") - IMPACT_AT) / (1 - IMPACT_AT));
}

/** True once the kick has broken the glass and the astronaut renders unclipped. */
export function heroUnmasked(t: number): boolean {
  return phaseRatio(t, "frameBreak") >= IMPACT_AT;
}
