import type { LineSegments } from "three";
import { mulberry } from "../transform/morph-plan.ts";

export const SPEED_LINES = 70;
const SPAN = 18;

/** Per-line seeds: x, y, phase. */
export function createSpeedLineSeeds(): Float32Array {
  const rand = mulberry(97);
  const seeds = new Float32Array(SPEED_LINES * 3);
  for (let i = 0; i < SPEED_LINES; i += 1) {
    const side = rand() < 0.5 ? -1 : 1;
    seeds[i * 3] = side * (0.9 + rand() * 3);
    seeds[i * 3 + 1] = 0.15 + rand() * 2.8;
    seeds[i * 3 + 2] = rand();
  }
  return seeds;
}

/**
 * Streaks scroll toward +Z relative to the runner at `hz`; the pattern is tied
 * to the runner's position so scrubbing is deterministic. `strength` fades them.
 */
export function updateSpeedLines(lines: LineSegments | null, hz: number, strength: number): void {
  if (!lines) return;
  lines.visible = strength > 0.01;
  if (!lines.visible) return;
  const seeds = lines.geometry.userData.seeds as Float32Array;
  const position = lines.geometry.getAttribute("position");
  for (let i = 0; i < SPEED_LINES; i += 1) {
    const phase = (((seeds[i * 3 + 2] + hz * 0.35) % 1) + 1) % 1;
    const z = hz - 6 + phase * SPAN;
    const length = 0.6 + 1.8 * strength;
    position.setXYZ(i * 2, seeds[i * 3], seeds[i * 3 + 1], z);
    position.setXYZ(i * 2 + 1, seeds[i * 3], seeds[i * 3 + 1], z - length);
  }
  position.needsUpdate = true;
}
