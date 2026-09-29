import { backInOut, phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";

// Root transform keyframes for the hero astronaut (world units, camera at
// z=6 with a 35deg FOV, so the stage is ~3.8 units tall). Values are blended
// with smoothstep between keys; tumble noise and the drop curve are layered on
// top in `heroRoot`.

type Key = { t: number; v: number };

function keyed(t: number, keys: readonly Key[]): number {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) return a.v + (b.v - a.v) * smoothstep(a.t, b.t, t);
  }
  return keys[keys.length - 1].v;
}

const SCALE: readonly Key[] = [
  { t: 0, v: 0.15 }, { t: 0.05, v: 0.16 }, { t: 0.12, v: 0.24 },
  { t: 0.28, v: 0.95 }, { t: 0.58, v: 0.8 }, { t: 0.66, v: 0.56 },
  { t: 0.72, v: 0.74 }, { t: 0.8, v: 1.1 }, { t: 0.88, v: 1.34 }, { t: 1, v: 1.34 },
];
const Y: readonly Key[] = [
  { t: 0, v: 0.05 }, { t: 0.12, v: -0.02 }, { t: 0.28, v: -0.55 },
  { t: 0.58, v: -0.25 }, { t: 0.66, v: -0.08 }, { t: 0.72, v: -0.16 },
  { t: 0.8, v: -0.3 }, { t: 1, v: -0.3 },
];
const Z: readonly Key[] = [
  { t: 0, v: 0 }, { t: 0.72, v: 0 }, { t: 0.8, v: 0.9 }, { t: 0.88, v: 0.4 }, { t: 1, v: 0.4 },
];
const ROT_Y: readonly Key[] = [
  { t: 0, v: 0.7 }, { t: 0.12, v: 0.35 }, { t: 0.28, v: 0 }, { t: 0.58, v: 0 },
  { t: 0.66, v: 0 }, { t: 0.88, v: 0 }, { t: 1, v: -0.08 },
];
const ROT_X: readonly Key[] = [
  { t: 0, v: 0 }, { t: 0.2, v: -0.18 }, { t: 0.28, v: -0.1 }, { t: 0.66, v: 0 },
  { t: 0.76, v: -0.12 }, { t: 0.88, v: 0 }, { t: 1, v: 0 },
];

export type RootPose = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rx: number;
  ry: number;
  rz: number;
};

/** Hero root transform at progress `t`; `time` (s) drives the tunnel tumble and idle bob. */
export function heroRoot(t: number, time: number, out: RootPose): RootPose {
  const tunnel = phaseRatio(t, "blackTunnel");
  const settle = 1 - phaseRatio(t, "whiteTunnel");
  const tumble = smoothstep(0, 0.25, tunnel) * settle;
  const drop = phaseRatio(t, "drop");
  const wait = phaseRatio(t, "wait");

  out.scale = keyed(t, SCALE);
  out.x = Math.sin(time * 0.9) * 0.35 * tumble + Math.sin(time * 0.37 + 1.3) * 0.12 * tumble;
  // Lusion: position.y -= 0.4 * backInOut(dropRatio) -- anticipation, then fall.
  out.y =
    keyed(t, Y) +
    Math.cos(time * 0.7) * 0.22 * tumble -
    0.34 * backInOut(drop) +
    Math.sin(time * 1.4) * 0.025 * wait;
  out.z = keyed(t, Z);
  out.rx = keyed(t, ROT_X) + Math.sin(time * 0.61) * 0.7 * tumble;
  out.ry = keyed(t, ROT_Y) + Math.sin(time * 0.43 + 0.8) * 0.9 * tumble;
  out.rz = Math.sin(time * 0.52 + 2.1) * 1.05 * tumble + (1 - drop) * 0.08 * phaseRatio(t, "frameBreak");
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

/** Waving strength: ramps in once the astronaut has landed. */
export function waveWeight(t: number): number {
  return smoothstep(0.9, 0.95, t);
}

/** LED visor brightness (Lusion shows the face card from astronautDrop >= 0.95). */
export function ledWeight(t: number): number {
  return smoothstep(0.86, 0.9, t);
}
