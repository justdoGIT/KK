import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Box3, Group, Quaternion, Vector3, type Object3D } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { humanoidRigFor, poseHumanoid, type ClipName } from "../scene/career/humanoid.ts";

let asset: GLTF;
beforeAll(async () => {
  const bytes = await readFile(resolve("public/models/characters/robot-expressive.glb"));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const data = Uint8Array.from(bytes).buffer;
  asset = await loader.parseAsync(data, "");
});

function createRig() {
  return humanoidRigFor({ scene: clone(asset.scene), animations: asset.animations });
}
function need(root: Object3D, name: string): Object3D {
  const node = root.getObjectByName(name);
  if (!node) throw new Error(`Missing visible robot part: ${name}`);
  return node;
}

describe("chibi appearance on the real animation skeleton", () => {
  it("calibrates baked bone axes into a compact body and flat grounded boots", () => {
    const rig = createRig();
    rig.root.updateMatrixWorld(true);
    const appearance = need(rig.root, "ChibiRobotAppearance");
    const bounds = new Box3().setFromObject(appearance);
    const size = bounds.getSize(new Vector3());
    expect(size.y).toBeGreaterThan(1.6);
    expect(size.y).toBeLessThan(2);
    expect(size.x).toBeGreaterThan(0.9);
    expect(size.x).toBeLessThan(1.3);
    for (const side of ["L", "R"]) {
      const boot = need(rig.root, `ChibiRobotBoot${side}`);
      const up = new Vector3(0, 1, 0).applyQuaternion(boot.getWorldQuaternion(new Quaternion()));
      expect(up.y).toBeGreaterThan(0.9999);
      expect(new Box3().setFromObject(boot).min.y).toBeCloseTo(0, 4);
    }
  });

  it("keeps armored soles above the runway across idle, walking and running", () => {
    const rig = createRig();
    for (const name of ["Idle", "Walking", "Running"] as const) {
      const duration = rig.actions.get(name)!.getClip().duration;
      for (let frame = 0; frame < 16; frame++) {
        poseHumanoid(rig, [[name, duration * frame / 16, 1]]);
        rig.root.updateMatrixWorld(true);
        for (const side of ["L", "R"]) {
          const bounds = new Box3().setFromObject(need(rig.root, `ChibiRobotBoot${side}`));
          expect(bounds.min.y, `${name} frame ${frame} ${side} sole`).toBeGreaterThanOrEqual(-0.0001);
          expect(bounds.max.y - bounds.min.y).toBeLessThan(0.6);
        }
      }
    }
  });

  it("rewinds to the same pose without inheriting a moving stage's transform", () => {
    const rig = createRig();
    const sample: [ClipName, number, number][] = [["Walking", 0.42, 1]];
    poseHumanoid(rig, sample);
    const appearance = need(rig.root, "ChibiRobotAppearance");
    const before = appearance.children.map(node => [...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()]);
    const stage = new Group();
    stage.position.set(7, 0.3, -2);
    stage.rotation.y = Math.PI / 2;
    stage.scale.setScalar(0.8);
    stage.add(rig.root);
    poseHumanoid(rig, [["Running", 0.72, 1]]);
    poseHumanoid(rig, sample);
    appearance.children.forEach((node, index) => {
      const after = [...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()];
      after.forEach((value, axis) => expect(value).toBeCloseTo(before[index][axis], 5));
    });
  });
});
