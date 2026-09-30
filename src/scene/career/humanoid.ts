import {
  AnimationMixer,
  Group,
  Mesh,
  MeshStandardMaterial,
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
      metalness: 0.58,
      roughness: 0.24,
    };
  }
  if (name === "Grey") {
    return {
      color: "#eef8ff",
      emissive: "#0b1c2b",
      emissiveIntensity: 0.12,
      metalness: 0.42,
      roughness: 0.3,
    };
  }
  return {
    color: "#06111f",
    emissive: "#020711",
    emissiveIntensity: 0.18,
    metalness: 0.7,
    roughness: 0.16,
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
      material.envMapIntensity = 1.6;
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
