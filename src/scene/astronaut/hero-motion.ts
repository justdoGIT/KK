import {
  IMPACT_AT,
  PHASE_SPANS,
  backInOut,
  phaseRatio,
  smoothstep,
  type PhaseId,
} from "../../components/ui/astronaut/journey-timeline.ts";
import type { ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { restOnPanel, type LandingAnchor } from "./landing-panel.ts";

// Root transform of the hero astronaut (world units; camera at z=6, 35° FOV,
// so the stage is ~3.8 units tall and the glass screen lies on z = 0).
// Values are keyed on phase ratios so retuning phase weights keeps the beats.

type Key = { phase: PhaseId; f: number; v: number };

/** Absolute progress of a key: `f` of the way through `phase`. */
function keyTime(key: Key): number {
  const span = PHASE_SPANS[key.phase];
  return span.from + (span.to - span.from) * key.f;
}

function keyed(t: number, keys: readonly Key[]): number {
  if (t <= keyTime(keys[0])) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keyTime(keys[i]);
    const b = keyTime(keys[i + 1]);
    if (t <= b) return keys[i].v + (keys[i + 1].v - keys[i].v) * smoothstep(a, b, t);
  }
  return keys[keys.length - 1].v;
}

const SCALE: readonly Key[] = [
  { phase: "cardShow", f: 0, v: 0.16 },
  { phase: "frameIn", f: 1, v: 0.26 },
  { phase: "title", f: 1, v: 0.95 },
  { phase: "blackTunnel", f: 1, v: 0.8 },
  { phase: "whiteTunnel", f: 1, v: 0.56 },
  { phase: "frameOut", f: 1, v: 0.64 },
  { phase: "frameBreak", f: IMPACT_AT, v: 0.8 },
  { phase: "frameBreak", f: 1, v: 1.1 },
  { phase: "drop", f: 1, v: 1.28 },
];
const Y: readonly Key[] = [
  { phase: "cardShow", f: 0, v: 0.05 },
  { phase: "title", f: 1, v: -0.5 },
  { phase: "blackTunnel", f: 1, v: -0.25 },
  { phase: "whiteTunnel", f: 1, v: -0.28 },
  { phase: "frameOut", f: 1, v: -0.32 },
  { phase: "frameBreak", f: 0.26, v: -0.45 },
  { phase: "frameBreak", f: IMPACT_AT, v: 0.12 },
  { phase: "frameBreak", f: 1, v: 0.05 },
];
const Z: readonly Key[] = [
  { phase: "cardShow", f: 0, v: 0 },
  { phase: "whiteTunnel", f: 1, v: -0.9 },
  { phase: "frameOut", f: 1, v: -0.55 },
  { phase: "frameBreak", f: 0.26, v: -0.55 },
  { phase: "frameBreak", f: IMPACT_AT, v: -0.05 },
  { phase: "frameBreak", f: 1, v: 1.1 },
  { phase: "drop", f: 1, v: 0.45 },
];
const ROT_Y: readonly Key[] = [
  { phase: "cardShow", f: 0, v: 0.7 },
  { phase: "title", f: 1, v: 0 },
  { phase: "frameBreak", f: 0.26, v: 0 },
  { phase: "frameBreak", f: IMPACT_AT, v: 0.45 },
  { phase: "frameBreak", f: 0.75, v: 0.1 },
];
const ROT_X: readonly Key[] = [
  { phase: "cardShow", f: 0, v: 0 },
  { phase: "title", f: 1, v: -0.12 },
  { phase: "frameBreak", f: 0.26, v: 0.1 },
  { phase: "frameBreak", f: IMPACT_AT, v: -0.25 },
  { phase: "frameBreak", f: 0.8, v: 0.22 },
  { phase: "drop", f: 1, v: 0 },
];

export type RootPose = { x: number; y: number; z: number; scale: number; rx: number; ry: number; rz: number };


/**
 * Hero root transform at progress `t`. `time` (s) only drives the tunnel
 * tumble; once the wait phase begins, `contactRoot` takes over the position,
 * carrying the astronaut from this drop's ending pose onto the landing deck.
 */
export function heroRoot(t: number, time: number, out: RootPose): RootPose {
  const tunnel = phaseRatio(t, "blackTunnel");
  const settle = 1 - phaseRatio(t, "whiteTunnel");
  const tumble = smoothstep(0, 0.25, tunnel) * settle;
  const drop = phaseRatio(t, "drop");
  const drift = Math.sin(time * 0.9) * 0.35 * tumble + Math.sin(time * 0.37 + 1.3) * 0.12 * tumble;
  const flight = keyed(t, Y) + Math.cos(time * 0.7) * 0.22 * tumble - 0.4 * backInOut(drop);
  out.scale = keyed(t, SCALE);
  out.x = drift;
  out.y = flight;
  out.z = keyed(t, Z);
  out.rx = keyed(t, ROT_X) + Math.sin(time * 0.61) * 0.7 * tumble;
  out.ry = keyed(t, ROT_Y) + Math.sin(time * 0.43 + 0.8) * 0.9 * tumble;
  out.rz = Math.sin(time * 0.52 + 2.1) * 1.05 * tumble;
  return out;
}

/**
 * Carries the hero root from its drop-ending pose onto the landing panel as
 * `fall` goes 0..1. Once landed the root tracks the card-anchored panel every
 * frame, so the astronaut, panel, and card zoom out together. `localSole` is
 * the current pose's lowest boot sole in rig units, so any standing pose
 * (landing crouch, wave, dance) keeps its boots on the panel top.
 */
export function contactRoot(
  anchor: LandingAnchor | null,
  mode: ContactPoseMode,
  localSole: number,
  fall: number,
  time: number,
  out: RootPose,
): RootPose {
  if (fall <= 0 || !anchor) return out;
  const rest = restOnPanel(anchor, mode, localSole, time);
  const sway = Math.sin(time * 0.6) * 0.015;
  out.x += (anchor.x + rest.xOffset + sway - out.x) * fall;
  out.y += (rest.y - out.y) * fall;
  out.z += (rest.z - out.z) * fall;
  out.scale += (anchor.scale - out.scale) * fall;
  out.rx *= 1 - fall;
  out.ry *= 1 - fall;
  out.rz *= 1 - fall;
  return out;
}

export function createRootPose(): RootPose {
  return { x: 0, y: 0, z: 0, scale: 1, rx: 0, ry: 0, rz: 0 };
}

/** 0..1 weight of the ghost clones trailing the hero in the black tunnel. */
export function cloneWeight(t: number): number {
  const tunnel = phaseRatio(t, "blackTunnel");
  return smoothstep(0.2, 0.4, tunnel) * (1 - smoothstep(0.85, 1, tunnel));
}

/** Impact envelope around the kick: 0 before, peaks at contact, decays after. */
export function impactEnvelope(t: number): number {
  const f = phaseRatio(t, "frameBreak");
  if (f <= IMPACT_AT - 0.04) return 0;
  if (f <= IMPACT_AT) return (f - (IMPACT_AT - 0.04)) / 0.04;
  return Math.max(0, 1 - (f - IMPACT_AT) / 0.3);
}
