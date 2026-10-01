import {
  AnimationMixer,
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
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

// Chibi astronaut palette, shared by every procedural part below.
const SHELL = "#f6f1e7"; // cream white body shell
const ACCENT = "#e0812f"; // orange trim / joints / boots
const DARK = "#15151d"; // near-black visor recess / elbow-knee joints
const GLOW = "#7dd3fc"; // cyan eye / chest-button glow
const GLOW_EMISSIVE = "#38bdf8";

function shellMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: SHELL, emissive: "#2a2014", emissiveIntensity: 0.05, metalness: 0.12, roughness: 0.4 });
}
function accentMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: ACCENT, metalness: 0.22, roughness: 0.42 });
}
function jointMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: DARK, metalness: 0.3, roughness: 0.45 });
}

/** Chibi astronaut head: rounded cream dome helmet, orange collar trim, big glowing cyan eyes. */
function createChibiAstronautHead(): Group {
  const headGroup = new Group();
  headGroup.name = "ChibiAstronautHead";

  const domeGeom = new SphereGeometry(0.46, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const dome = new Mesh(domeGeom, shellMaterial());
  dome.position.set(0, 0.2, -0.02);
  headGroup.add(dome);

  const collarGeom = new CylinderGeometry(0.46, 0.44, 0.1, 28);
  const collarMat = accentMaterial();
  const collar = new Mesh(collarGeom, collarMat);
  collar.position.set(0, -0.02, -0.02);
  headGroup.add(collar);

  const faceGeom = new SphereGeometry(0.36, 24, 18, -Math.PI * 0.34, Math.PI * 0.68, Math.PI * 0.26, Math.PI * 0.48);
  const face = new Mesh(faceGeom, jointMaterial());
  face.position.set(0, 0.13, 0.03);
  headGroup.add(face);

  const eyeGeom = new SphereGeometry(0.1, 20, 16);
  const eyeMat = new MeshStandardMaterial({ color: GLOW, emissive: GLOW_EMISSIVE, emissiveIntensity: 3.4, metalness: 0.1, roughness: 0.12 });
  const eyeL = new Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.15, 0.15, 0.31);
  const eyeR = new Mesh(eyeGeom, eyeMat);
  eyeR.position.set(0.15, 0.15, 0.31);
  headGroup.add(eyeL, eyeR);

  const podGeom = new SphereGeometry(0.07, 16, 14);
  const podL = new Mesh(podGeom, collarMat);
  podL.position.set(-0.46, 0.22, 0.02);
  const podR = new Mesh(podGeom, collarMat);
  podR.position.set(0.46, 0.22, 0.02);
  headGroup.add(podL, podR);

  return headGroup;
}

