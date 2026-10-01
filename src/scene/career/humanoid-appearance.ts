import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Object3D,
} from "three";

const SHELL = "#f4efe5";
const ACCENT = "#d97824";
const DARK = "#10151d";
const GLOW = "#67e8f9";
const GLOW_EMISSIVE = "#22d3ee";
const UP = new Vector3(0, 1, 0);

export type ChibiBones = {
  head: Object3D;
  body: Object3D;
  shoulderL: Object3D;
  upperArmL: Object3D;
  lowerArmL: Object3D;
  palmL: Object3D;
  shoulderR: Object3D;
  upperArmR: Object3D;
  lowerArmR: Object3D;
  palmR: Object3D;
  upperLegL: Object3D;
  lowerLegL: Object3D;
  footL: Object3D;
  upperLegR: Object3D;
  lowerLegR: Object3D;
  footR: Object3D;
};

export type DynamicPart = { update(): void };

type Palette = {
  shell: MeshStandardMaterial;
  accent: MeshStandardMaterial;
  dark: MeshStandardMaterial;
  glow: MeshStandardMaterial;
  silver: MeshStandardMaterial;
};

function createPalette(): Palette {
  return {
    shell: new MeshStandardMaterial({ color: SHELL, emissive: "#241b12", emissiveIntensity: 0.05, metalness: 0.14, roughness: 0.34 }),
    accent: new MeshStandardMaterial({ color: ACCENT, metalness: 0.26, roughness: 0.32 }),
    dark: new MeshStandardMaterial({ color: DARK, metalness: 0.38, roughness: 0.28 }),
    glow: new MeshStandardMaterial({ color: GLOW, emissive: GLOW_EMISSIVE, emissiveIntensity: 3.8, metalness: 0.1, roughness: 0.12 }),
    silver: new MeshStandardMaterial({ color: "#b9d1d8", metalness: 0.65, roughness: 0.22 }),
  };
}

function part(geometry: BufferGeometry, material: MeshStandardMaterial): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Cancels RobotExpressive's baked ~37.6x bone scale so children use world-sized dimensions. */
function worldUnitWrap(bone: Object3D): Group {
  const scale = bone.getWorldScale(new Vector3()).x || 1;
  const wrap = new Group();
  wrap.scale.setScalar(1 / scale);
  bone.add(wrap);
  return wrap;
}

function createHead(p: Palette): Group {
  const head = new Group();
  head.name = "ChibiRobotHelmet";

  const shell = part(new CapsuleGeometry(0.28, 0.12, 8, 28), p.shell);
  shell.position.y = 0.13;
  shell.scale.set(1.36, 1, 0.92);
  head.add(shell);

  const rim = part(new SphereGeometry(0.34, 32, 22), p.accent);
  rim.position.set(0, 0.11, 0.23);
  rim.scale.set(1.12, 0.58, 0.5);
  head.add(rim);

  const visor = part(new SphereGeometry(0.33, 32, 22), p.dark);
  visor.position.set(0, 0.11, 0.27);
  visor.scale.set(1.05, 0.5, 0.5);
  head.add(visor);

  const eyeRingGeometry = new TorusGeometry(0.086, 0.026, 12, 24);
  const pupilGeometry = new CylinderGeometry(0.06, 0.06, 0.02, 24);
  for (const x of [-0.17, 0.17]) {
    const ring = part(eyeRingGeometry, p.silver);
    ring.position.set(x, 0.1, 0.425);
    const pupil = part(pupilGeometry, p.glow);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.set(x, 0.1, 0.44);
    head.add(ring, pupil);
  }

  const podGeometry = new SphereGeometry(0.105, 20, 16);
  const podCoreGeometry = new CylinderGeometry(0.055, 0.055, 0.04, 18);
  for (const side of [-1, 1]) {
    const pod = part(podGeometry, p.shell);
    pod.position.set(side * 0.405, 0.13, 0);
    pod.scale.x = 0.72;
    const core = part(podCoreGeometry, p.glow);
    core.rotation.z = Math.PI / 2;
    core.position.set(side * 0.47, 0.13, 0);
    head.add(pod, core);
  }

  const beaconGeometry = new SphereGeometry(0.035, 14, 10);
  for (const x of [-0.24, 0.24]) {
    const beacon = part(beaconGeometry, p.glow);
    beacon.position.set(x, 0.44, 0.02);
    head.add(beacon);
  }
  return head;
}

