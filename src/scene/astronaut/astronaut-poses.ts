import { IMPACT_AT, SEAT_AT, phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import { BONES, type BoneName } from "./astronaut-rig.ts";

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
/** Seated on the finale card edge: thighs over the front, shins hanging. */
const SIT = pose(
  { spine: [0.24, 0, 0], chest: [0.06, 0, 0], head: [0.08, -0.14, 0] },
  // Waving arm: raised, forearm rolled so the open palm faces the viewer.
  {
    arm: [0, -0.15, 1.05],
    forearm: [1.35, 0, 0.7],
    hand: [0.32, 0, 0],
    thigh: [-1.3, 0, 0.14],
    shin: [1.5, 0, 0],
    foot: [0.3, 0, 0],
  },
  // Far arm rests down the card edge.
  {
    arm: [0, -0.1, -1.18],
    forearm: [0, -0.3, 0],
    thigh: [-1.3, 0, 0.14],
    shin: [1.5, 0, 0],
    foot: [0.3, 0, 0],
  },
);

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
    blend(out, LAND, SIT, smoothstep(0, SEAT_AT, wait));
    const waving = smoothstep(SEAT_AT + 0.06, SEAT_AT + 0.2, wait);
    out.forearmL[2] += Math.sin(time * 5.2) * 0.34 * waving;
    out.handL[2] += Math.sin(time * 5.2 + 0.6) * 0.22 * waving;
    out.head[1] += Math.sin(time * 2.1) * 0.05 * waving;
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
