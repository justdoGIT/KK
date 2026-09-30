import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { PHASE_SPANS } from "../components/ui/astronaut/journey-timeline.ts";
import { createRootPose, heroRoot } from "../scene/astronaut/hero-motion.ts";
import {
  LOUNGE_ROOT,
  applyPose,
  createPoseBuffer,
  sampleLoungePose,
  samplePose,
} from "../scene/astronaut/astronaut-poses.ts";
import { instantiateAstronaut, type AstronautInstance, type BoneName } from "../scene/astronaut/astronaut-rig.ts";

// Glove axes in the NASA bind pose (measured on the mesh): fingers along the
// arm, palm facing down (-Y), thumb forward (+Z).
const PALM = new Vector3(0, -1, 0);
const FINGERS = new Vector3(1, 0, 0);
const CAMERA = new Vector3(0, 0, 6);

function world(astronaut: AstronautInstance, bone: BoneName, local: Vector3): Vector3 {
  return local.clone().applyQuaternion(astronaut.bones[bone].getWorldQuaternion(new Quaternion()));
}

function position(astronaut: AstronautInstance, bone: BoneName): Vector3 {
  return astronaut.bones[bone].getWorldPosition(new Vector3());
}

describe("astronaut poses", () => {
  it("keeps the waving palm facing the viewer through the whole wave", () => {
    const astronaut = instantiateAstronaut({ parts: [] });
    const pose = createPoseBuffer();
    const t = PHASE_SPANS.wait.to;
    // One full wave cycle (sin(time * 5.2)) sampled every ~7°.
    for (let time = 0; time < (2 * Math.PI) / 5.2; time += 0.025) {
      const root = heroRoot(t, time, 16 / 9, createRootPose());
      astronaut.root.position.set(root.x, root.y, root.z);
      astronaut.root.rotation.set(root.rx, root.ry, root.rz);
      astronaut.root.scale.setScalar(root.scale);
      samplePose(t, time, pose);
      applyPose(astronaut, pose);
      astronaut.root.updateMatrixWorld(true);

      const hand = position(astronaut, "handL");
      const toCamera = CAMERA.clone().sub(hand).normalize();
      expect(world(astronaut, "handL", PALM).dot(toCamera)).toBeGreaterThan(0.85);
      // Fingers stay up: a wave, not a flap toward the camera.
      expect(world(astronaut, "handL", FINGERS).y).toBeGreaterThan(0.8);
    }
  });

  it("reclines on the elbow with the hand under the helmet", () => {
    const astronaut = instantiateAstronaut({ parts: [] });
    const pose = createPoseBuffer();
    sampleLoungePose(0, pose);
    applyPose(astronaut, pose);
    astronaut.root.rotation.set(LOUNGE_ROOT[0], LOUNGE_ROOT[1], LOUNGE_ROOT[2]);
    astronaut.root.updateMatrixWorld(true);

    const hips = position(astronaut, "hips");
    const head = position(astronaut, "head");
    const elbow = position(astronaut, "forearmL");
    const shoulder = position(astronaut, "armL");
    const hand = position(astronaut, "handL");
    const bottomKnee = position(astronaut, "shinL");

    // Lying along the banner: head to one side of the hips, not above them.
    expect(Math.abs(head.x - hips.x)).toBeGreaterThan(Math.abs(head.y - hips.y));
    // The elbow is planted: lowest point of the arm, level with the bottom leg.
    expect(elbow.y).toBeLessThan(shoulder.y - 0.1);
    expect(elbow.y).toBeLessThan(hand.y);
    expect(Math.abs(elbow.y - bottomKnee.y)).toBeLessThan(0.08);
    // The hand holds the helmet up: just beneath the head, not beside the hips.
    expect(hand.distanceTo(head)).toBeLessThan(0.35);
    expect(hand.y).toBeLessThan(head.y);
  });
});
