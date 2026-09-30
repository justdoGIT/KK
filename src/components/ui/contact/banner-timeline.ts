// Scroll-driven choreography for the contact landing zone. The card first
// presents its top face as a stable landing deck, holds a close-up while the
// astronaut waves beside the invitation, then zooms out to the complete CTA.
// Time is used only for the brief impact dip.

export const LAND_START = 0.02;
export const LAND_AT = 0.12;
export const HEADING_AT = 0.14;
/** Close-up holds until here, then eases out to the full card by ZOOM_OUT_END. */
export const ZOOM_OUT_START = 0.28;
export const ZOOM_OUT_END = 0.44;
export const SIT_AT = 0.56;

/** Sag depth on impact, in px. */
export const DIP_DEPTH = 30;
export const DIP_DOWN = 0.2;
export const DIP_RISE = 1.8;
export const BANNER_SETTLED = DIP_DOWN + DIP_RISE;

export type ContactPoseMode = "landing" | "stand" | "sit" | "dance" | "wait";
export type ContactInteraction = "none" | "dance" | "wait";

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

/** Pose precedence: landing → CTA interaction → scroll-selected upright rest. */
export function contactPoseMode(
  progress: number,
  interaction: ContactInteraction,
): ContactPoseMode {
  if (progress < LAND_AT) return "landing";
  if (interaction === "dance") return "dance";
  if (interaction === "wait") return "wait";
  return progress < SIT_AT ? "stand" : "sit";
}
