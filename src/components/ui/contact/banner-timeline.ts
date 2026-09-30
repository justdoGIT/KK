// Time-based landing beat for the contact banner, in seconds from the moment
// the banner scrolls into view: it pops up from below, the astronaut drops
// onto its top face, and the banner sags under the impact before rising back
// slowly. Shared by the DOM driver (banner transform) and the lounge canvas
// (astronaut fall) so the dip starts on the exact frame he lands.

export const BANNER_POP = 0.7;
/** Distance the banner rises from, in px. */
export const BANNER_POP_FROM = 110;
export const FALL_START = 0.45;
export const LAND_AT = 1.05;
/** Sag depth on impact, in px. */
export const DIP_DEPTH = 34;
export const DIP_DOWN = 0.2;
export const DIP_RISE = 1.8;
export const BANNER_SETTLED = LAND_AT + DIP_DOWN + DIP_RISE;

export type BannerState = {
  /** Vertical offset of the banner in px (positive = down). */
  offset: number;
  scale: number;
  opacity: number;
  /** Astronaut drop progress: 0 = not yet falling, 1 = resting on the banner. */
  fall: number;
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function backOut(x: number): number {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

/** Banner sag after the landing: fast drop, slow ease back up. */
export function dipAt(sinceLanding: number): number {
  if (sinceLanding <= 0) return 0;
  if (sinceLanding < DIP_DOWN) return DIP_DEPTH * (1 - (1 - sinceLanding / DIP_DOWN) ** 3);
  const rise = clamp01((sinceLanding - DIP_DOWN) / DIP_RISE);
  return DIP_DEPTH * (0.5 + 0.5 * Math.cos(rise * Math.PI));
}

/** Banner and astronaut state `elapsed` seconds after the banner was revealed. */
export function bannerState(elapsed: number): BannerState {
  const pop = clamp01(elapsed / BANNER_POP);
  const rise = pop > 0 ? backOut(pop) : 0;
  return {
    offset: (1 - rise) * BANNER_POP_FROM + dipAt(elapsed - LAND_AT),
    scale: 0.94 + 0.06 * rise,
    opacity: clamp01(elapsed / 0.3),
    fall: clamp01((elapsed - FALL_START) / (LAND_AT - FALL_START)),
  };
}