/** Chibi astronaut chest: rounded cream shell, orange belt stripe, glowing cyan core button. */
function createChibiAstronautTorso(): Group {
  const torsoGroup = new Group();
  torsoGroup.name = "ChibiAstronautTorso";

  const shellGeom = new SphereGeometry(0.5, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const shell = new Mesh(shellGeom, shellMaterial());
  shell.rotation.x = Math.PI;
  shell.position.set(0, 0.12, 0.05);
  torsoGroup.add(shell);

  const stripeGeom = new BoxGeometry(0.5, 0.14, 0.14);
  const stripe = new Mesh(stripeGeom, accentMaterial());
  stripe.position.set(0, 0.04, 0.42);
  torsoGroup.add(stripe);

  const coreGeom = new CylinderGeometry(0.09, 0.09, 0.05, 20);
  coreGeom.rotateX(Math.PI / 2);
  const coreMat = new MeshStandardMaterial({ color: GLOW, emissive: GLOW_EMISSIVE, emissiveIntensity: 3.0, metalness: 0.15, roughness: 0.15 });
  const core = new Mesh(coreGeom, coreMat);
  core.position.set(0, 0.24, 0.45);
  torsoGroup.add(core);

  return torsoGroup;
}

const UP = new Vector3(0, 1, 0);

/** Returns `bone`'s current world position as a fresh Vector3 (read, not reused). */
function worldPos(bone: Object3D): Vector3 {
  return bone.getWorldPosition(new Vector3());
}

/**
 * A procedural part whose transform must track live, animated bone
 * positions every frame rather than the bind pose it was built from — both
 * ends of a limb rotate independently once a clip (Idle/Walking/Running)
 * is playing, so a cylinder oriented once at construction drifts off its
 * target the moment the pose moves.
 */
type DynamicPart = { update(): void };

/**
 * Tapered cylinder spanning from `parentBone` to `targetBone`, re-measured
 * every `update()` call. Built with unit height so re-orienting only needs
 * `scale.y = length` (no per-frame geometry allocation); `radiusTop`/
 * `radiusBottom` are plain world-unit dimensions, so `s` (the bone's
 * baked-in world scale — see `humanoidRigFor`) divides them down to the
 * bone's own local frame before building the geometry.
 */
function limbSegment(parentBone: Object3D, targetBone: Object3D, radiusTop: number, radiusBottom: number, material: MeshStandardMaterial, s: number): DynamicPart {
  const mesh = new Mesh(new CylinderGeometry(radiusTop / s, radiusBottom / s, 1, 18), material);
  parentBone.add(mesh);
  const update = (): void => {
    const localEnd = parentBone.worldToLocal(worldPos(targetBone));
    const length = Math.max(localEnd.length(), 0.02 / s);
    mesh.quaternion.setFromUnitVectors(UP, localEnd.clone().normalize());
    mesh.position.copy(localEnd).multiplyScalar(0.5);
    mesh.scale.y = length;
  };
  update();
  return { update };
}

/**
 * Short tapered neck bridging `headBone` down toward `torsoBone`, capped at
 * `maxLength` (world units) rather than spanning the full head-to-torso
 * bone distance — that distance is much longer than a neck (it reaches
 * past the chest to the hip-level body bone), so an uncapped span would
 * read as a long rod instead of a short connector. Capping still orients
 * toward wherever the torso currently is, so it tracks head tilt/bob.
 */
function neckSegment(headBone: Object3D, torsoBone: Object3D, radiusTop: number, radiusBottom: number, maxLength: number, material: MeshStandardMaterial, s: number): DynamicPart {
  const mesh = new Mesh(new CylinderGeometry(radiusTop / s, radiusBottom / s, 1, 18), material);
  headBone.add(mesh);
  const update = (): void => {
    const toTorso = headBone.worldToLocal(worldPos(torsoBone));
    const dir = toTorso.clone().normalize();
    const length = Math.min(toTorso.length(), maxLength / s);
    mesh.quaternion.setFromUnitVectors(UP, dir);
    mesh.position.copy(dir).multiplyScalar(length * 0.5);
    mesh.scale.y = length;
  };
  update();
  return { update };
}

/** Small sphere covering a joint seam (shoulder, elbow, knee) — sits at its own bone's origin, so it tracks that bone automatically without per-frame work. */
function jointCap(bone: Object3D, radius: number, material: MeshStandardMaterial, s: number): void {
  bone.add(new Mesh(new SphereGeometry(radius / s, 20, 16), material));
}

/** Rounded mitten hand with an orange wrist cuff ring — anchored at its own bone's origin, so it tracks that bone automatically without per-frame work. */
function handCap(bone: Object3D, radius: number, shell: MeshStandardMaterial, cuff: MeshStandardMaterial, s: number): void {
  bone.add(new Mesh(new SphereGeometry(radius / s, 18, 14), shell));
  const ring = new Mesh(new TorusGeometry((radius * 0.9) / s, (radius * 0.22) / s, 10, 18), cuff);
  ring.rotation.x = Math.PI / 2;
  bone.add(ring);
}

/**
 * Chunky rounded boot on `footBone`, pointing away from `viaBone` (the
 * lower leg) toward the toe, with an orange sole trim — re-measured every
 * `update()` call for the same reason as `limbSegment`.
 */
function footCap(footBone: Object3D, viaBone: Object3D, shell: MeshStandardMaterial, sole: MeshStandardMaterial, s: number): DynamicPart {
  const boot = new Mesh(new CapsuleGeometry(0.1 / s, 1, 4, 10), shell);
  footBone.add(boot);
  const soleTrim = new Mesh(new BoxGeometry(0.15 / s, 0.04 / s, 1), sole);
  footBone.add(soleTrim);

  const update = (): void => {
    const footW = worldPos(footBone);
    const viaW = worldPos(viaBone);
    const dir = footW.clone().sub(viaW).normalize();
    const toeWorld = footW.clone().add(dir.multiplyScalar(0.22));
    const localToe = footBone.worldToLocal(toeWorld);
    const length = Math.max(localToe.length(), 0.05 / s);
    const quat = new Quaternion().setFromUnitVectors(UP, localToe.clone().normalize());

    boot.quaternion.copy(quat);
    boot.position.copy(localToe).multiplyScalar(0.55);
    boot.scale.y = length * 0.6;

    soleTrim.quaternion.copy(quat);
    soleTrim.position.copy(boot.position).add(new Vector3(0, -0.08 / s, 0));
    soleTrim.scale.z = length * 0.55;
  };
  update();
  return { update };
}

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
 * Builds a fully procedural chibi-astronaut body on RobotExpressive's
 * skeleton. The source mesh (including its detached shoulder-height
 * `HandL`/`HandR` claw groups — a known quirk of this sample asset, not a
 * wrist-skinned hand) is hidden entirely; every visible part here is custom
 * geometry anchored to a bone by spanning real bone-to-bone world
 * distances, so it tracks whatever the rig's own Idle/Walking/Running clips
 * do without assuming a particular bone-local rotation convention.
 *
 * Every bone in this asset carries a uniform ~37.6x world scale baked in by
 * its original export (skinned vertices correct for it via bind matrices;
 * raw geometry parented directly to a bone does not). `s` below measures
 * that factor once and divides every hardcoded radius/size/offset by it so
 * procedural parts render at the intended size instead of ~38x too large.
 */
export function humanoidRigFor(instance: ModelInstance): HumanoidRig {
  const cached = humanoids.get(instance);
  if (cached) return cached;
  const root = new Group();
  instance.scene.scale.setScalar(HUMANOID_HEIGHT / HUMANOID_MODEL_HEIGHT);
  instance.scene.updateMatrixWorld(true);

  const bones: Record<string, Object3D> = {};
  let torsoNode: Object3D | null = null;
  instance.scene.traverse((node) => {
    if (node instanceof Mesh) {
      node.visible = false;
      return;
    }
    if (!torsoNode && node.name === "Torso") {
      torsoNode = node;
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

  const s = head.getWorldScale(new Vector3()).x || 1;

  // Head/torso are modelled at a scale that reads clearly on their own;
  // relative to the 1.8m-tall rig they'd otherwise engulf the whole
  // shoulder/hip region, so an extra uniform shrink brings them down to a
  // chibi-proportionate size (big head, compact body) without having to
  // rescale every hardcoded dimension inside the two builder functions.
  const HEAD_SCALE = 0.44;
  const TORSO_SCALE = 0.42;

  const headWrap = new Group();
  headWrap.scale.setScalar((1 / s) * HEAD_SCALE);
  headWrap.add(createChibiAstronautHead());
  head.add(headWrap);

  const torsoWrap = new Group();
  torsoWrap.scale.setScalar((1 / s) * TORSO_SCALE);
  torsoWrap.add(createChibiAstronautTorso());
  (torsoNode ?? body).add(torsoWrap);

  const shell = shellMaterial();
  const accent = accentMaterial();
  const joint = jointMaterial();
  const dynamicParts: DynamicPart[] = [];

  // Bridges the dead gap between the head's collar and the torso's top —
  // without this the head reads as a separate floating piece.
  dynamicParts.push(neckSegment(head, torsoNode ?? body, 0.15, 0.19, 0.32, shell, s));

  for (const [shoulder, upperArm, lowerArm, palm] of [
    [shoulderL, upperArmL, lowerArmL, palmL],
    [shoulderR, upperArmR, lowerArmR, palmR],
  ] as const) {
    jointCap(shoulder, 0.1, accent, s);
    dynamicParts.push(limbSegment(upperArm, lowerArm, 0.095, 0.085, shell, s));
    jointCap(lowerArm, 0.08, joint, s);
    dynamicParts.push(limbSegment(lowerArm, palm, 0.075, 0.07, shell, s));
    handCap(palm, 0.09, shell, accent, s);
  }

  for (const [upperLeg, lowerLeg, foot] of [
    [upperLegL, lowerLegL, footL],
    [upperLegR, lowerLegR, footR],
  ] as const) {
    dynamicParts.push(limbSegment(upperLeg, lowerLeg, 0.14, 0.12, shell, s));
    jointCap(lowerLeg, 0.125, joint, s);
    dynamicParts.push(limbSegment(lowerLeg, foot, 0.11, 0.095, shell, s));
    dynamicParts.push(footCap(foot, lowerLeg, shell, accent, s));
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
