import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { applyPose, createPoseBuffer } from "../scene/astronaut/astronaut-poses.ts";
import { sampleContactPose } from "../scene/astronaut/contact-poses.ts";
import { instantiateAstronaut, type AstronautInstance, type BoneName } from "../scene/astronaut/astronaut-rig.ts";
import { RECLINE_ROLL } from "../scene/astronaut/deck-contact.ts";

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
  it.each(["sit", "stand"] as const)("keeps the %s wave palm facing the viewer", (mode) => {
    const astronaut = instantiateAstronaut({ parts: [] });
    const pose = createPoseBuffer();
    // One full wave cycle (sin(time * 5.2)) sampled every ~7°.
    for (let time = 0; time < (2 * Math.PI) / 5.2; time += 0.025) {
      astronaut.root.position.set(0, 0, 0);
      astronaut.root.rotation.set(0, 0, 0);
      astronaut.root.scale.setScalar(1);
      sampleContactPose(mode, time, 1, pose);
      applyPose(astronaut, pose);
      astronaut.root.updateMatrixWorld(true);

      const hand = position(astronaut, "handL");
      const toCamera = CAMERA.clone().sub(hand).normalize();
      expect(world(astronaut, "handL", PALM).dot(toCamera)).toBeGreaterThan(0.85);
      // Fingers stay up: a wave, not a flap toward the camera.
      expect(world(astronaut, "handL", FINGERS).y).toBeGreaterThan(0.8);
    }
  });

  it("keeps the seated rest upright over the deck", () => {
    const astronaut = instantiateAstronaut({ parts: [] });
    const pose = createPoseBuffer();
    sampleContactPose("sit", 0, 1, pose);
    applyPose(astronaut, pose);
    astronaut.root.rotation.set(0, 0, 0);
    astronaut.root.updateMatrixWorld(true);

    const hips = position(astronaut, "hips");
    const head = position(astronaut, "head");
    const leftKnee = position(astronaut, "shinL");
    const rightKnee = position(astronaut, "shinR");

    expect(head.y).toBeGreaterThan(hips.y + 0.45);
    expect(Math.abs(head.x - hips.x)).toBeLessThan(head.y - hips.y);
    expect(leftKnee.y).toBeLessThan(hips.y);
    expect(rightKnee.y).toBeLessThan(hips.y);
  });

  it("props the reclining helmet on the lower hand and elbow", () => {
    const astronaut = instantiateAstronaut({ parts: [] });
    const pose = createPoseBuffer();
    sampleContactPose("lie", 0, 1, pose);
    applyPose(astronaut, pose);
    astronaut.root.rotation.z = RECLINE_ROLL;
    astronaut.root.updateMatrixWorld(true);

    const head = position(astronaut, "head");
    const elbow = position(astronaut, "forearmL");
    const hand = position(astronaut, "handL");

    expect(hand.distanceTo(head)).toBeLessThan(0.3);
    expect(hand.y - elbow.y).toBeGreaterThan(0.1);
    expect(Math.abs(hand.z - head.z)).toBeLessThan(0.18);
  });
});
