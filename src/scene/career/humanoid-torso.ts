import { CylinderGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry, TorusGeometry } from "three";
import { part, roundedBox, type ChibiPalette } from "./humanoid-surfaces.ts";

/** Hip-relative armored chest; the two chest plates frame a recessed coolant spine. */
export function createChibiTorso(p: ChibiPalette): Group {
  const torso = new Group();
  torso.name = "ChibiRobotTorso";
  const core = part(new SphereGeometry(0.26, 32, 24), p.dark);
  core.position.set(0, 0.25, -0.012);
  core.scale.set(1.02, 0.95, 0.7);
  torso.add(core);

  const collar = part(new CylinderGeometry(0.18, 0.205, 0.085, 32), p.accent);
  collar.position.set(0, 0.485, 0);
  const neck = part(new CylinderGeometry(0.125, 0.14, 0.13, 28), p.rubber);
  neck.position.y = 0.56;
  torso.add(collar, neck);

  const chest = new Shape();
  chest.moveTo(0.045, 0.435);
  chest.quadraticCurveTo(0.15, 0.45, 0.228, 0.49);
  chest.quadraticCurveTo(0.275, 0.42, 0.246, 0.29);
  chest.quadraticCurveTo(0.23, 0.2, 0.115, 0.1);
  chest.quadraticCurveTo(0.065, 0.075, 0.027, 0.13);
  chest.lineTo(0.045, 0.435);
  const plateGeometry = new ExtrudeGeometry(chest, { depth: 0.055, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.018, bevelThickness: 0.025, curveSegments: 14 });
  const trimGeometry = new ExtrudeGeometry(chest, { depth: 0.016, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.024, bevelThickness: 0.012, curveSegments: 14 });
  for (const side of [-1, 1]) {
    const trim = part(trimGeometry, p.accent);
    trim.scale.x = side;
    trim.position.z = 0.12;
    const plate = part(plateGeometry, p.shell);
    plate.scale.x = side;
    plate.position.z = 0.145;
    torso.add(trim, plate);
  }

  const spine = part(roundedBox(0.065, 0.29, 0.035, 0.012), p.rubber);
  spine.position.set(0, 0.29, 0.195);
  torso.add(spine);
  const slatGeometry = roundedBox(0.042, 0.031, 0.022, 0.006);
  for (let i = 0; i < 6; i++) {
    const slat = part(slatGeometry, p.cyan);
    slat.position.set(0, 0.394 - i * 0.04, 0.215);
    slat.rotation.x = -0.13;
    torso.add(slat);
  }

  const grilleGeometry = roundedBox(0.042, 0.012, 0.012, 0.004);
  for (let i = 0; i < 4; i++) {
    const grille = part(grilleGeometry, p.cyan);
    grille.position.set(-0.16, 0.406 - i * 0.024, 0.229);
    grille.rotation.z = -0.22;
    torso.add(grille);
  }
  const badge = part(roundedBox(0.046, 0.049, 0.015, 0.012), p.cyan);
  badge.position.set(-0.069, 0.395, 0.23);
  const badgeInset = part(roundedBox(0.03, 0.034, 0.01, 0.007), p.shell);
  badgeInset.position.set(-0.069, 0.397, 0.24);
  torso.add(badge, badgeInset);

  const socket = part(new CylinderGeometry(0.041, 0.041, 0.018, 28), p.dark);
  socket.rotation.x = Math.PI / 2;
  socket.position.set(0.146, 0.365, 0.238);
  const rim = part(new TorusGeometry(0.031, 0.006, 8, 28), p.silver);
  rim.position.set(0.146, 0.365, 0.25);
  const lamp = part(new SphereGeometry(0.022, 20, 14), p.lens);
  lamp.scale.z = 0.4;
  lamp.position.set(0.146, 0.365, 0.251);
  const pupil = part(new SphereGeometry(0.012, 16, 12), p.glow);
  pupil.scale.z = 0.35;
  pupil.position.set(0.146, 0.365, 0.26);
  torso.add(socket, rim, lamp, pupil);

  const pelvis = part(roundedBox(0.3, 0.15, 0.25, 0.055), p.shell);
  pelvis.position.set(0, 0.045, 0.015);
  const belt = part(roundedBox(0.33, 0.065, 0.25, 0.023), p.dark);
  belt.position.set(0, 0.099, -0.023);
  const buckle = part(roundedBox(0.09, 0.055, 0.02, 0.01), p.accent);
  buckle.position.set(0, 0.078, 0.148);
  torso.add(pelvis, belt, buckle);

  const backpack = part(roundedBox(0.29, 0.33, 0.13, 0.045), p.shell);
  backpack.position.set(0, 0.285, -0.196);
  const battery = part(roundedBox(0.22, 0.22, 0.055, 0.022), p.accent);
  battery.position.set(0, 0.28, -0.269);
  torso.add(backpack, battery);
  const backVentGeometry = roundedBox(0.14, 0.014, 0.012, 0.004);
  for (let i = 0; i < 4; i++) {
    const vent = part(backVentGeometry, p.dark);
    vent.position.set(0, 0.33 - i * 0.036, -0.3);
    torso.add(vent);
  }
  return torso;
}
