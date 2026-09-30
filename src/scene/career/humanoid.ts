import {
  AnimationMixer,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
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
      color: "#38bdf8",
      emissive: "#06233a",
      emissiveIntensity: 0.32,
      metalness: 0.85,
      roughness: 0.22,
    };
  }
  if (name === "Grey") {
    return {
      color: "#eef8ff",
      emissive: "#0b1c2b",
      emissiveIntensity: 0.12,
      metalness: 0.55,
      roughness: 0.26,
    };
  }
  return {
    color: "#06111f",
    emissive: "#020711",
    emissiveIntensity: 0.18,
    metalness: 0.88,
    roughness: 0.15,
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
      material.envMapIntensity = 1.8;
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

/** Modern aerodynamic cybernetic humanoid head with obsidian visor and LiDAR strip. */
function createModernCyberneticHead(): Group {
  const headGroup = new Group();
  headGroup.name = "ModernCyberneticHead";

  // 1. Sleek aerodynamic helmet shell
  const craniumGeom = new BoxGeometry(0.72, 0.78, 0.82);
  const craniumMat = new MeshStandardMaterial({
    color: "#0a121e",
    emissive: "#040b15",
    emissiveIntensity: 0.2,
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 1.8,
  });
  const cranium = new Mesh(craniumGeom, craniumMat);
  cranium.position.set(0, 0.12, -0.04);
  headGroup.add(cranium);

  // 2. High-gloss curved obsidian visor faceplate
  const visorGeom = new BoxGeometry(0.68, 0.42, 0.22);
  const visorMat = new MeshStandardMaterial({
    color: "#010409",
    emissive: "#020712",
    emissiveIntensity: 0.1,
    metalness: 0.98,
    roughness: 0.04,
    envMapIntensity: 2.2,
  });
  const visor = new Mesh(visorGeom, visorMat);
  visor.position.set(0, 0.08, 0.38);
  headGroup.add(visor);

  // 3. Glowing neon cyan LiDAR / optical sensor aperture band
  const lidarGeom = new BoxGeometry(0.62, 0.07, 0.04);
  const lidarMat = new MeshStandardMaterial({
    color: "#38bdf8",
    emissive: "#00f0ff",
    emissiveIntensity: 3.2,
    metalness: 0.2,
    roughness: 0.1,
  });
  const lidar = new Mesh(lidarGeom, lidarMat);
  lidar.position.set(0, 0.1, 0.5);
  headGroup.add(lidar);

  // 4. Lateral spatial audio/telemetry sensor pods (temples)
  const podGeom = new CylinderGeometry(0.14, 0.14, 0.12, 16);
  podGeom.rotateZ(Math.PI / 2);
  const podMat = new MeshStandardMaterial({
    color: "#1e293b",
    metalness: 0.85,
    roughness: 0.25,
  });
  const podL = new Mesh(podGeom, podMat);
  podL.position.set(-0.42, 0.1, 0.05);
  const podR = new Mesh(podGeom, podMat);
  podR.position.set(0.42, 0.1, 0.05);
  headGroup.add(podL, podR);

  // 5. Lateral glowing cyan indicator nodes
  const nodeGeom = new CylinderGeometry(0.04, 0.04, 0.04, 12);
  nodeGeom.rotateZ(Math.PI / 2);
  const nodeMat = new MeshStandardMaterial({
    color: "#38bdf8",
    emissive: "#38bdf8",
    emissiveIntensity: 2.5,
  });
  const nodeL = new Mesh(nodeGeom, nodeMat);
  nodeL.position.set(-0.48, 0.1, 0.05);
  const nodeR = new Mesh(nodeGeom, nodeMat);
  nodeR.position.set(0.48, 0.1, 0.05);
  headGroup.add(nodeL, nodeR);

  // 6. Chin / jaw intake vent
  const jawGeom = new BoxGeometry(0.46, 0.18, 0.28);
  const jaw = new Mesh(jawGeom, craniumMat);
  jaw.position.set(0, -0.22, 0.26);
  headGroup.add(jaw);

  return headGroup;
}

/** Modern cybernetic chest armor plate with quantum reactor core node. */
function createModernTorsoCore(): Group {
  const torsoGroup = new Group();
  torsoGroup.name = "ModernTorsoCore";

  // 1. Pectoral armor reinforcement plate
  const plateGeom = new BoxGeometry(0.92, 0.55, 0.18);
  const plateMat = new MeshStandardMaterial({
    color: "#0a1322",
    emissive: "#040b15",
    emissiveIntensity: 0.15,
    metalness: 0.9,
    roughness: 0.22,
  });
  const plate = new Mesh(plateGeom, plateMat);
  plate.position.set(0, 0.08, 0.42);
  torsoGroup.add(plate);

  // 2. Central quantum power reactor core node
  const coreGeom = new CylinderGeometry(0.14, 0.14, 0.06, 24);
  coreGeom.rotateX(Math.PI / 2);
  const coreMat = new MeshStandardMaterial({
    color: "#38bdf8",
    emissive: "#00f0ff",
    emissiveIntensity: 3.0,
    metalness: 0.4,
    roughness: 0.15,
  });
  const core = new Mesh(coreGeom, coreMat);
  core.position.set(0, 0.12, 0.52);
  torsoGroup.add(core);

  // 3. Glowing ring around power core
  const ringGeom = new TorusGeometry(0.18, 0.02, 12, 32);
  const ringMat = new MeshStandardMaterial({
    color: "#0284c7",
    emissive: "#38bdf8",
    emissiveIntensity: 2.2,
  });
  const ring = new Mesh(ringGeom, ringMat);
  ring.position.set(0, 0.12, 0.52);
  torsoGroup.add(ring);

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
    (headBone as Object3D).add(createModernCyberneticHead());
  }
  if (torsoBone) {
    (torsoBone as Object3D).add(createModernTorsoCore());
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
