import { Group, SphereGeometry, TorusGeometry } from "three";
import { part, roundedBox, type ChibiPalette } from "./humanoid-surfaces.ts";

/**
 * Oversized closed helmet in head-bone space.
 * +Y is up and +Z faces the camera in the source rig's neutral frame.
 */
export function createChibiHead(p: ChibiPalette): Group {
  const head = new Group();
  head.name = "ChibiRobotHead";

  const dome = part(roundedBox(0.93, 0.7, 0.68, 0.18), p.shell);
  dome.name = "HelmetDome";
  dome.position.set(0, 0.29, -0.015);
  head.add(dome);

  const crown = part(roundedBox(0.52, 0.075, 0.59, 0.035), p.accent);
  crown.position.set(0, 0.595, -0.005);
  head.add(crown);

  const jaw = part(roundedBox(0.72, 0.16, 0.6, 0.075), p.shell);
  jaw.position.set(0, 0, 0.02);
  head.add(jaw);

  const chin = part(roundedBox(0.38, 0.085, 0.54, 0.035), p.accent);
  chin.position.set(0, -0.035, 0.035);
  head.add(chin);

  // The orange surround sits forward of the shell; the dark glass and eyes
  // remain recessed inside it instead of reading as stickers on the dome.
  const bezel = part(roundedBox(0.79, 0.38, 0.12, 0.09), p.accent);
  bezel.name = "VisorBezel";
  bezel.position.set(0, 0.265, 0.3);
  head.add(bezel);

  const visor = part(roundedBox(0.66, 0.285, 0.075, 0.075), p.visor);
  visor.name = "VisorGlass";
  visor.position.set(0, 0.27, 0.343);
  head.add(visor);

  const brow = part(roundedBox(0.49, 0.028, 0.025, 0.012), p.dark);
  brow.position.set(0, 0.374, 0.386);
  head.add(brow);

  for (const x of [-0.17, 0.17]) {
    const eye = new Group();
    eye.position.set(x, 0.268, 0.386);

    const ring = part(new TorusGeometry(0.085, 0.019, 10, 30), p.cyan);
    ring.name = "LuminousEyeRing";
    eye.add(ring);

    const iris = part(new SphereGeometry(0.064, 24, 16), p.lens);
    iris.scale.set(1, 0.92, 0.13);
    iris.position.z = -0.008;
    eye.add(iris);

    const pupil = part(new SphereGeometry(0.031, 20, 12), p.dark);
    pupil.scale.set(1, 0.88, 0.1);
    pupil.position.z = 0.003;
    eye.add(pupil);

    const glint = part(new SphereGeometry(0.013, 12, 8), p.silver);
    glint.scale.z = 0.16;
    glint.position.set(-0.019, 0.024, 0.013);
    eye.add(glint);
    head.add(eye);
  }

  for (const side of [-1, 1]) {
    const ear = part(roundedBox(0.105, 0.2, 0.22, 0.05), p.accent);
    ear.position.set(side * 0.475, 0.22, 0.02);
    head.add(ear);

    const earInset = part(roundedBox(0.032, 0.105, 0.13, 0.012), p.dark);
    earInset.position.set(side * 0.526, 0.22, 0.02);
    head.add(earInset);

    const cheek = part(roundedBox(0.08, 0.15, 0.16, 0.035), p.shell);
    cheek.position.set(side * 0.4, 0.06, 0.255);
    head.add(cheek);
  }

  const topVentGeometry = roundedBox(0.075, 0.022, 0.12, 0.009);
  for (const x of [-0.11, 0, 0.11]) {
    const vent = part(topVentGeometry, p.dark);
    vent.position.set(x, 0.647, -0.03);
    head.add(vent);
  }

  return head;
}