function createTorso(p: Palette): Group {
  const torso = new Group();
  torso.name = "ChibiRobotTorso";

  const waist = part(new SphereGeometry(0.25, 24, 18), p.dark);
  waist.position.y = 0.08;
  waist.scale.set(1, 0.42, 0.72);
  torso.add(waist);

  const shell = part(new SphereGeometry(0.34, 28, 22), p.shell);
  shell.position.set(0, 0.27, 0.01);
  shell.scale.set(0.84, 0.72, 0.64);
  torso.add(shell);

  const collar = part(new CylinderGeometry(0.22, 0.24, 0.075, 28), p.accent);
  collar.position.y = 0.49;
  torso.add(collar);

  const lowerTrim = part(new TorusGeometry(0.22, 0.032, 10, 28), p.accent);
  lowerTrim.rotation.x = Math.PI / 2;
  lowerTrim.position.set(0, 0.08, 0.02);
  torso.add(lowerTrim);

  const ventGeometry = new BoxGeometry(0.027, 0.052, 0.025);
  for (let index = 0; index < 4; index += 1) {
    const vent = part(ventGeometry, p.glow);
    vent.position.set(-0.115, 0.34 - index * 0.055, 0.218);
    vent.rotation.z = -0.16;
    torso.add(vent);
  }

  const spineGeometry = new BoxGeometry(0.042, 0.055, 0.025);
  for (let index = 0; index < 4; index += 1) {
    const spine = part(spineGeometry, index === 0 ? p.silver : p.glow);
    spine.position.set(0.025, 0.31 - index * 0.057, 0.222);
    torso.add(spine);
  }

  const buttonRing = part(new CylinderGeometry(0.055, 0.055, 0.026, 20), p.accent);
  buttonRing.rotation.x = Math.PI / 2;
  buttonRing.position.set(0.145, 0.34, 0.22);
  const button = part(new CylinderGeometry(0.027, 0.027, 0.032, 18), p.glow);
  button.rotation.x = Math.PI / 2;
  button.position.set(0.145, 0.34, 0.24);
  torso.add(buttonRing, button);
  return torso;
}

function addJoint(bone: Object3D, radius: number, material: MeshStandardMaterial, scale = new Vector3(1, 1, 1)): void {
  const wrap = worldUnitWrap(bone);
  const joint = part(new SphereGeometry(radius, 20, 16), material);
  joint.scale.copy(scale);
  wrap.add(joint);
}

function segment(parentBone: Object3D, targetBone: Object3D, geometry: BufferGeometry, material: MeshStandardMaterial, maxLength = Infinity): DynamicPart {
  const wrap = worldUnitWrap(parentBone);
  const mesh = part(geometry, material);
  wrap.add(mesh);
  const targetWorld = new Vector3();
  const localEnd = new Vector3();
  const direction = new Vector3();
  const update = (): void => {
    targetBone.getWorldPosition(targetWorld);
    localEnd.copy(targetWorld);
    wrap.worldToLocal(localEnd);
    const length = Math.min(localEnd.length(), maxLength);
    if (length <= 1e-5) return;
    direction.copy(localEnd).normalize();
    mesh.quaternion.setFromUnitVectors(UP, direction);
    mesh.position.copy(direction).multiplyScalar(length * 0.5);
    mesh.scale.y = length;
  };
  update();
  return { update };
}

