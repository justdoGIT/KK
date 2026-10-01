import { CapsuleGeometry, CylinderGeometry, Group, SphereGeometry, TorusGeometry } from "three";
import { part, type ChibiPalette } from "./humanoid-surfaces.ts";

export type ChibiArm = { upper: Group; elbow: Group; forearm: Group; hand: Group };
export type ChibiLeg = { hip: Group; thigh: Group; knee: Group; shin: Group; boot: Group };
export const UPPER_ARM_LENGTH = 0.24;
export const FOREARM_LENGTH = 0.235;
export const THIGH_LENGTH = 0.23;
export const SHIN_LENGTH = 0.28;

/** A ring around a limb's +Y axis. */
function band(radius: number, tube: number, y: number, material: ChibiPalette["accent"]) {
  const mesh = part(new TorusGeometry(radius, tube, 12, 40), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

/** A softly flattened sphere: rounded armor plates and pads. */
function pad(radius: number, scale: readonly [number, number, number], at: readonly [number, number, number], material: ChibiPalette["accent"]) {
  const mesh = part(new SphereGeometry(radius, 32, 20), material);
  mesh.scale.set(...scale);
  mesh.position.set(...at);
  return mesh;
}

/** Limb sections point along +Y from proximal to distal joint; +Z is the armor face. */
export function createChibiArm(p: ChibiPalette): ChibiArm {
  const upper = new Group();
  const sleeve = part(new CapsuleGeometry(0.088, 0.09, 10, 32), p.shell);
  sleeve.position.y = 0.12;
  upper.add(
    part(new SphereGeometry(0.096, 32, 20), p.rubber),
    sleeve,
    pad(0.132, [1, 0.88, 0.94], [0, 0.03, 0], p.shell),
    band(0.104, 0.016, 0.095, p.accent),
  );

  const elbow = new Group();
  const pivot = part(new CylinderGeometry(0.046, 0.046, 0.17, 28), p.silver);
  pivot.rotation.z = Math.PI / 2;
  elbow.add(part(new SphereGeometry(0.082, 32, 20), p.rubber), pivot);

  const forearm = new Group();
  const vambrace = part(new CapsuleGeometry(0.092, 0.075, 10, 32), p.shell);
  vambrace.position.y = 0.113;
  vambrace.scale.z = 0.92;
  const stripe = part(new CapsuleGeometry(0.009, 0.075, 6, 12), p.cyan);
  stripe.position.set(0.028, 0.125, 0.088);
  forearm.add(
    vambrace,
    pad(0.07, [1, 1.15, 0.5], [-0.012, 0.115, 0.06], p.accent),
    stripe,
    band(0.082, 0.015, 0.038, p.accent),
    band(0.074, 0.014, 0.205, p.cyan),
  );

  // Black glove: rounded palm, curled capsule fingers, and an opposed thumb.
  const hand = new Group();
  hand.name = "ChibiRobotHand";
  hand.add(band(0.068, 0.014, 0, p.accent), pad(0.064, [1.05, 0.95, 0.72], [0, 0.062, 0], p.rubber));
  const finger = new CapsuleGeometry(0.0165, 0.045, 6, 14);
  for (let i = 0; i < 4; i += 1) {
    const digit = part(finger, p.rubber);
    digit.position.set((i - 1.5) * 0.031, 0.128 - Math.abs(i - 1.5) * 0.006, 0.012);
    digit.rotation.x = -0.4;
    hand.add(digit);
  }
  const thumb = part(new CapsuleGeometry(0.019, 0.04, 6, 14), p.rubber);
  thumb.position.set(0.068, 0.07, 0.02);
  thumb.rotation.set(-0.3, 0, -0.75);
  hand.add(thumb);
  return { upper, elbow, forearm, hand };
}

/** Rounded leg shells, orange knee and shin guards, and a soft boot on a flat dark sole. */
export function createChibiLeg(p: ChibiPalette): ChibiLeg {
  const hip = new Group();
  hip.add(pad(0.124, [1, 0.87, 0.87], [0, 0, 0], p.rubber));

  const thigh = new Group();
  const thighShell = part(new CapsuleGeometry(0.12, 0.055, 10, 32), p.shell);
  thighShell.position.y = 0.104;
  thighShell.scale.z = 0.94;
  thigh.add(thighShell, band(0.112, 0.014, 0.17, p.accent));

  const knee = new Group();
  const kneeLight = part(new CapsuleGeometry(0.01, 0.06, 6, 12), p.cyan);
  kneeLight.rotation.z = Math.PI / 2;
  kneeLight.position.set(0, 0.012, 0.115);
  knee.add(part(new SphereGeometry(0.097, 32, 20), p.rubber), pad(0.088, [1.05, 0.92, 0.62], [0, 0, 0.062], p.accent), kneeLight);

  const shin = new Group();
  const shinShell = part(new CapsuleGeometry(0.11, 0.09, 10, 32), p.shell);
  shinShell.position.y = 0.134;
  shinShell.scale.z = 0.94;
  shin.add(shinShell, pad(0.1, [0.95, 1.25, 0.55], [0, 0.155, 0.06], p.accent));
  const stripe = new CapsuleGeometry(0.009, 0.07, 6, 12);
  for (const y of [0.11, 0.19]) {
    const light = part(stripe, p.cyan);
    light.rotation.z = Math.PI / 2;
    light.position.set(0, y, 0.115);
    shin.add(light);
  }

  const boot = new Group();
  boot.name = "ChibiRobotBoot";
  const upperBoot = part(new CapsuleGeometry(0.1, 0.17, 12, 32), p.shell);
  upperBoot.rotation.x = Math.PI / 2;
  upperBoot.scale.set(1.25, 1, 0.62);
  upperBoot.position.set(0, 0.025, 0.07);
  const sole = part(new CapsuleGeometry(0.1, 0.19, 10, 32), p.rubber);
  sole.rotation.x = Math.PI / 2;
  sole.scale.set(1.32, 1, 0.24);
  sole.position.set(0, -0.045, 0.07);
  const ankle = part(new CylinderGeometry(0.083, 0.1, 0.135, 32), p.accent);
  ankle.position.set(0, 0.105, -0.014);
  boot.add(
    upperBoot,
    sole,
    pad(0.1, [1.22, 0.62, 0.9], [0, 0.02, 0.165], p.accent),
    ankle,
    band(0.082, 0.012, 0.172, p.rubber),
  );
  return { hip, thigh, knee, shin, boot };
}
