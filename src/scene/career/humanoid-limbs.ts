import { CapsuleGeometry, CylinderGeometry, Group, SphereGeometry, TorusGeometry } from "three";
import { part, roundedBox, type ChibiPalette } from "./humanoid-surfaces.ts";

export type ChibiArm = { upper: Group; elbow: Group; forearm: Group; hand: Group };
export type ChibiLeg = { hip: Group; thigh: Group; knee: Group; shin: Group; boot: Group };
export const UPPER_ARM_LENGTH = 0.24;
export const FOREARM_LENGTH = 0.235;
export const THIGH_LENGTH = 0.23;
export const SHIN_LENGTH = 0.28;
export const BOOT_SOLE_HEIGHT = 0.08;

/** Limb sections point along +Y, from proximal joint to distal joint; +Z is the armor face. */
export function createChibiArm(p: ChibiPalette): ChibiArm {
  const upper = new Group();
  const socket = part(new SphereGeometry(0.096, 24, 18), p.rubber);
  const sleeve = part(new CapsuleGeometry(0.091, 0.09, 8, 28), p.shell);
  sleeve.position.y = 0.12;
  const shoulder = part(new SphereGeometry(0.132, 32, 24), p.shell);
  shoulder.position.y = 0.03;
  shoulder.scale.set(1, 0.9, 0.92);
  const shoulderTrim = part(new TorusGeometry(0.106, 0.013, 10, 32), p.accent);
  shoulderTrim.rotation.x = Math.PI / 2;
  shoulderTrim.position.y = 0.092;
  upper.add(socket, sleeve, shoulder, shoulderTrim);

  const elbow = new Group();
  elbow.add(part(new SphereGeometry(0.083, 24, 18), p.rubber));
  const pivot = part(new CylinderGeometry(0.047, 0.047, 0.175, 24), p.silver);
  pivot.rotation.z = Math.PI / 2;
  elbow.add(pivot);

  const forearm = new Group();
  const vambrace = part(new CapsuleGeometry(0.094, 0.075, 8, 28), p.shell);
  vambrace.position.y = 0.113;
  vambrace.scale.z = 0.9;
  const elbowBand = part(new TorusGeometry(0.081, 0.014, 10, 28), p.accent);
  elbowBand.rotation.x = Math.PI / 2;
  elbowBand.position.y = 0.038;
  const wristBand = part(new TorusGeometry(0.075, 0.014, 10, 28), p.cyan);
  wristBand.rotation.x = Math.PI / 2;
  wristBand.position.y = 0.206;
  const panel = part(roundedBox(0.107, 0.13, 0.028, 0.018), p.shell);
  panel.position.set(0, 0.118, 0.077);
  const stripe = part(roundedBox(0.018, 0.093, 0.012, 0.004), p.accent);
  stripe.position.set(-0.023, 0.117, 0.097);
  forearm.add(vambrace, elbowBand, wristBand, panel, stripe);
  const slotGeometry = roundedBox(0.024, 0.008, 0.01, 0.003);
  for (let i = 0; i < 3; i++) {
    const slot = part(slotGeometry, p.dark);
    slot.position.set(0.024, 0.143 + i * 0.012, 0.097);
    forearm.add(slot);
  }

  const hand = new Group();
  hand.name = "ChibiRobotHand";
  const cuff = part(new TorusGeometry(0.069, 0.013, 10, 28), p.accent);
  cuff.rotation.x = Math.PI / 2;
  const palm = part(roundedBox(0.125, 0.106, 0.081, 0.025), p.rubber);
  palm.position.y = 0.06;
  const handPlate = part(roundedBox(0.106, 0.07, 0.027, 0.015), p.shell);
  handPlate.position.set(0, 0.045, 0.044);
  hand.add(cuff, palm, handPlate);
  const knuckleGeometry = new SphereGeometry(0.017, 16, 12);
  const fingerGeometry = roundedBox(0.025, 0.042, 0.032, 0.009);
  const tipGeometry = roundedBox(0.024, 0.031, 0.032, 0.011);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.03;
    const offset = Math.abs(i - 1.5) * 0.006;
    const knuckle = part(knuckleGeometry, p.dark);
    knuckle.position.set(x, 0.105 - offset, 0.017);
    const finger = part(fingerGeometry, p.dark);
    finger.position.set(x, 0.13 - offset, 0.014);
    finger.rotation.x = -0.2;
    const tip = part(tipGeometry, p.rubber);
    tip.position.set(x, 0.157 - offset, -0.003);
    tip.rotation.x = -0.65;
    hand.add(knuckle, finger, tip);
  }
  const thumb = part(roundedBox(0.031, 0.067, 0.039, 0.013), p.dark);
  thumb.position.set(0.074, 0.069, 0.011);
  thumb.rotation.z = -0.55;
  const thumbTip = part(tipGeometry, p.rubber);
  thumbTip.position.set(0.091, 0.099, -0.003);
  thumbTip.rotation.x = -0.5;
  hand.add(thumb, thumbTip);
  return { upper, elbow, forearm, hand };
}