function addHand(lowerArm: Object3D, palm: Object3D, p: Palette): DynamicPart {
  const wrap = worldUnitWrap(lowerArm);
  const hand = new Group();
  const cuff = part(new TorusGeometry(0.105, 0.025, 10, 22), p.accent);
  cuff.rotation.x = Math.PI / 2;
  const palmMesh = part(new SphereGeometry(0.105, 20, 16), p.dark);
  palmMesh.position.y = 0.055;
  palmMesh.scale.set(0.92, 1.15, 0.78);
  hand.add(cuff, palmMesh);
  wrap.add(hand);

  const palmWorld = new Vector3();
  const localPalm = new Vector3();
  const direction = new Vector3();
  const update = (): void => {
    palm.getWorldPosition(palmWorld);
    localPalm.copy(palmWorld);
    wrap.worldToLocal(localPalm);
    const length = Math.min(localPalm.length(), 0.27);
    if (length <= 1e-5) return;
    direction.copy(localPalm).normalize();
    hand.position.copy(direction).multiplyScalar(length);
    hand.quaternion.setFromUnitVectors(UP, direction);
  };
  update();
  return { update };
}

function addBoot(foot: Object3D, p: Palette): void {
  const wrap = worldUnitWrap(foot);
  const sole = part(new CapsuleGeometry(0.13, 0.1, 6, 20), p.dark);
  sole.position.set(0, 0.09, 0.055);
  sole.scale.set(1.22, 1, 0.42);
  const shell = part(new CapsuleGeometry(0.125, 0.08, 6, 20), p.shell);
  shell.position.set(0, 0.1, 0.105);
  shell.scale.set(1.15, 0.96, 0.64);
  const toe = part(new CapsuleGeometry(0.1, 0.07, 6, 18), p.accent);
  toe.position.set(0, 0.17, 0.125);
  toe.scale.set(1.18, 0.9, 0.72);
  const light = part(new BoxGeometry(0.11, 0.035, 0.022), p.glow);
  light.position.set(0, 0.27, 0.17);
  wrap.add(sole, shell, toe, light);
}

/** Attaches the complete chibi-robot shell while retaining the source skeleton and clips. */
export function attachChibiAppearance(b: ChibiBones): DynamicPart[] {
  const p = createPalette();
  const headWrap = worldUnitWrap(b.head);
  headWrap.add(createHead(p));
  const torsoWrap = worldUnitWrap(b.body);
  torsoWrap.add(createTorso(p));

  const upperArmGeometry = new CylinderGeometry(0.105, 0.13, 1, 20);
  const forearmGeometry = new CylinderGeometry(0.09, 0.11, 1, 20);
  const thighGeometry = new CylinderGeometry(0.125, 0.15, 1, 20);
  const shinGeometry = new CylinderGeometry(0.105, 0.13, 1, 20);
  const dynamic: DynamicPart[] = [];

  for (const [shoulder, upperArm, lowerArm, palm] of [
    [b.shoulderL, b.upperArmL, b.lowerArmL, b.palmL],
    [b.shoulderR, b.upperArmR, b.lowerArmR, b.palmR],
  ] as const) {
    addJoint(shoulder, 0.145, p.accent);
    dynamic.push(segment(upperArm, lowerArm, upperArmGeometry, p.shell, 0.28));
    addJoint(lowerArm, 0.105, p.dark);
    dynamic.push(segment(lowerArm, palm, forearmGeometry, p.shell, 0.235));
    dynamic.push(addHand(lowerArm, palm, p));
  }

  for (const [upperLeg, lowerLeg, foot] of [
    [b.upperLegL, b.lowerLegL, b.footL],
    [b.upperLegR, b.lowerLegR, b.footR],
  ] as const) {
    addJoint(upperLeg, 0.145, p.dark, new Vector3(1, 0.9, 0.82));
    dynamic.push(segment(upperLeg, lowerLeg, thighGeometry, p.shell));
    addJoint(lowerLeg, 0.13, p.dark);
    dynamic.push(segment(lowerLeg, foot, shinGeometry, p.shell));
    addBoot(foot, p);
  }
  return dynamic;
}
