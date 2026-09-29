import type { RefObject } from "react";

/** Mutable scroll state written by the DOM driver each frame and read inside useFrame. */
export type CareerClock = {
  /** Global section progress 0..1. */
  t: number;
  /** Active stage index 0..4 (oldest career entry first). */
  stage: number;
  /** Progress inside the active stage 0..1. */
  local: number;
};

export type CareerClockRef = RefObject<CareerClock>;

export function createCareerClock(): CareerClock {
  return { t: 0, stage: 0, local: 0 };
}
