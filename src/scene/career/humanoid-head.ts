import {
  CapsuleGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { part, wrapOnSphere, type ChibiPalette } from "./humanoid-surfaces.ts";

/** Helmet sphere radius; the dome and everything wrapped onto it share its centre and squash. */
const DOME_RADIUS = 0.42;
const DOME_CENTRE_Y = 0.3;
const DOME_SQUASH = [1.07, 0.94, 1] as const;
/** Visor as arc lengths on the dome: centreline size, corner radius, and vertical offset. */
const VISOR_WIDTH = 0.74;
const VISOR_HEIGHT = 0.31;
const VISOR_CORNER = 0.1;
const VISOR_LIFT = -0.03;
/** Eye centres along the visor (arc length either side of centre). */
const EYE_SPREAD = 0.165;

const FORWARD = new Vector3(0, 0, 1);
const UP = new Vector3(0, 1, 0);

/** Point and outward normal on the dome sphere for an arc-length offset (x, y) and height above it. */
function onDome(x: number, y: number, height: number): { at: Vector3; normal: Vector3 } {
  const lon = x / DOME_RADIUS;
  const lat = y / DOME_RADIUS;
  const normal = new Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  return { at: normal.clone().multiplyScalar(DOME_RADIUS + height), normal };
}

/** Closed rounded-rectangle outline (arc-length coordinates), lifted `height` off the surface. */
function visorOutline(height: number): CatmullRomCurve3 {
  const points: Vector3[] = [];
  const halfW = VISOR_WIDTH / 2 - VISOR_CORNER;
  const halfH = VISOR_HEIGHT / 2 - VISOR_CORNER;
  const corners: readonly (readonly [number, number, number])[] = [
    [halfW, halfH, 0],
    [-halfW, halfH, Math.PI / 2],
    [-halfW, -halfH, Math.PI],
    [halfW, -halfH, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= 8; i += 1) {
      const a = start + (i / 8) * (Math.PI / 2);
      points.push(new Vector3(cx + Math.cos(a) * VISOR_CORNER, VISOR_LIFT + cy + Math.sin(a) * VISOR_CORNER, height));
    }
  }
  return new CatmullRomCurve3(points, true, "centripetal");
}

/** Big round eye: dark socket, cyan halo and iris, a blooming core, and a glint. */
function createEye(p: ChibiPalette): Group {
  const eye = new Group();
  const disc = (radius: number, depth: number, z: number, material: ChibiPalette[keyof ChibiPalette]) => {
    const mesh = part(new CylinderGeometry(radius, radius, depth, 48), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = z;
    eye.add(mesh);
  };
  disc(0.1, 0.012, 0.004, p.dark);
  disc(0.074, 0.01, 0.011, p.cyan);
  const halo = part(new TorusGeometry(0.086, 0.011, 12, 48), p.cyan);
  halo.position.z = 0.012;
  const core = part(new SphereGeometry(0.047, 32, 16), p.glow);
  core.scale.z = 0.35;
  core.position.z = 0.017;
  const glint = part(new SphereGeometry(0.013, 12, 8), p.shell);
  glint.scale.z = 0.3;
  glint.position.set(-0.027, 0.03, 0.024);
  eye.add(halo, core, glint);
  return eye;
}

/**
 * Glossy round dome helmet in head-bone space (+Y up, +Z toward the camera):
 * an orange visor frame wrapping the front of the sphere around recessed black
 * glass, two big glowing cyan eyes, cylindrical ear pods with light rings, and
 * a pair of cyan crown nubs, after the reference toy robot.
 */
export function createChibiHead(p: ChibiPalette): Group {
  const head = new Group();
  head.name = "ChibiRobotHead";

  // Everything on the dome shares its centre and squash so wrapped parts hug it.
  const shell = new Group();
  shell.position.y = DOME_CENTRE_Y;
  shell.scale.set(...DOME_SQUASH);
  head.add(shell);

  const dome = part(new SphereGeometry(DOME_RADIUS, 64, 48), p.shell);
  dome.name = "HelmetDome";
  shell.add(dome);

  const frame = part(wrapOnSphere(new TubeGeometry(visorOutline(0.014), 240, 0.033, 14, true), DOME_RADIUS), p.accent);
  frame.name = "VisorFrame";
  const glass = part(
    wrapOnSphere(new PlaneGeometry(VISOR_WIDTH - 0.02, VISOR_HEIGHT - 0.02, 48, 16).translate(0, VISOR_LIFT, 0.007), DOME_RADIUS),
    p.visor,
  );
  glass.name = "VisorGlass";
  shell.add(frame, glass);

  for (const side of [-1, 1]) {
    const { at, normal } = onDome(side * EYE_SPREAD, VISOR_LIFT - 0.005, 0.008);
    const eye = createEye(p);
    eye.name = "LuminousEye";
    eye.position.copy(at);
    eye.quaternion.copy(new Quaternion().setFromUnitVectors(FORWARD, normal));
    shell.add(eye);

    const nub = onDome(side * 0.21, 0.31, 0.012);
    const antenna = part(new CapsuleGeometry(0.026, 0.035, 8, 16), p.cyan);
    antenna.position.copy(nub.at);
    antenna.quaternion.copy(new Quaternion().setFromUnitVectors(UP, nub.normal));
    shell.add(antenna);
  }

  // Slim vent slot above the visor, lying on the dome.
  const slot = part(wrapOnSphere(new CapsuleGeometry(0.013, 0.09, 6, 12, 8).rotateZ(Math.PI / 2).translate(0, 0.205, 0.004), DOME_RADIUS), p.dark);
  shell.add(slot);

  // Orange rim and black seal where the helmet meets the neck.
  const rimLat = -0.98;
  const rim = part(new TorusGeometry(DOME_RADIUS * Math.cos(rimLat), 0.022, 12, 64), p.accent);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = DOME_RADIUS * Math.sin(rimLat);
  shell.add(rim);
  const seal = part(new TorusGeometry(0.19, 0.045, 16, 48), p.rubber);
  seal.rotation.x = Math.PI / 2;
  seal.position.y = DOME_CENTRE_Y - DOME_RADIUS * DOME_SQUASH[1] + 0.03;
  head.add(seal);

  for (const side of [-1, 1]) {
    const pod = new Group();
    pod.position.set(side * (DOME_RADIUS * DOME_SQUASH[0] + 0.012), DOME_CENTRE_Y + VISOR_LIFT, 0.01);
    pod.rotation.z = (side * Math.PI) / 2;
    const cup = part(new CylinderGeometry(0.1, 0.112, 0.085, 48), p.shell);
    const band = part(new TorusGeometry(0.104, 0.02, 12, 48), p.accent);
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.03;
    const ring = part(new TorusGeometry(0.06, 0.013, 12, 40), p.glow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.045;
    const cap = part(new CylinderGeometry(0.045, 0.045, 0.012, 32), p.dark);
    cap.position.y = -0.046;
    pod.add(cup, band, ring, cap);
    head.add(pod);
  }

  return head;
}
