import type { ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import {
  LAND,
  STAND,
  blend,
  raw,
  sampleWalkPose,
  type Euler3,
  type PoseBuffer,
} from "./astronaut-poses.ts";

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

/** Hanging from the billboard edge with both hands gripping the top. */
const WALL_HANG = raw({
  spine: [0.12, -0.35, 0],
  chest: [0.08, -0.28, 0],
  head: [-0.12, -0.22, 0.08],
  armL: [0.05, 0.25, 1.48],
  forearmL: [-0.05, -0.1, 0.08],
  handL: [-0.25, 0.05, 0.1],
  armR: [0.05, -0.25, -1.48],
  forearmR: [-0.05, 0.1, -0.08],
  handR: [-0.25, -0.05, -0.1],
  thighL: [-0.62, -0.45, 0.28],
  shinL: [0.55, -0.18, 0.15],
  footL: [0.32, 0.12, 0.18],
  thighR: [-0.58, -0.42, -0.28],
  shinR: [0.52, -0.15, -0.15],
  footR: [0.32, 0.12, -0.18],
});

/** Seated acknowledgement after a GitHub or LinkedIn hover. */
const WAIT = raw({
  ...SIT,
  armL: WAVE.armL,
  forearmL: WAVE.forearmL,
  handL: WAVE.handL,
  armR: [-0.28, 0.35, 1.05],
  forearmR: [0.55, 0.3, -0.2],
});

function swingBone(out: PoseBuffer, bone: "forearmL" | "handL", to: Euler3, k: number): void {
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

/** Contact-card pose selected by scroll or CTA interaction and idle sequence. */
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
    blend(out, LIE_DOWN, LIE_DOWN, 0);
    const breathe = Math.sin(time * 1.8);
    out.chest[0] += breathe * 0.04;
    out.spine[0] += breathe * 0.02;
    out.head[1] += Math.sin(time * 0.7) * 0.08;
    return;
  }
  if (mode === "walkPlank") {
    sampleWalkPose(time * 4.2, out);
    out.armL[2] += Math.sin(time * 2.1) * 0.15;
    out.armR[2] -= Math.sin(time * 2.1) * 0.15;
    return;
  }
  if (mode === "wallClimb") {
    blend(out, WALL_HANG, WALL_HANG, 0);
    const swing = Math.sin(time * 2.2);
    out.thighL[0] += swing * 0.08;
    out.thighR[0] -= swing * 0.08;
    out.shinL[0] += Math.abs(swing) * 0.1;
    out.shinR[0] += Math.abs(swing) * 0.1;
    out.head[0] -= 0.12 + swing * 0.04;
    return;
  }
  if (mode === "dance") {
    blend(out, STAND, STAND, 0);
    const beat = Math.sin(time * 6.2);
    const sway = Math.sin(time * 3.1);
    out.spine[2] = sway * 0.14;
    out.chest[1] = Math.sin(time * 2.4) * 0.18;
    out.head[1] = -out.chest[1] * 0.65;
    out.armL[0] = -0.35 - beat * 0.18;
    out.armL[2] = 0.88 + sway * 0.25;
    out.forearmL[1] = -1.05 + beat * 0.25;
    out.armR[0] = -0.35 + beat * 0.18;
    out.armR[2] = -0.88 + sway * 0.25;
    out.forearmR[1] = 1.05 + beat * 0.25;
    out.thighL[0] = -Math.max(0, beat) * 0.24;
    out.thighR[0] = -Math.max(0, -beat) * 0.24;
    out.shinL[0] = Math.max(0, beat) * 0.38;
    out.shinR[0] = Math.max(0, -beat) * 0.38;
    return;
  }
  if (mode === "moonwalk") {
    blend(out, STAND, STAND, 0);
    const cycle = Math.sin(time * 5);
    const leftLeads = cycle > 0;
    out.thighL[0] = leftLeads ? -0.45 : 0.1;
    out.shinL[0] = leftLeads ? 0.85 : 0.05;
    out.footL[0] = leftLeads ? 0.55 : -0.1;
    out.thighR[0] = leftLeads ? 0.1 : -0.45;
    out.shinR[0] = leftLeads ? 0.05 : 0.85;
    out.footR[0] = leftLeads ? -0.1 : 0.55;
    out.armL[0] = -0.38;
    out.armL[2] = 1.05;
    out.forearmL[1] = -1.15;
    out.handL[0] = 0.35;
    out.armR[0] = 0.32;
    out.armR[2] = -0.55;
    out.forearmR[1] = 0.35;
    out.head[0] = -0.2;
    out.head[1] = 0.1;
    return;
  }
  if (mode === "jumpWave") {
    blend(out, STAND, STAND, 0);
    const waveRate = Math.sin(time * 9.5);
    out.armL[2] += 1.45 + waveRate * 0.3;
    out.armR[2] -= 1.45 + waveRate * 0.3;
    out.forearmL[1] -= 0.95 + waveRate * 0.25;
    out.forearmR[1] += 0.95 + waveRate * 0.25;
    out.thighL[0] -= Math.abs(Math.sin(time * 5)) * 0.3;
    out.thighR[0] -= Math.abs(Math.sin(time * 5)) * 0.3;
    out.shinL[0] += Math.abs(Math.sin(time * 5)) * 0.45;
    out.shinR[0] += Math.abs(Math.sin(time * 5)) * 0.45;
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
