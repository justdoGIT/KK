import {
  AnimationMixer,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type AnimationAction,
  type Material,
  type Object3D,
} from "three";
import type { ModelInstance } from "./robot-model.ts";

export const HUMANOID_HEIGHT = 1.8;
/**
 * RobotExpressive's bind-pose height in model units, measured offline from the
 * mesh (skinned bounding boxes of the meshopt-quantised clone are unreliable).
 */
const HUMANOID_MODEL_HEIGHT = 4.79;

type HumanoidMaterialStyle = {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
};

export function humanoidMaterialStyle(name: string): HumanoidMaterialStyle {
  if (name === "Main") {
    return {
      color: "#f6f1e7",
      emissive: "#2a2014",
      emissiveIntensity: 0.05,
      metalness: 0.12,
      roughness: 0.42,
    };
  }
  if (name === "Grey") {
    return {
      color: "#e0812f",
      emissive: "#180d03",
      emissiveIntensity: 0.05,
      metalness: 0.2,
      roughness: 0.45,
    };
  }
  return {
    color: "#15151d",
    emissive: "#050509",
    emissiveIntensity: 0.1,
    metalness: 0.3,
    roughness: 0.4,
  };
}

function modernizeHumanoidMaterials(root: Object3D): void {
  const styled = new Map<Material, Material>();
  const styleMaterial = (source: Material): Material => {
    const cached = styled.get(source);
    if (cached) return cached;
    const material = source.clone();
    if (material instanceof MeshStandardMaterial) {
      const style = humanoidMaterialStyle(material.name);
      material.color.set(style.color);
      material.emissive.set(style.emissive);
      material.emissiveIntensity = style.emissiveIntensity;
      material.metalness = style.metalness;
      material.roughness = style.roughness;
      material.envMapIntensity = 1.4;
    }
    styled.set(source, material);
    return material;
  };

  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.material = Array.isArray(node.material)
      ? node.material.map(styleMaterial)
      : styleMaterial(node.material);
  });
}

/** Chibi astronaut head: rounded cream dome helmet, orange collar trim, big glowing cyan eyes. */
function createChibiAstronautHead(): Group {
  const headGroup = new Group();
  headGroup.name = "ChibiAstronautHead";

  // 1. Rounded cream helmet dome
  const domeGeom = new SphereGeometry(0.46, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const domeMat = new MeshStandardMaterial({
    color: "#f6f1e7",
    emissive: "#2a2014",
    emissiveIntensity: 0.05,
    metalness: 0.12,
    roughness: 0.38,
    envMapIntensity: 1.3,
  });
  const dome = new Mesh(domeGeom, domeMat);
  dome.position.set(0, 0.2, -0.02);
  headGroup.add(dome);

  // 2. Orange collar trim band at the helmet's base
  const collarGeom = new CylinderGeometry(0.46, 0.44, 0.1, 28);
  const collarMat = new MeshStandardMaterial({
    color: "#e0812f",
    metalness: 0.22,
    roughness: 0.42,
  });
  const collar = new Mesh(collarGeom, collarMat);
  collar.position.set(0, -0.02, -0.02);
  headGroup.add(collar);

  // 3. Dark rounded face visor recess (where the glowing eyes sit)
  const faceGeom = new SphereGeometry(0.36, 24, 18, -Math.PI * 0.34, Math.PI * 0.68, Math.PI * 0.26, Math.PI * 0.48);
  const faceMat = new MeshStandardMaterial({
    color: "#15151d",
    metalness: 0.35,
    roughness: 0.5,
  });
  const face = new Mesh(faceGeom, faceMat);
  face.position.set(0, 0.13, 0.03);
  headGroup.add(face);

  // 4. Big glowing round cyan eyes
  const eyeGeom = new SphereGeometry(0.1, 20, 16);
  const eyeMat = new MeshStandardMaterial({
    color: "#7dd3fc",
    emissive: "#38bdf8",
    emissiveIntensity: 3.4,
    metalness: 0.1,
    roughness: 0.12,
  });
  const eyeL = new Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.15, 0.15, 0.31);
  const eyeR = new Mesh(eyeGeom, eyeMat);
  eyeR.position.set(0.15, 0.15, 0.31);
  headGroup.add(eyeL, eyeR);

  // 5. Small orange antenna pods at the temples
  const podGeom = new SphereGeometry(0.07, 16, 14);
  const podMat = collarMat;
  const podL = new Mesh(podGeom, podMat);
  podL.position.set(-0.46, 0.22, 0.02);
  const podR = new Mesh(podGeom, podMat);
  podR.position.set(0.46, 0.22, 0.02);
  headGroup.add(podL, podR);

  return headGroup;
}

