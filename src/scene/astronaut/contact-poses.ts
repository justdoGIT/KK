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

/**
 * Reclining on the left side with the torso propped on the left elbow and the
 * left glove tucked beneath the helmet. The forearm rises from the deck to
 * carry the head; the top leg folds over the straight lower leg while the
 * right hand rests on the hip.
 */
const RECLINE = raw({
  head: [0.12, 0.014, 0.231],
  armL: [0.594, -1.999, -0.309],
  forearmL: [-0.785, -2, 0.176],
  handL: [-1.521, -2.802, -2.739],
  armR: [-0.145, 0.113, 1.718],
  forearmR: [-0.064, 0.072, -0.612],
  handR: [-0.061, 0.193, 0.217],
  thighL: [-0.052, -0.023, -0.55],
  shinL: [0.03, 0, 0.006],
  footL: [-0.13, 0.306, 0.125],
  thighR: [-0.806, -0.046, 0.162],
  shinR: [1.444, -0.222, -0.28],
  footR: [-0.59, 0.117, 0.083],
});

/**
 * Hanging from the lip facing the billboard: arms reach up and slightly
 * forward to the edge, gloves curled over it, knees bent with the boots
 * braced back toward the card face. Solved from world limb directions with
 * the root turned to face the card.
 */
const WALL_HANG = raw({
  head: [0.252, 0, 0],
  armL: [0.234, -0.318, 1.365],
  forearmL: [-0.027, 0.1, 0.306],
  handL: [-0.298, -0.744, -0.341],
  armR: [0.234, 0.318, -1.365],
  forearmR: [-0.027, -0.1, -0.306],
  handR: [-0.298, 0.744, 0.341],
  thighL: [-0.188, -0.004, 0.068],
  shinL: [0.41, 0, -0.03],
  footL: [-0.188, -0.025, -0.011],
  thighR: [-0.118, 0.001, -0.069],
  shinR: [0.258, -0.001, 0.033],
  footR: [-0.105, 0.022, 0.009],
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
    blend(out, RECLINE, RECLINE, 0);
    const breathe = Math.sin(time * 1.8);
    out.chest[0] += breathe * 0.03;
    out.spine[0] += breathe * 0.015;
    out.head[1] += Math.sin(time * 0.7) * 0.1;
    // The drawn-up top leg idly rocks at the knee.
    out.shinR[0] += Math.sin(time * 1.3) * 0.08;
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
