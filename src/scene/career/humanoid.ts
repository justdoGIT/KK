import {
  AnimationMixer,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
  type AnimationAction,
  type Object3D,
} from "three";
import type { ModelInstance } from "./robot-model.ts";

export const HUMANOID_HEIGHT = 1.8;
/**
 * RobotExpressive's bind-pose height in model units, measured offline from the
 * mesh (skinned bounding boxes of the meshopt-quantised clone are unreliable).
 */
const HUMANOID_MODEL_HEIGHT = 4.79;
export const CAR_LENGTH = 4.3;

export type ClipName = "Idle" | "Walking" | "Running" | "Standing" | "Jump" | "Wave" | "ThumbsUp" | "Sitting";

/** Scroll-scrubbed animation state for a skinned humanoid (no wall-clock time). */
export type HumanoidRig = {
  /** Normalised wrapper: 1.8 m tall, facing +Z, feet at y = 0. */
  root: Group;
  mixer: AnimationMixer;
  actions: Map<string, AnimationAction>;
};

const humanoids = new WeakMap<ModelInstance, HumanoidRig>();

/** Original vehicle armour that turns the CC0 humanoid into a robot/car hybrid. */
function createVehicleArmor(): Group {
  const armor = new Group();
  armor.name = "VehicleArmor";
  const shell = new MeshPhysicalMaterial({
    color: "#071525",
    metalness: 0.86,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const accent = new MeshPhysicalMaterial({
    color: "#38bdf8",
    emissive: "#0c4a6e",
    emissiveIntensity: 1.2,
    metalness: 0.72,
    roughness: 0.2,
  });
  const rubber = new MeshStandardMaterial({ color: "#02040a", metalness: 0.35, roughness: 0.78 });
  const panel = (size: readonly [number, number, number], position: readonly [number, number, number], material = shell) => {
    const mesh = new Mesh(new BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    armor.add(mesh);
  };
  panel([0.54, 0.29, 0.12], [0, 1.21, 0.14]);
  panel([0.7, 0.08, 0.18], [0, 1.37, -0.08], accent);
  panel([0.3, 0.12, 0.16], [0, 1.5, 0.07], accent);
  panel([0.22, 0.2, 0.24], [-0.42, 1.25, 0.02]);
  panel([0.22, 0.2, 0.24], [0.42, 1.25, 0.02]);
  panel([0.17, 0.34, 0.1], [-0.2, 0.5, 0.12]);
  panel([0.17, 0.34, 0.1], [0.2, 0.5, 0.12]);
  for (const [x, y] of [
    [-0.3, 1.12],
    [0.3, 1.12],
    [-0.23, 0.35],
    [0.23, 0.35],
  ] as const) {
    const wheel = new Mesh(new CylinderGeometry(0.115, 0.115, 0.09, 24), rubber);
    wheel.position.set(x, y, -0.04);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    armor.add(wheel);
  }
  return armor;
}


export function humanoidRigFor(instance: ModelInstance): HumanoidRig {
  const cached = humanoids.get(instance);
  if (cached) return cached;
  const root = new Group();
  instance.scene.scale.setScalar(HUMANOID_HEIGHT / HUMANOID_MODEL_HEIGHT);
  root.add(instance.scene);
  root.add(createVehicleArmor());
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

/** Normalised, theme-painted sports car with its wheel pivots. */
export type CarRig = { root: Group; wheels: Object3D[] };

const cars = new WeakMap<ModelInstance, CarRig>();

export function carRigFor(instance: ModelInstance): CarRig {
  const cached = cars.get(instance);
  if (cached) return cached;
  const root = new Group();
  instance.scene.updateWorldMatrix(true, true);
  const size = new Box3().setFromObject(instance.scene).getSize(new Vector3());
  instance.scene.scale.setScalar(CAR_LENGTH / (size.z || 1));
  root.add(instance.scene);
  const wheels = new Set<Object3D>();
  instance.scene.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    if (/Wheel/i.test(mesh.name) && mesh.parent) wheels.add(mesh.parent.name ? mesh.parent : mesh);
    const material = mesh.material as MeshStandardMaterial;
    const painted = material.clone();
    if (material.name === "White") {
      painted.color.set("#0b1220");
      painted.metalness = 0.85;
      painted.roughness = 0.28;
    } else if (material.name === "Grey") {
      painted.color.set("#38bdf8");
      painted.metalness = 0.6;
      painted.roughness = 0.35;
    } else if (material.name === "Windows") {
      painted.color.set("#020617");
      painted.metalness = 0.9;
      painted.roughness = 0.08;
    } else if (material.name === "Headlights") {
      painted.emissive.set("#e0f2fe");
      painted.emissiveIntensity = 3;
      painted.toneMapped = false;
    } else if (material.name === "TailLights") {
      painted.emissive.set("#f43f5e");
      painted.emissiveIntensity = 2.5;
      painted.toneMapped = false;
    }
    mesh.material = painted;
  });
  const rig = { root, wheels: [...wheels] };
  cars.set(instance, rig);
  return rig;
}

export function spinCarWheels(car: CarRig, angle: number): void {
  for (const wheel of car.wheels) wheel.rotation.x = angle;
}
