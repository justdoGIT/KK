import { CapsuleGeometry, CylinderGeometry, Group, SphereGeometry, TorusGeometry } from "three";
import { lathe, part, type ChibiPalette } from "./humanoid-surfaces.ts";

/** Chest silhouette as [radius, height] pairs, waist to neck; flattened front to back by DEPTH. */
const CHEST: readonly (readonly [number, number])[] = [
  [0.001, 0.14],
  [0.16, 0.14],
  [0.195, 0.17],
  [0.225, 0.23],
  [0.252, 0.3],
  [0.266, 0.36],
  [0.258, 0.42],
  [0.226, 0.468],
  [0.16, 0.5],
  [0.001, 0.51],
];
const DEPTH = 0.74;

/** Chest radius at `y` (linear between profile points), for seating parts on its surface. */
function chestRadius(y: number): number {
  for (let i = 1; i < CHEST.length; i += 1) {
    const [r1, y1] = CHEST[i];
    const [r0, y0] = CHEST[i - 1];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return CHEST[CHEST.length - 1][0];
}

/** z of the chest's front surface at (x, y), plus a small lift. */
function front(x: number, y: number, lift = 0.004): number {
  const r = chestRadius(y);
  return Math.sqrt(Math.max(0, r * r - x * x)) * DEPTH + lift;
}

/**
 * Hip-relative rounded chest (+Y up, +Z toward the camera): a barrel-shaped
 * shell tapering to the waist, orange collar and lower trim, cyan vents and a
 * segmented light strip, a round status lamp, a soft pelvis on a black waist
 * joint, and a compact rounded backpack.
 */
export function createChibiTorso(p: ChibiPalette): Group {
  const torso = new Group();
  torso.name = "ChibiRobotTorso";

  const chest = part(lathe(CHEST, 64), p.shell);
  chest.scale.z = DEPTH;
  torso.add(chest);

  const ring = (radius: number, tube: number, y: number, material: ChibiPalette["accent"]) => {
    const mesh = part(new TorusGeometry(radius, tube, 14, 64), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.y = DEPTH;
    mesh.position.y = y;
    torso.add(mesh);
  };
  ring(0.178, 0.034, 0.488, p.accent);
  ring(0.2, 0.018, 0.17, p.accent);
  ring(0.15, 0.04, 0.128, p.rubber);

  const neck = part(new CylinderGeometry(0.1, 0.125, 0.11, 32), p.rubber);
  neck.position.y = 0.55;
  torso.add(neck);

  // Segmented cyan strip just right of centre, and three slanted vents on the left.
  const segment = new CapsuleGeometry(0.011, 0.034, 6, 12);
  for (let i = 0; i < 5; i += 1) {
    const y = 0.4 - i * 0.034;
    const bar = part(segment, p.cyan);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0.04, y, front(0.04, y));
    torso.add(bar);
  }
  const vent = new CapsuleGeometry(0.009, 0.05, 6, 12);
  for (let i = 0; i < 3; i += 1) {
    const y = 0.41 - i * 0.03;
    const slat = part(vent, p.cyan);
    slat.rotation.set(0, -0.45, Math.PI / 2 - 0.25);
    slat.position.set(-0.13, y, front(-0.13, y) - 0.004);
    torso.add(slat);
  }

  const lamp = new Group();
  lamp.position.set(0.155, 0.37, front(0.155, 0.37) - 0.01);
  lamp.rotation.y = 0.5;
  const socket = part(new CylinderGeometry(0.036, 0.036, 0.02, 32), p.dark);
  socket.rotation.x = Math.PI / 2;
  const bezel = part(new TorusGeometry(0.033, 0.007, 10, 32), p.silver);
  bezel.position.z = 0.01;
  const light = part(new SphereGeometry(0.02, 20, 12), p.glow);
  light.scale.z = 0.45;
  light.position.z = 0.012;
  lamp.add(socket, bezel, light);
  torso.add(lamp);

  const pelvis = part(new SphereGeometry(0.17, 40, 24), p.shell);
  pelvis.scale.set(1.08, 0.6, 0.82);
  pelvis.position.y = 0.06;
  const buckle = part(new SphereGeometry(0.05, 24, 16), p.accent);
  buckle.scale.set(1.2, 0.8, 0.45);
  buckle.position.set(0, 0.075, 0.135);
  torso.add(pelvis, buckle);

  const pack = part(new CapsuleGeometry(0.11, 0.13, 10, 32), p.shell);
  pack.scale.set(1.25, 1, 0.62);
  pack.position.set(0, 0.32, -0.19);
  const packBand = part(new TorusGeometry(0.11, 0.016, 10, 40), p.accent);
  packBand.rotation.x = Math.PI / 2;
  packBand.scale.set(1.25, 0.62, 1);
  packBand.position.set(0, 0.3, -0.19);
  torso.add(pack, packBand);
  return torso;
}
