/**
 * Scroll choreography for the career robot journey. Stages run oldest career
 * entry first; each stage opens with a morph window (0..TRANSFORM_END of its
 * local progress) where the previous robot rebuilds itself into the next one.
 */

export type CareerStageMeta = {
  /** Matches `CareerEntry.id` in src/content/career.ts. */
  entryId: string;
  codename: string;
  robot: string;
  caption: string;
  weight: number;
};

export const CAREER_STAGE_META: readonly CareerStageMeta[] = [
  {
    entryId: "ifm-engineering",
    codename: "GEN 01 // WALL FOLLOWER",
    robot: "TurtleBot3 + 45° ToF depth camera",
    caption: "Right-hand wall following out of a maze from corrected depth pixels",
    weight: 1.5,
  },
  {
    entryId: "capgemini",
    codename: "GEN 02 // ROVER",
    robot: "Clearpath Husky + 360° LiDAR",
    caption: "Obstacle and pit avoidance on an unstructured course",
    weight: 1.1,
  },
  {
    entryId: "dozee",
    codename: "GEN 03 // EDGE AI QUADRUPED",
    robot: "Unitree Go2, 12 actuated joints",
    caption: "Rubble, stairs and gaps a wheeled rover cannot cross",
    weight: 1.2,
  },
  {
    entryId: "vestel",
    codename: "GEN 04 // HUMANOID",
    robot: "Bipedal humanoid, full-body kinematics",
    caption: "Stand, scan, and walk: the systems mesh becomes a humanoid",
    weight: 0.9,
  },
  {
    entryId: "symx-ai",
    codename: "GEN 05 // TRANSFORMER",
    robot: "Humanoid ⇄ supercar",
    caption: "Sprint toward you, fold, and transform into a supercar",
    weight: 1.8,
  },
];

export const CAREER_STAGE_COUNT = CAREER_STAGE_META.length;

/** Local progress where the morph from the previous robot completes. */
export const TRANSFORM_END = 0.2;

/** Height of the pinned section in viewport heights. */
export const CAREER_VIEWPORTS = 12;

const TOTAL_WEIGHT = CAREER_STAGE_META.reduce((sum, stage) => sum + stage.weight, 0);

/** Global progress at which each stage starts, plus a trailing 1. */
export const STAGE_STARTS: readonly number[] = CAREER_STAGE_META.reduce<number[]>(
  (starts, stage) => [...starts, starts[starts.length - 1] + stage.weight / TOTAL_WEIGHT],
  [0],
);

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Maps global progress to the active stage and its local progress. */
export function careerStageAt(t: number): { stage: number; local: number } {
  const clamped = clamp01(t);
  for (let stage = CAREER_STAGE_COUNT - 1; stage >= 0; stage -= 1) {
    const from = STAGE_STARTS[stage];
    if (clamped >= from) {
      const to = STAGE_STARTS[stage + 1];
      return { stage, local: clamp01((clamped - from) / (to - from)) };
    }
  }
  return { stage: 0, local: 0 };
}

/** Morph progress 0..1 inside the transform window. */
export function morphProgress(local: number): number {
  return clamp01(local / TRANSFORM_END);
}

/** Act progress 0..1 after the transform window. */
export function actProgress(local: number): number {
  return clamp01((local - TRANSFORM_END) / (1 - TRANSFORM_END));
}
