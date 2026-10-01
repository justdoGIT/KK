// Scroll-driven choreography for the contact landing zone.
// The billboard deck holds its fixed size, the astronaut lands standing,
// transitions to sit or lie-down, dances/jumps when the cursor approaches
// the CTA button, and engages in idle behaviors (lying down after 60s,
// wall climbing down/up after 90s, random plank walking and sitting).

export const LAND_START = 0.02;
export const LAND_AT = 0.12;
export const HEADING_AT = 0.14;
/** Close-up holds until here, then eases out to the full card by ZOOM_OUT_END. */
export const ZOOM_OUT_START = 0.28;
export const ZOOM_OUT_END = 0.44;
export const SIT_AT = 0.54;

/** Sag depth on impact, in px. */
export const DIP_DEPTH = 24;
export const DIP_DOWN = 0.2;
export const DIP_RISE = 1.6;
export const BANNER_SETTLED = DIP_DOWN + DIP_RISE;

/** CTA-hover choreography boundaries, in seconds from pointer entry. */
export const HOVER_RECLINE_END = 2.4;
export const HOVER_DANCE_END = 5.6;
export const HOVER_SEQUENCE_END = 8.8;

export type ContactPoseMode =
  | "landing"
  | "stand"
  | "sit"
  | "lie"
  | "dance"
  | "moonwalk"
  | "jumpWave"
  | "walkPlank"
  | "wallClimb"
  | "wait";

export type ContactInteraction = "none" | "dance" | "jumpWave" | "wait";

export type BannerState = {
  /** Vertical offset of the banner in px (positive = down). */
  offset: number;
  /** Astronaut descent: 0 = above the stage, 1 = touching the top face. */
  fall: number;
  /** "Let's innovate together" reveal progress. */
  heading: number;
  /** Close-up amount: 1 = zoomed onto the card's top face, 0 = whole card. */
  closeUp: number;
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(a: number, b: number, value: number): number {
  const x = clamp01((value - a) / (b - a));
  return x * x * (3 - 2 * x);
}

/** Banner sag after the landing: fast drop, slow ease back up. */
export function dipAt(sinceLanding: number): number {
  if (sinceLanding <= 0) return 0;
  if (sinceLanding < DIP_DOWN) return DIP_DEPTH * (1 - (1 - sinceLanding / DIP_DOWN) ** 3);
  const rise = clamp01((sinceLanding - DIP_DOWN) / DIP_RISE);
  return DIP_DEPTH * (0.5 + 0.5 * Math.cos(rise * Math.PI));
}

export function bannerState(progress: number, sinceLanding: number): BannerState {
  return {
    offset: progress >= LAND_AT ? dipAt(sinceLanding) : 0,
    fall: smoothstep(LAND_START, LAND_AT, progress),
    heading: smoothstep(HEADING_AT, HEADING_AT + 0.1, progress),
    closeUp: 1 - smoothstep(ZOOM_OUT_START, ZOOM_OUT_END, progress),
  };
}

/**
 * Pose precedence & autonomous idle behaviors:
 * 1. landing
 * 2. direct CTA hover/focus -> recline, dance, moonwalk loop
 * 3. LinkedIn/GitHub click -> wait
 * 4. Screen idle > 90s -> wall climbing down and up the clear corner
 * 5. Screen idle > 60s -> lie down from standing
 * 6. Periodic cycling (> 12s on screen): plank walk, sit, lie, wave
 * 7. Standard scroll rest: stand -> sit
 */
export function contactPoseMode(
  progress: number,
  interaction: ContactInteraction,
  elapsedTime = 0,
): ContactPoseMode {
  if (progress < LAND_AT) return "landing";
  if (interaction === "dance") {
    const cycle = Math.max(0, elapsedTime) % HOVER_SEQUENCE_END;
    if (cycle < HOVER_RECLINE_END) return "lie";
    if (cycle < HOVER_DANCE_END) return "dance";
    return "moonwalk";
  }
  if (interaction === "jumpWave") return "jumpWave";
  if (interaction === "wait") return "wait";

  if (progress >= SIT_AT) {
    if (elapsedTime >= 90) {
      const cycle = (elapsedTime - 90) % 20;
      if (cycle < 16) return "wallClimb";
    }
    if (elapsedTime >= 60) return "lie";
    if (elapsedTime >= 12) {
      const loop = Math.floor(elapsedTime / 8) % 4;
      if (loop === 1) return "walkPlank";
      if (loop === 2) return "sit";
      if (loop === 3) return "lie";
    }
    return "sit";
  }

  return "stand";
}
