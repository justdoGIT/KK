import type { ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { IMPACT_AT, phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import { BONES, type AstronautInstance, type BoneName } from "./astronaut-rig.ts";

/**
 * Bone rotations (radians, XYZ Euler) relative to the NASA mesh's T-pose.
 * Conventions for the left side (+X); `mirror` derives the right side:
 * arm z < 0 lowers the arm, arm y < 0 swings it forward; thigh x < 0 lifts
 * the leg forward, shin x > 0 bends the knee; forearm y < 0 bends inward.
 */

type Euler3 = readonly [number, number, number];
type Side = { arm: Euler3; forearm: Euler3; thigh: Euler3; shin: Euler3; hand?: Euler3; foot?: Euler3 };
export type Pose = Record<BoneName, Euler3>;
export type PoseBuffer = Record<BoneName, [number, number, number]>;

const ZERO: Euler3 = [0, 0, 0];

function pose(body: { spine?: Euler3; chest?: Euler3; head?: Euler3 }, left: Side, right: Side = left): Pose {
  const m = (e: Euler3): Euler3 => [e[0], -e[1], -e[2]];
  return {
    hips: ZERO,
    spine: body.spine ?? ZERO,
    chest: body.chest ?? ZERO,
    neck: ZERO,
    head: body.head ?? ZERO,
    armL: left.arm,
    forearmL: left.forearm,
    handL: left.hand ?? ZERO,
    armR: m(right.arm),
    forearmR: m(right.forearm),
    handR: m(right.hand ?? ZERO),
    thighL: left.thigh,
    shinL: left.shin,
    footL: left.foot ?? ZERO,
    thighR: m(right.thigh),
    shinR: right.shin,
    footR: m(right.foot ?? ZERO),
  };
}

const STAND = pose({ chest: [0.04, 0, 0] }, { arm: [0, -0.1, -1.25], forearm: [0, -0.25, 0], thigh: [0, 0, 0.03], shin: [0.05, 0, 0] });
const FLOAT = pose(
  { spine: [0.1, 0, 0], head: [0.1, 0, 0] },
  { arm: [0, 0.1, -0.55], forearm: [0, -0.35, 0.2], thigh: [-0.25, 0, 0.12], shin: [0.45, 0, 0] },
  { arm: [0, 0.1, -0.7], forearm: [0, -0.2, 0.1], thigh: [0.05, 0, 0.08], shin: [0.2, 0, 0] },
);
const FREEFALL = pose(
  { spine: [0.3, 0, 0], head: [-0.2, 0, 0] },
  { arm: [0, 0.35, 0.25], forearm: [0, 0, 0.55], thigh: [0.25, 0, 0.35], shin: [0.95, 0, 0] },
);
const CROUCH = pose(
  { spine: [0.35, 0, 0], chest: [0.15, 0, 0], head: [-0.2, 0, 0] },
  { arm: [0, 0.75, -1.05], forearm: [0, -0.3, 0], thigh: [-1.15, 0, 0.08], shin: [1.95, 0, 0] },
);
const KICK = pose(
  { spine: [-0.3, 0, 0], chest: [-0.1, 0, 0], head: [0.15, 0, 0] },
  { arm: [0, 0.45, -0.35], forearm: [0, -0.4, 0.3], thigh: [-1.6, 0, 0.05], shin: [0.05, 0, 0] },
  { arm: [0, 0.2, -0.5], forearm: [0, -0.5, 0.4], thigh: [-0.55, 0, 0.1], shin: [1.85, 0, 0] },
);
const SHIELD = pose(
  { spine: [0.28, 0, 0], chest: [0.12, 0, 0], head: [0.22, 0, 0] },
  { arm: [0, -1.25, -0.3], forearm: [0, -0.95, 1.05], thigh: [-1.0, 0, 0.1], shin: [1.45, 0, 0] },
  { arm: [0, -1.15, -0.2], forearm: [0, -0.85, 1.15], thigh: [-0.75, 0, 0.1], shin: [1.7, 0, 0] },
);
const LAND = pose(
  { spine: [0.3, 0, 0], head: [-0.1, 0, 0] },
  { arm: [0, -0.2, -0.55], forearm: [0, -0.4, 0], thigh: [-0.85, 0, 0.12], shin: [1.4, 0, 0] },
);

function raw(bones: Partial<Record<BoneName, Euler3>>): Pose {
  const out = {} as Record<BoneName, Euler3>;
  for (const name of BONES) out[name] = bones[name] ?? ZERO;
  return out;
}

const WAVE = raw({
  spine: [0.05, 0, -0.03],
  chest: [0.02, 0, -0.03],
  head: [0.04, 0.12, -0.07],
  armL: [-1.352, -0.645, -0.036],
  forearmL: [0.034, -0.871, 0.451],
  handL: [-0.026, -0.111, 0.034],
  armR: [-0.169, 0.228, 1.148],
  forearmR: [0.023, 0.157, 0.078],
  handR: [-0.005, -0.009, 0.07],
  thighL: [-0.152, -0.008, 0.042],
  shinL: [0.289, 0, -0.025],
  footL: [0.39, 0.038, 0.001],
  thighR: [-0.328, 0.022, -0.05],
  shinR: [0.654, 0.007, 0.043],
  footR: [0.279, -0.039, -0.008],
});

const WAVE_SWING = {
  in: { forearmL: [0.301, -1.161, 0.684], handL: [-0.039, -0.222, 0.032] },
  out: { forearmL: [-0.089, -0.565, 0.364], handL: [-0.014, 0, 0.035] },
} as const;

/** Seated on the front edge with both legs hanging over the billboard edge. */
const SIT = raw({
  spine: [0.24, 0, 0],
  chest: [0.06, 0, 0],
  head: [0.08, -0.14, 0],
  armL: WAVE.armL,
  forearmL: WAVE.forearmL,
  handL: WAVE.handL,
  armR: [0, 0.1, 1.18],
  forearmR: [0, 0.3, 0],
  thighL: [-1.3, 0, 0.14],
  shinL: [1.5, 0, 0],
  footL: [0.3, 0, 0],
  thighR: [-1.3, 0, -0.14],
  shinR: [1.5, 0, 0],
  footR: [0.3, 0, 0],
});

/** Lying down relaxed flat on the billboard platform deck. */
const LIE_DOWN = raw({
  spine: [-0.05, 0, 0],
  chest: [0, 0, 0],
  head: [-0.18, 0.15, 0],
  armL: [0.45, 0.2, -1.3],
  forearmL: [0, -0.85, 0],
  handL: [0, 0, 0],
  armR: [0.45, -0.2, 1.3],
  forearmR: [0, 0.85, 0],
  handR: [0, 0, 0],
  thighL: [0.05, 0, 0.15],
  shinL: [0.15, 0, 0],
  footL: [0.25, 0, 0],
  thighR: [0.05, 0, -0.15],
  shinR: [0.15, 0, 0],
  footR: [0.25, 0, 0],
});

/** Climbing down the clear corner wall. */
const CLIMB = raw({
  spine: [0.32, 0, 0],
  chest: [0.12, 0, 0],
  head: [0.2, 0, 0],
  armL: [-0.85, -0.3, -0.45],
  forearmL: [0.35, -0.65, 0.2],
  handL: [0.2, 0, 0],
  armR: [-0.45, 0.4, 0.65],
  forearmR: [-0.2, 0.75, -0.2],
  handR: [-0.2, 0, 0],
  thighL: [-0.75, 0, 0.2],
  shinL: [1.35, 0, 0],
  footL: [0.2, 0, 0],
  thighR: [-1.15, 0, -0.2],
  shinR: [1.65, 0, 0],
  footR: [0.3, 0, 0],
});

/** Seated acknowledgement after a GitHub/LinkedIn click: palm-forward wave. */
const WAIT = raw({
  ...SIT,
  armL: WAVE.armL,
  forearmL: WAVE.forearmL,
  handL: WAVE.handL,
  armR: [-0.28, 0.35, 1.05],
  forearmR: [0.55, 0.3, -0.2],
});

/** Keyframes on the frameBreak ratio: crouch → jump → kick (contact at IMPACT_AT) → shield. */
const BREAK_KEYS: readonly { f: number; pose: Pose }[] = [
  { f: 0, pose: STAND },
  { f: 0.2, pose: CROUCH },
  { f: 0.3, pose: CROUCH },
  { f: IMPACT_AT, pose: KICK },
  { f: IMPACT_AT + 0.08, pose: KICK },
  { f: 0.68, pose: SHIELD },
  { f: 1, pose: SHIELD },
];

export function createPoseBuffer(): PoseBuffer {
  const buffer = {} as PoseBuffer;
  for (const name of BONES) buffer[name] = [0, 0, 0];
  return buffer;
}

function blend(out: PoseBuffer, a: Pose, b: Pose, k: number): void {
  for (const name of BONES) {
    const p = a[name];
    const q = b[name];
    out[name][0] = p[0] + (q[0] - p[0]) * k;
    out[name][1] = p[1] + (q[1] - p[1]) * k;
    out[name][2] = p[2] + (q[2] - p[2]) * k;
  }
}

function keyed(out: PoseBuffer, keys: readonly { f: number; pose: Pose }[], f: number): void {
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (f <= keys[i + 1].f) {
      blend(out, keys[i].pose, keys[i + 1].pose, smoothstep(keys[i].f, keys[i + 1].f, f));
      return;
    }
  }
  blend(out, keys[keys.length - 1].pose, keys[keys.length - 1].pose, 0);
}

/** Running cycle layered on STAND during the run-up inside the screen. */
function run(out: PoseBuffer, phase: number, weight: number): void {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  out.thighL[0] += -0.85 * s * weight;
  out.thighR[0] += 0.85 * s * weight;
  out.shinL[0] += (0.9 + 0.7 * c) * weight;
  out.shinR[0] += (0.9 - 0.7 * c) * weight;
  out.armL[1] += 0.6 * s * weight;
  out.armR[1] += 0.6 * s * weight;
  out.forearmL[1] += -1.1 * weight;
  out.forearmR[1] += 1.1 * weight;
  out.spine[0] += 0.18 * weight;
}

/** Unhurried walk (career launch pad): STAND with alternating stride at `phase` radians. */
export function sampleWalkPose(phase: number, out: PoseBuffer): void {
  blend(out, STAND, STAND, 0);
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  out.thighL[0] += -0.42 * s;
  out.thighR[0] += 0.42 * s;
  out.shinL[0] += 0.18 + 0.28 * Math.max(0, c);
  out.shinR[0] += 0.18 + 0.28 * Math.max(0, -c);
  out.armL[1] += 0.32 * s;
  out.armR[1] += 0.32 * s;
  out.forearmL[1] += -0.45;
  out.forearmR[1] += 0.45;
}

/**
 * Full-body pose at journey progress `t`. `time` only drives ambient motion
 * (tumble breathing, wave); the choreography itself is a function of scroll.
 */
export function samplePose(t: number, time: number, out: PoseBuffer): void {
  const tunnel = phaseRatio(t, "blackTunnel");
  const white = phaseRatio(t, "whiteTunnel");
  const runUp = phaseRatio(t, "frameOut");
  const smash = phaseRatio(t, "frameBreak");
  const drop = phaseRatio(t, "drop");
  const wait = phaseRatio(t, "wait");
  if (smash > 0 && drop === 0) {
    keyed(out, BREAK_KEYS, smash);
  } else if (drop > 0 && wait === 0) {
    blend(out, SHIELD, LAND, smoothstep(0.35, 1, drop));
  } else if (wait > 0) {
    blend(out, LAND, LAND, 0);
  } else if (runUp > 0 || white > 0.6) {
    blend(out, FREEFALL, STAND, smoothstep(0.6, 1, white));
    run(out, runUp * Math.PI * 7, smoothstep(0, 0.15, runUp) * (1 - smoothstep(0.85, 1, runUp)));
  } else if (tunnel > 0) {
    blend(out, FLOAT, FREEFALL, smoothstep(0, 0.2, tunnel));
    out.armL[2] += Math.sin(time * 1.3) * 0.12;
    out.armR[2] -= Math.sin(time * 1.1 + 1) * 0.12;
  } else {
    blend(out, STAND, FLOAT, smoothstep(0.3, 1, phaseRatio(t, "title")));
    out.armL[2] += Math.sin(time * 0.9) * 0.05;
  }
}

function swingBone(out: PoseBuffer, bone: "forearmL" | "handL", to: readonly number[], k: number): void {
  const from = WAVE[bone];
  for (let i = 0; i < 3; i += 1) out[bone][i] += (to[i] - from[i]) * k;
}

/** Layers the side-to-side wave onto `out`; `s` in -1..1 picks the extreme. */
function wave(out: PoseBuffer, s: number): void {
  const extreme = s < 0 ? WAVE_SWING.in : WAVE_SWING.out;
  swingBone(out, "forearmL", extreme.forearmL, Math.abs(s));
  swingBone(out, "handL", extreme.handL, Math.abs(s));
}

function cursorPlay(out: PoseBuffer, time: number, cursorX: number, cursorY: number, weight: number): void {
  const toss = Math.sin(time * 2.7);
  out.armR[0] -= (0.3 + cursorY * 0.2) * weight;
  out.armR[2] -= (0.55 + cursorX * 0.22) * weight;
  out.forearmR[1] += (0.72 + Math.abs(toss) * 0.34) * weight;
  out.handR[0] += toss * 0.24 * weight;
  out.head[0] -= cursorY * 0.1 * weight;
  out.head[1] += cursorX * 0.16 * weight;
}

/** Contact-card pose selected by scroll or CTA interaction & idle sequence. */
export function sampleContactPose(
  mode: ContactPoseMode,
  time: number,
  fall: number,
  out: PoseBuffer,
  cursorX = 0,
  cursorY = 0,
): void {
  if (mode === "landing") {
    blend(out, LAND, STAND, smoothstep(0.55, 1, fall));
    return;
  }
  if (mode === "stand") {
    blend(out, STAND, STAND, 0);
    for (const bone of ["armL", "forearmL", "handL"] as const) {
      for (let i = 0; i < 3; i += 1) out[bone][i] = WAVE[bone][i];
    }
    wave(out, Math.sin(time * 5.2));
    out.head[0] -= 0.12;
    out.head[1] += Math.sin(time * 0.8) * 0.04;
    cursorPlay(out, time, cursorX, cursorY, 0.35);
    return;
  }
  if (mode === "sit") {
    blend(out, SIT, SIT, 0);
    wave(out, Math.sin(time * 5.2));
    out.head[1] += Math.sin(time * 2.1) * 0.05;
    cursorPlay(out, time, cursorX, cursorY, 1);
    return;
  }
  if (mode === "lie") {
    // Lie down relaxed on the platform deck
    blend(out, LIE_DOWN, LIE_DOWN, 0);
    const breathe = Math.sin(time * 1.8);
    out.chest[0] += breathe * 0.04;
    out.spine[0] += breathe * 0.02;
    out.head[1] += Math.sin(time * 0.7) * 0.08;
    return;
  }
  if (mode === "walkPlank") {
    // Walking across the catwalk plank
    sampleWalkPose(time * 4.2, out);
    out.armL[2] += Math.sin(time * 2.1) * 0.15;
    out.armR[2] -= Math.sin(time * 2.1) * 0.15;
    return;
  }
  if (mode === "wallClimb") {
    // Climbing down/up the corner wall
    const climbPhase = time * 3.5;
    const s = Math.sin(climbPhase);
    const c = Math.cos(climbPhase);
    blend(out, CLIMB, CLIMB, 0);
    out.armL[0] += s * 0.45;
    out.armR[0] -= s * 0.45;
    out.thighL[0] -= c * 0.45;
    out.thighR[0] += c * 0.45;
    return;
  }
  if (mode === "dance") {
    // Moonwalk / dance groove sideways
    blend(out, STAND, STAND, 0);
    const beat = Math.sin(time * 6.2);
    const counter = Math.sin(time * 6.2 + Math.PI);
    out.spine[2] += beat * 0.22;
    out.chest[2] -= beat * 0.16;
    out.head[0] -= 0.18;
    out.head[2] -= beat * 0.14;
    out.armL[2] += 0.85 + beat * 0.4;
    out.armR[2] -= 0.85 + counter * 0.4;
    out.forearmL[1] -= 0.85 + counter * 0.35;
    out.forearmR[1] += 0.85 + beat * 0.35;
    out.thighL[0] -= Math.max(0, beat) * 0.35;
    out.thighR[0] -= Math.max(0, counter) * 0.35;
    out.shinL[0] += Math.max(0, beat) * 0.5;
    out.shinR[0] += Math.max(0, counter) * 0.5;
    return;
  }
  if (mode === "jumpWave") {
    // Jump and wave both hands wildly
    blend(out, STAND, STAND, 0);
    const waveRate = Math.sin(time * 9.5);
    out.armL[2] += 1.45 + waveRate * 0.3;
    out.armR[2] -= 1.45 + waveRate * 0.3;
    out.forearmL[1] -= 0.95 + waveRate * 0.25;
    out.forearmR[1] += 0.95 + waveRate * 0.25;
    out.thighL[0] -= Math.abs(Math.sin(time * 5.0)) * 0.3;
    out.thighR[0] -= Math.abs(Math.sin(time * 5.0)) * 0.3;
    out.shinL[0] += Math.abs(Math.sin(time * 5.0)) * 0.45;
    out.shinR[0] += Math.abs(Math.sin(time * 5.0)) * 0.45;
    return;
  }
  if (mode === "wait") {
    blend(out, WAIT, WAIT, 0);
    wave(out, Math.sin(time * 4.2));
    out.head[0] -= 0.1;
    out.head[1] += Math.sin(time * 1.4) * 0.08;
    return;
  }
  blend(out, SIT, SIT, 0);
  cursorPlay(out, time, cursorX, cursorY, 1);
}

/** Writes a sampled pose onto an astronaut's skeleton. */
export function applyPose(instance: AstronautInstance, pose: PoseBuffer): void {
  for (const name of BONES) {
    const rotation = pose[name];
    instance.bones[name].rotation.set(rotation[0], rotation[1], rotation[2]);
  }
}
