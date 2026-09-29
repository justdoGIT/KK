import { Quaternion, Vector3 } from "three";
import type { BakedModel } from "./bake.ts";

/** Per-part choreography, fixed at creation so the morph is a pure function of progress. */
export type PartPlan = {
  dir: Vector3;
  axis: Vector3;
  spin: number;
  start: number;
  duration: number;
  spread: number;
};

export type MorphPlan = { source: PartPlan[]; target: PartPlan[] };

export const SOURCE_DURATION = 0.34;
export const TARGET_DURATION = 0.3;

export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function plan(model: BakedModel, rand: () => number, window: [number, number], duration: number, top: boolean): PartPlan[] {
  const center = model.bounds.getCenter(new Vector3());
  const size = model.bounds.getSize(new Vector3()).length();
  const height = Math.max(model.bounds.max.y - model.bounds.min.y, 1e-3);
  return model.parts.map((part) => {
    const dir = part.center.clone().sub(center);
    dir.y = Math.abs(dir.y) * 0.4 + 0.25;
    dir.x += (rand() - 0.5) * 0.4;
    dir.z += (rand() - 0.5) * 0.4;
    dir.normalize();
    // Sources peel off from the top down; targets assemble from the ground up.
    const level = (part.center.y - model.bounds.min.y) / height;
    const order = top ? 1 - level : level;
    return {
      dir,
      axis: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      spin: (0.8 + rand() * 2.2) * Math.PI,
      start: window[0] + (window[1] - window[0]) * (order * 0.75 + rand() * 0.25),
      duration,
      spread: size * (0.35 + rand() * 0.45),
    };
  });
}

export function createMorphPlan(from: BakedModel, to: BakedModel, seed: number): MorphPlan {
  const rand = mulberry(seed);
  return {
    source: plan(from, rand, [0.02, 0.2], SOURCE_DURATION, true),
    target: plan(to, rand, [0.36, 0.62], TARGET_DURATION, false),
  };
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeOutBack(x: number): number {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

export function localProgress(p: number, start: number, duration: number): number {
  return Math.min(Math.max((p - start) / duration, 0), 1);
}

const scratchQ = new Quaternion();

/** Rotation for a part at eased amount `e` (0 = rest orientation). */
export function partRotation(out: Quaternion, plan: PartPlan, e: number): Quaternion {
  return out.copy(scratchQ.setFromAxisAngle(plan.axis, plan.spin * e));
}
