// Scroll-driven choreography for the contact landing zone. The banner is
// already visible when the astronaut enters; progress lands him on its top
// face, reveals the invitation, then selects standing, seated, and reclining
// poses. Time is used only for the impact dip and idle/interaction overrides.

export const LAND_START = 0.04;
export const LAND_AT = 0.22;
export const HEADING_AT = 0.24;
export const SIT_AT = 0.48;
export const LOUNGE_AT = 0.72;
export const IDLE_AFTER = 4;

/** Sag depth on impact, in px. */
export const DIP_DEPTH = 30;
export const DIP_DOWN = 0.2;
export const DIP_RISE = 1.8;
export const BANNER_SETTLED = DIP_DOWN + DIP_RISE;

export type ContactPoseMode = "landing" | "stand" | "sit" | "lounge" | "dance" | "wait";
export type ContactInteraction = "none" | "dance" | "wait";

export type BannerState = {
  /** Vertical offset of the banner in px (positive = down). */
  offset: number;
  /** Astronaut descent: 0 = above the stage, 1 = touching the top face. */
  fall: number;
  /** "Let's innovate together" reveal progress. */
  heading: number;
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
  };
}

/** Pose precedence: landing → CTA interaction → idle → scroll-selected rest. */
export function contactPoseMode(
  progress: number,
  idle: boolean,
  interaction: ContactInteraction,
): ContactPoseMode {
  if (progress < LAND_AT) return "landing";
  if (interaction === "dance") return "dance";
  if (interaction === "wait") return "wait";
  if (idle) return "lounge";
  if (progress < SIT_AT) return "stand";
  if (progress < LOUNGE_AT) return "sit";
  return "lounge";
}