/** Chibi astronaut chest: rounded cream shell, orange belt stripe, glowing cyan core button. */
function createChibiAstronautTorso(): Group {
  const torsoGroup = new Group();
  torsoGroup.name = "ChibiAstronautTorso";

  // 1. Rounded cream chest shell overlay
  const shellGeom = new SphereGeometry(0.5, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const shellMat = new MeshStandardMaterial({
    color: "#f6f1e7",
    metalness: 0.12,
    roughness: 0.4,
  });
  const shell = new Mesh(shellGeom, shellMat);
  shell.rotation.x = Math.PI;
  shell.position.set(0, 0.12, 0.05);
  torsoGroup.add(shell);

  // 2. Orange belt stripe
  const stripeGeom = new BoxGeometry(0.5, 0.14, 0.14);
  const stripeMat = new MeshStandardMaterial({
    color: "#e0812f",
    metalness: 0.2,
    roughness: 0.42,
  });
  const stripe = new Mesh(stripeGeom, stripeMat);
  stripe.position.set(0, 0.04, 0.42);
  torsoGroup.add(stripe);

  // 3. Glowing cyan chest core button
  const coreGeom = new CylinderGeometry(0.09, 0.09, 0.05, 20);
  coreGeom.rotateX(Math.PI / 2);
  const coreMat = new MeshStandardMaterial({
    color: "#7dd3fc",
    emissive: "#38bdf8",
    emissiveIntensity: 3.0,
    metalness: 0.15,
    roughness: 0.15,
  });
  const core = new Mesh(coreGeom, coreMat);
  core.position.set(0, 0.24, 0.45);
  torsoGroup.add(core);

  return torsoGroup;
}

export type ClipName = "Idle" | "Walking" | "Running" | "Standing" | "Jump" | "Wave" | "ThumbsUp" | "Sitting";

/** Scroll-scrubbed animation state for a skinned humanoid (no wall-clock time). */
export type HumanoidRig = {
  /** Normalised wrapper: 1.8 m tall, facing +Z, feet at y = 0. */
  root: Group;
  mixer: AnimationMixer;
  actions: Map<string, AnimationAction>;
};

const humanoids = new WeakMap<ModelInstance, HumanoidRig>();

export function humanoidRigFor(instance: ModelInstance): HumanoidRig {
  const cached = humanoids.get(instance);
  if (cached) return cached;
  const root = new Group();
  instance.scene.scale.setScalar(HUMANOID_HEIGHT / HUMANOID_MODEL_HEIGHT);
  modernizeHumanoidMaterials(instance.scene);

  // Replace cartoon head with sleek cybernetic humanoid artifact
  let headBone: Object3D | null = null;
  let torsoBone: Object3D | null = null;

  instance.scene.traverse((node) => {
    if (node instanceof Mesh && node.name.startsWith("Head")) {
      node.visible = false;
    }
    if (!headBone && node.name === "Head" && !(node instanceof Mesh)) {
      headBone = node;
    }
    if (!torsoBone && node.name === "Torso" && !(node instanceof Mesh)) {
      torsoBone = node;
    }
  });

  if (headBone) {
    (headBone as Object3D).add(createChibiAstronautHead());
  }
  if (torsoBone) {
    (torsoBone as Object3D).add(createChibiAstronautTorso());
  }

  root.add(instance.scene);
  const mixer = new AnimationMixer(instance.scene);
  const actions = new Map<string, AnimationAction>();
  for (const clip of instance.animations) {
    const action = mixer.clipAction(clip);
    action.play();
    action.setEffectiveWeight(0);
    actions.set(clip.name, action);
  }
  const rig = { root, mixer, actions };
  humanoids.set(instance, rig);
  return rig;
}

/**
 * Samples clips at explicit times with explicit weights, then evaluates the
 * mixer without advancing time, so the pose is a pure function of scroll.
 */
export function poseHumanoid(rig: HumanoidRig, samples: readonly [ClipName, number, number][]): void {
  for (const action of rig.actions.values()) action.setEffectiveWeight(0);
  for (const [name, time, weight] of samples) {
    const action = rig.actions.get(name);
    if (!action) continue;
    action.time = time % action.getClip().duration;
    action.setEffectiveWeight(weight);
  }
  rig.mixer.update(0);
  rig.root.updateWorldMatrix(true, true);
}

export function clipDuration(rig: HumanoidRig, name: ClipName): number {
  return rig.actions.get(name)?.getClip().duration ?? 1;
}
