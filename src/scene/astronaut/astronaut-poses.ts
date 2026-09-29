import { smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";

// Joint rotations (radians, XYZ euler) for the procedural astronaut rig.
// "L" joints sit on the viewer's left (x < 0) while the astronaut faces the
// camera. Limbs hang along local -Y, so: -X raises a limb forward, +X bends a
// knee back, and Z swings a limb out sideways (negative on L, positive on R).

export const JOINTS = [
  "torso",
  "head",
  "shoulderL",
  "elbowL",
  "shoulderR",
  "elbowR",
  "hipL",
  "kneeL",
  "hipR",
  "kneeR",
] as const;

export type JointName = (typeof JOINTS)[number];
export type Euler3 = readonly [number, number, number];
export type Pose = Record<JointName, Euler3>;

const STAND: Pose = {
  torso: [0, 0, 0],
  head: [0.05, 0, 0],
  shoulderL: [0.02, 0, -0.14],
  elbowL: [-0.2, 0, 0],
  shoulderR: [0.02, 0, 0.14],
  elbowR: [-0.2, 0, 0],
  hipL: [0, 0, -0.05],
  kneeL: [0.06, 0, 0],
  hipR: [0, 0, 0.05],
  kneeR: [0.06, 0, 0],
};

// Title beat: floating toward camera, arms spread with forearms raised.
const SPREAD: Pose = {
  torso: [0.08, 0, 0],
  head: [0.12, 0, 0],
  shoulderL: [0, 0, -1.3],
  elbowL: [0, 0, -0.85],
  shoulderR: [0, 0, 1.3],
  elbowR: [0, 0, 0.85],
  hipL: [-0.28, 0, -0.12],
  kneeL: [0.5, 0, 0],
  hipR: [0.08, 0, 0.1],
  kneeR: [0.22, 0, 0],
};

// Tunnel beat: skydiver arch, limbs splayed.
const FREEFALL: Pose = {
  torso: [0.28, 0, 0],
  head: [-0.18, 0, 0],
  shoulderL: [-0.3, 0, -1.95],
  elbowL: [0, 0, 0.55],
  shoulderR: [-0.3, 0, 1.95],
  elbowR: [0, 0, -0.55],
  hipL: [0.22, 0, -0.42],
  kneeL: [0.95, 0, 0],
  hipR: [0.22, 0, 0.42],
  kneeR: [0.95, 0, 0],
};

// Screen beat: palms pressed on the glass at head height.
const PUSH: Pose = {
  torso: [-0.05, 0, 0],
  head: [0.02, 0, 0],
  shoulderL: [-0.4, 0, -0.95],
  elbowL: [-0.1, 0, -1.45],
  shoulderR: [-0.4, 0, 0.95],
  elbowR: [-0.1, 0, 1.45],
  hipL: [-0.38, 0, -0.05],
  kneeL: [0.62, 0, 0],
  hipR: [0.06, 0, 0.06],
  kneeR: [0.24, 0, 0],
};

// Break-through beat: balancing drop, arms out, one knee raised.
const DROP: Pose = {
  torso: [0.1, 0, 0],
  head: [0.1, 0, 0],
  shoulderL: [0, 0, -1.5],
  elbowL: [0, 0, 0.15],
  shoulderR: [0, 0, 1.45],
  elbowR: [0, 0, -0.1],
  hipL: [-0.72, 0, -0.1],
  kneeL: [1.1, 0, 0],
  hipR: [0.05, 0, 0.05],
  kneeR: [0.16, 0, 0],
};

// Finale: standing, viewer-left arm raised for the wave.
export const WAVE: Pose = {
  ...STAND,
  head: [0.04, -0.08, 0],
  shoulderL: [0, 0, -2.55],
  elbowL: [0, 0, -0.5],
  shoulderR: [0.04, 0, 0.2],
};

const POSE_KEYS: ReadonlyArray<{ t: number; pose: Pose }> = [
  { t: 0, pose: STAND },
  { t: 0.12, pose: STAND },
  { t: 0.22, pose: SPREAD },
  { t: 0.3, pose: SPREAD },
  { t: 0.36, pose: FREEFALL },
  { t: 0.57, pose: FREEFALL },
  { t: 0.65, pose: PUSH },
  { t: 0.74, pose: PUSH },
  { t: 0.8, pose: DROP },
  { t: 0.87, pose: DROP },
  { t: 0.93, pose: WAVE },
  { t: 1, pose: WAVE },
];

/** Blend the keyed poses at timeline progress `t` into `out`. */
export function samplePose(t: number, out: Record<JointName, [number, number, number]>): void {
  let a = POSE_KEYS[0];
  let b = POSE_KEYS[POSE_KEYS.length - 1];
  for (let i = 0; i < POSE_KEYS.length - 1; i++) {
    if (t >= POSE_KEYS[i].t && t <= POSE_KEYS[i + 1].t) {
      a = POSE_KEYS[i];
      b = POSE_KEYS[i + 1];
      break;
    }
  }
  const k = a === b ? 0 : smoothstep(a.t, b.t, t);
  for (const joint of JOINTS) {
    const p = a.pose[joint];
    const q = b.pose[joint];
    const o = out[joint];
    o[0] = p[0] + (q[0] - p[0]) * k;
    o[1] = p[1] + (q[1] - p[1]) * k;
    o[2] = p[2] + (q[2] - p[2]) * k;
  }
}

export function createPoseBuffer(): Record<JointName, [number, number, number]> {
  const buffer = {} as Record<JointName, [number, number, number]>;
  for (const joint of JOINTS) buffer[joint] = [0, 0, 0];
  return buffer;
}