/** Closed leg shells and flat treaded soles, with separate knee and ankle articulation. */
export function createChibiLeg(p: ChibiPalette): ChibiLeg {
  const hip = new Group();
  const hipJoint = part(new SphereGeometry(0.124, 28, 20), p.rubber);
  hipJoint.scale.set(1, 0.87, 0.87);
  hip.add(hipJoint);

  const thigh = new Group();
  const thighShell = part(new CapsuleGeometry(0.123, 0.055, 8, 28), p.shell);
  thighShell.position.y = 0.104;
  thighShell.scale.z = 0.94;
  const thighBand = part(new TorusGeometry(0.112, 0.012, 10, 28), p.accent);
  thighBand.rotation.x = Math.PI / 2;
  thighBand.position.y = 0.17;
  thigh.add(thighShell, thighBand);

  const knee = new Group();
  knee.add(part(new SphereGeometry(0.098, 24, 18), p.rubber));
  const kneePlate = part(roundedBox(0.174, 0.125, 0.085, 0.038), p.shell);
  kneePlate.position.z = 0.055;
  const kneeLight = part(roundedBox(0.148, 0.032, 0.025, 0.01), p.cyan);
  kneeLight.position.set(0, 0.03, 0.103);
  knee.add(kneePlate, kneeLight);

  const shin = new Group();
  const shinShell = part(new CapsuleGeometry(0.112, 0.09, 8, 28), p.shell);
  shinShell.position.y = 0.134;
  shinShell.scale.z = 0.94;
  const greave = part(roundedBox(0.194, 0.178, 0.087, 0.035), p.accent);
  greave.position.set(0, 0.15, 0.082);
  const shinRim = part(roundedBox(0.199, 0.038, 0.065, 0.013), p.cyan);
  shinRim.position.set(0, 0.065, 0.098);
  const ankleLamp = part(roundedBox(0.102, 0.022, 0.018, 0.008), p.cyan);
  ankleLamp.position.set(0, 0.211, 0.132);
  shin.add(shinShell, greave, shinRim, ankleLamp);

  const boot = new Group();
  boot.name = "ChibiRobotBoot";
  const sole = part(roundedBox(0.282, 0.058, 0.372, 0.023), p.rubber);
  sole.position.set(0, -0.045, 0.076);
  const welt = part(roundedBox(0.273, 0.021, 0.353, 0.012), p.silver);
  welt.position.set(0, -0.013, 0.076);
  const shoe = part(roundedBox(0.253, 0.123, 0.316, 0.045), p.shell);
  shoe.position.set(0, 0.019, 0.066);
  const toe = part(roundedBox(0.208, 0.066, 0.122, 0.024), p.accent);
  toe.position.set(0, 0.028, 0.186);
  const ankle = part(new CylinderGeometry(0.083, 0.1, 0.135, 28), p.accent);
  ankle.position.set(0, 0.108, -0.014);
  const ankleSeal = part(new TorusGeometry(0.082, 0.012, 10, 28), p.rubber);
  ankleSeal.rotation.x = Math.PI / 2;
  ankleSeal.position.set(0, 0.174, -0.014);
  boot.add(sole, welt, shoe, toe, ankle, ankleSeal);
  const strapGeometry = roundedBox(0.155, 0.022, 0.036, 0.008);
  for (const z of [0.061, 0.106]) {
    const strap = part(strapGeometry, p.accent);
    strap.position.set(0, 0.081, z);
    boot.add(strap);
  }
  const treadGeometry = roundedBox(0.245, 0.012, 0.026, 0.004);
  for (let i = 0; i < 6; i++) {
    const tread = part(treadGeometry, p.dark);
    tread.position.set(0, -0.074, -0.067 + i * 0.058);
    boot.add(tread);
  }
  return { hip, thigh, knee, shin, boot };
}
