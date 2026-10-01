import {
  AnimationMixer,
  Group,
  Mesh,
  type AnimationAction,
  type Object3D,
} from "three";
import { attachChibiAppearance, type DynamicPart } from "./humanoid-appearance.ts";
import type { ModelInstance } from "./robot-model.ts";

export const HUMANOID_HEIGHT = 1.8;
/**
 * RobotExpressive's bind-pose height in model units, measured offline from the
 * mesh (skinned bounding boxes of the meshopt-quantised clone are unreliable).
 */
const HUMANOID_MODEL_HEIGHT = 4.79;


export type ClipName = "Idle" | "Walking" | "Running" | "Standing" | "Jump" | "Wave" | "ThumbsUp" | "Sitting";

/** Scroll-scrubbed animation state for a skinned humanoid (no wall-clock time). */
export type HumanoidRig = {
  /** Normalised wrapper: 1.8 m tall, facing +Z, feet at y = 0. */
  root: Group;
  mixer: AnimationMixer;
  actions: Map<string, AnimationAction>;
  /** Limb/foot parts that must be re-oriented every frame — see `DynamicPart`. */
  dynamicParts: DynamicPart[];
};

const humanoids = new WeakMap<ModelInstance, HumanoidRig>();

/**
 * Builds a procedural chibi robot on RobotExpressive's animation skeleton.
 * The complete source mesh is hidden, including the asset's detached
 * shoulder-height HandL/HandR groups. `attachChibiAppearance` cancels the
 * skeleton's baked ~37.6x scale and supplies the visible helmet, body and
 * articulated limbs in world-sized dimensions.
 */
export function humanoidRigFor(instance: ModelInstance): HumanoidRig {
  const cached = humanoids.get(instance);
  if (cached) return cached;
  const root = new Group();
  instance.scene.scale.setScalar(HUMANOID_HEIGHT / HUMANOID_MODEL_HEIGHT);
  instance.scene.updateMatrixWorld(true);

  const bones: Record<string, Object3D> = {};
  instance.scene.traverse((node) => {
    if (node instanceof Mesh) {
      node.visible = false;
      return;
    }
    bones[node.name] = node;
  });

  const need = (name: string): Object3D => {
    const bone = bones[name];
    if (!bone) throw new Error(`humanoid rig: missing bone "${name}"`);
    return bone;
  };

  const head = need("Head");
  const body = need("Body");
  const shoulderL = need("ShoulderL");
  const upperArmL = need("UpperArmL");
  const lowerArmL = need("LowerArmL");
  const palmL = need("Palm2L");
  const shoulderR = need("ShoulderR");
  const upperArmR = need("UpperArmR");
  const lowerArmR = need("LowerArmR");
  const palmR = need("Palm2R");
  const upperLegL = need("UpperLegL");
  const lowerLegL = need("LowerLegL");
  const footL = need("FootL");
  const upperLegR = need("UpperLegR");
  const lowerLegR = need("LowerLegR");
  const footR = need("FootR");


  const dynamicParts = attachChibiAppearance({
    head,
    body,
    shoulderL,
    upperArmL,
    lowerArmL,
    palmL,
    shoulderR,
    upperArmR,
    lowerArmR,
    palmR,
    upperLegL,
    lowerLegL,
    footL,
    upperLegR,
    lowerLegR,
    footR,
  });

  root.add(instance.scene);
  const mixer = new AnimationMixer(instance.scene);
  const actions = new Map<string, AnimationAction>();
  for (const clip of instance.animations) {
    const action = mixer.clipAction(clip);
    action.play();
    action.setEffectiveWeight(0);
    actions.set(clip.name, action);
  }
  const rig = { root, mixer, actions, dynamicParts };
  humanoids.set(instance, rig);
  return rig;
}

/**
 * Samples clips at explicit times with explicit weights, then evaluates the
 * mixer without advancing time, so the pose is a pure function of scroll.
 * Re-runs every dynamic limb/foot part afterwards so they track the bones'
 * freshly-evaluated (animated) world positions, not their bind pose.
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
  for (const part of rig.dynamicParts) part.update();
}

export function clipDuration(rig: HumanoidRig, name: ClipName): number {
  return rig.actions.get(name)?.getClip().duration ?? 1;
}
