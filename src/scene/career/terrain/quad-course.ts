/**
 * Dozee stage: rubble → staircase → platform → uneven blocks, and a
 * procedural trot for the Unitree Go2 solved with planar two-link IK.
 * Frames: world x forward along the course, y up; URDF leg plane (x, z).
 */

export type Block = { x0: number; x1: number; top: number; kind: "rubble" | "stair" | "platform" | "block" };

function rubble(): Block[] {
  const blocks: Block[] = [];
  let seed = 7;
  for (let x = -2; x < 0; x += 0.2) {
    seed = (seed * 16807) % 2147483647;
    blocks.push({ x0: x, x1: x + 0.2, top: 0.02 + ((seed % 1000) / 1000) * 0.06, kind: "rubble" });
  }
  return blocks;
}

export const QUAD_BLOCKS: readonly Block[] = [
  ...rubble(),
  ...[0, 1, 2, 3, 4].map((i) => ({ x0: 0.6 + i * 0.3, x1: 0.9 + i * 0.3, top: 0.1 * (i + 1), kind: "stair" as const })),
  { x0: 2.1, x1: 3.2, top: 0.5, kind: "platform" },
  ...[0.56, 0.44, 0.6, 0.47, 0.55].map((top, i) => ({ x0: 3.2 + i * 0.36, x1: 3.56 + i * 0.36, top, kind: "block" as const })),
  { x0: 5.0, x1: 8.5, top: 0.5, kind: "platform" },
];

export const QUAD_START = -3.6;
export const QUAD_END = 6.2;
export const STAND_H = 0.3;
const L1 = 0.213;
const L2 = 0.213;
const HIP_X = 0.1934;
const STRIDE = 0.34;
const LIFT = 0.07;

export function terrainHeight(x: number): number {
  for (const block of QUAD_BLOCKS) if (x >= block.x0 && x < block.x1) return block.top;
  return 0;
}

/** Terrain height averaged over a window so the body glides instead of stepping. */
function smoothHeight(x: number): number {
  let sum = 0;
  for (let i = -3; i <= 3; i += 1) sum += terrainHeight(x + i * 0.06);
  return sum / 7;
}

export const LEGS = [
  { name: "FL", hip: HIP_X, phase: 0 },
  { name: "FR", hip: HIP_X, phase: 0.5 },
  { name: "RL", hip: -HIP_X, phase: 0.5 },
  { name: "RR", hip: -HIP_X, phase: 0 },
] as const;

export type QuadPose = {
  x: number;
  y: number;
  pitch: number;
  /** thigh, calf angle per leg in LEGS order. */
  joints: Float32Array;
};

export function createQuadPose(): QuadPose {
  return { x: QUAD_START, y: STAND_H, pitch: 0, joints: new Float32Array(8) };
}

/** Two-link sagittal IK: foot offset (dx, dz) from the thigh joint in the body frame. */
function solveLeg(dx: number, dz: number, out: Float32Array, i: number): void {
  const reach = Math.min(Math.hypot(dx, dz), L1 + L2 - 1e-4);
  const cosKnee = (reach * reach - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const knee = -Math.acos(Math.min(1, Math.max(-1, cosKnee)));
  const aim = Math.atan2(-dx, -dz);
  out[i * 2] = aim - Math.atan2(L2 * Math.sin(knee), L1 + L2 * Math.cos(knee));
  out[i * 2 + 1] = knee;
}

/**
 * Body + joint angles at course position `u` (0..1). `gait` (0..1) blends from
 * a square stance into the full trot so the morph can bake a standing pose.
 */
export function quadPoseAt(u: number, gait: number, out: QuadPose): QuadPose {
  const x = QUAD_START + (QUAD_END - QUAD_START) * u;
  const front = smoothHeight(x + HIP_X);
  const rear = smoothHeight(x - HIP_X);
  out.x = x;
  out.y = (front + rear) / 2 + STAND_H;
  out.pitch = Math.atan2(front - rear, HIP_X * 2);
  const c = Math.cos(out.pitch);
  const s = Math.sin(out.pitch);
  const half = STRIDE / 4;
  LEGS.forEach((leg, i) => {
    const cycle = (x - QUAD_START) / STRIDE + leg.phase;
    const phi = cycle - Math.floor(cycle);
    const hipX = x + leg.hip * c;
    const hipY = out.y + leg.hip * s;
    let rel: number;
    let footY: number;
    if (phi < 0.5) {
      rel = half - (phi / 0.5) * 2 * half;
      footY = terrainHeight(hipX + rel * gait);
    } else {
      const sigma = (phi - 0.5) / 0.5;
      rel = -half + sigma * 2 * half;
      const lift = terrainHeight(hipX - half);
      const land = terrainHeight(hipX + half);
      footY = lift + (land - lift) * sigma + (LIFT + Math.max(0, land - lift)) * Math.sin(Math.PI * sigma);
    }
    const footX = hipX + rel * gait;
    const flatY = terrainHeight(hipX);
    footY = flatY + (footY - flatY) * gait;
    const dx = footX - hipX;
    const dz = footY - hipY;
    solveLeg(dx * c + dz * s, -dx * s + dz * c, out.joints, i);
  });
  return out;
}
