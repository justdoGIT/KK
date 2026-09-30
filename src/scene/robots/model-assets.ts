import { Quaternion, Vector3, type Object3D } from "three";

/** Repository-hosted GLB models (see public/models/CREDITS.md). */
export const MODEL_PATHS = {
  turtlebot3: "models/robots/turtlebot3.glb",
  husky: "models/robots/husky.glb",
  go2: "models/robots/go2.glb",
  humanoid: "models/characters/robot-expressive.glb",
  astronaut: "models/characters/nasa-astronaut.glb",
} as const;

export type ModelKey = keyof typeof MODEL_PATHS;

/** Resolves a model path against Vite's base so GitHub Pages sub-paths work. */
export function modelUrl(key: ModelKey): string {
  return `${import.meta.env.BASE_URL}${MODEL_PATHS[key]}`;
}

export type JointSpec = {
  name: string;
  type: string;
  child: string;
  axis: number[];
};

export type RobotJoints = {
  root: string;
  joints: JointSpec[];
};

export type JointRig = {
  /** Sets a joint angle (radians) relative to the URDF zero pose. Unknown names are ignored. */
  set: (joint: string, angle: number) => void;
  names: readonly string[];
};

/**
 * Articulates a GLB built by scripts/assets/build_robot_glbs.py: each movable
 * URDF joint rotates its child link node about the joint axis, expressed in
 * the child frame, on top of the node's rest orientation.
 */
export function createJointRig(scene: Object3D, spec: RobotJoints): JointRig {
  const entries = new Map<string, { node: Object3D; rest: Quaternion; axis: Vector3 }>();
  for (const joint of spec.joints) {
    const node = scene.getObjectByName(joint.child);
    if (!node) continue;
    const [x = 0, y = 0, z = 1] = joint.axis;
    entries.set(joint.name, { node, rest: node.quaternion.clone(), axis: new Vector3(x, y, z).normalize() });
  }
  const delta = new Quaternion();
  return {
    names: [...entries.keys()],
    set(joint, angle) {
      const entry = entries.get(joint);
      if (!entry) return;
      delta.setFromAxisAngle(entry.axis, angle);
      entry.node.quaternion.copy(entry.rest).multiply(delta);
    },
  };
}

const rigs = new WeakMap<Object3D, JointRig>();

/** One rig per model instance, so every caller shares the same rest pose. */
export function jointRigFor(scene: Object3D, spec: RobotJoints): JointRig {
  let rig = rigs.get(scene);
  if (!rig) {
    rig = createJointRig(scene, spec);
    rigs.set(scene, rig);
  }
  return rig;
}
