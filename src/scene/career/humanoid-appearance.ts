import { Box3, Group, Matrix4, Quaternion, Vector3, type Object3D } from "three";
import { createChibiHead } from "./humanoid-head.ts";
import { createChibiTorso } from "./humanoid-torso.ts";
import { createChibiPalette } from "./humanoid-surfaces.ts";
import {
  FOREARM_LENGTH, SHIN_LENGTH, THIGH_LENGTH, UPPER_ARM_LENGTH,
  createChibiArm, createChibiLeg, type ChibiArm, type ChibiLeg,
} from "./humanoid-limbs.ts";

export type ChibiBones = {
  head: Object3D;
  body: Object3D;
  shoulderL: Object3D;
  upperArmL: Object3D;
  lowerArmL: Object3D;
  palmL: Object3D;
  shoulderR: Object3D;
  upperArmR: Object3D;
  lowerArmR: Object3D;
  palmR: Object3D;
  upperLegL: Object3D;
  lowerLegL: Object3D;
  footL: Object3D;
  upperLegR: Object3D;
  lowerLegR: Object3D;
  footR: Object3D;
};
export type DynamicPart = { update(): void };

function mirrorArm(arm: ChibiArm): ChibiArm {
  return { upper: arm.upper.clone(), elbow: arm.elbow.clone(), forearm: arm.forearm.clone(), hand: arm.hand.clone() };
}
function cloneLeg(leg: ChibiLeg): ChibiLeg {
  return { hip: leg.hip.clone(), thigh: leg.thigh.clone(), knee: leg.knee.clone(), shin: leg.shin.clone(), boot: leg.boot.clone() };
}

/**
 * Source bones supply animation, not geometry coordinates. Their baked scale and
 * rotated bind axes stay inside the source rig; visible parts live in root units.
 * Each joint frame is calibrated once, so armor remains closed and boots start flat.
 */
export function attachChibiAppearance(b: ChibiBones, root: Group): DynamicPart[] {
  const palette = createChibiPalette();
  const appearance = new Group();
  appearance.name = "ChibiRobotAppearance";
  root.add(appearance);
  const head = createChibiHead(palette);
  const torso = createChibiTorso(palette);
  appearance.add(head, torso);
  root.updateWorldMatrix(true, true);

  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const matrix = new Matrix4();
  const positionScratch = new Vector3();
  const scaleScratch = new Vector3();
  const quaternionScratch = new Quaternion();
  const front = new Vector3(0, 0, 1);
  const xAxis = new Vector3();
  const yAxis = new Vector3();
  const zAxis = new Vector3();
  const rotationDelta = new Quaternion();
  const sourceDirection = new Vector3();
  const endpoint = new Vector3();

  const position = (bone: Object3D, out: Vector3): Vector3 => out.setFromMatrixPosition(bone.matrixWorld).applyMatrix4(toRoot);
  const rotation = (bone: Object3D, out: Quaternion): Quaternion => {
    matrix.multiplyMatrices(toRoot, bone.matrixWorld).decompose(positionScratch, out, scaleScratch);
    return out;
  };
  const bindHead = rotation(b.head, new Quaternion()).invert();
  const bindBody = rotation(b.body, new Quaternion()).invert();

  // Orthonormal frames keep armor facing forward while its joint axis bends.
  const orient = (group: Group, start: Vector3, end: Vector3, length?: number): void => {
    yAxis.subVectors(end, start);
    const distance = yAxis.length();
    yAxis.multiplyScalar(1 / Math.max(distance, 1e-8));
    zAxis.copy(front).addScaledVector(yAxis, -front.dot(yAxis));
    if (zAxis.lengthSq() < 1e-6) zAxis.set(0, 1, 0).addScaledVector(yAxis, -yAxis.y);
    zAxis.normalize();
    xAxis.crossVectors(yAxis, zAxis).normalize();
    matrix.makeBasis(xAxis, yAxis, zAxis);
    group.quaternion.setFromRotationMatrix(matrix);
    group.position.copy(start);
    if (length) group.scale.y = distance / length;
  };

  const armL = createChibiArm(palette);
  const armR = mirrorArm(armL);
  armR.hand.scale.x = -1;
  const arms = [
    { parts: armL, shoulder: b.shoulderL, upper: b.upperArmL, lower: b.lowerArmL, palm: b.palmL, side: 1 },
    { parts: armR, shoulder: b.shoulderR, upper: b.upperArmR, lower: b.lowerArmR, palm: b.palmR, side: -1 },
  ].map((arm) => {
    appearance.add(...Object.values(arm.parts));
    return {
      ...arm,
      bindUpper: position(arm.lower, new Vector3()).sub(position(arm.upper, new Vector3())).normalize(),
      bindLower: position(arm.palm, new Vector3()).sub(position(arm.lower, new Vector3())).normalize(),
      neutralUpper: new Vector3(arm.side * 0.17, -0.985, 0).normalize(),
      neutralLower: new Vector3(arm.side * 0.1, -0.994, 0.04).normalize(),
      shoulderPosition: new Vector3(), elbowPosition: new Vector3(), wristPosition: new Vector3(),
    };
  });

  const legL = createChibiLeg(palette);
  // The sole's footprint corners in boot space, from the detached boot's own geometry.
  const sole = new Box3().setFromObject(legL.boot);
  const soleCorners = [sole.min.x, sole.max.x].flatMap((x) =>
    [sole.min.z, sole.max.z].map((z) => new Vector3(x, sole.min.y, z)),
  );
  const legR = cloneLeg(legL);
  const legs = [
    { parts: legL, hip: b.upperLegL, knee: b.lowerLegL, foot: b.footL, side: "L" },
    { parts: legR, hip: b.upperLegR, knee: b.lowerLegR, foot: b.footR, side: "R" },
  ].map((leg) => {
    leg.parts.boot.name = `ChibiRobotBoot${leg.side}`;
    appearance.add(...Object.values(leg.parts));
    return {
      ...leg,
      bindFoot: rotation(leg.foot, new Quaternion()).invert(),
      soleBaseline: position(leg.foot, new Vector3()).y,
      hipPosition: new Vector3(), kneePosition: new Vector3(), footPosition: new Vector3(),
    };
  });

  const update = (): void => {
    toRoot.copy(root.matrixWorld).invert();
    position(b.body, torso.position);
    rotation(b.body, torso.quaternion).multiply(bindBody);
    position(b.head, head.position);
    rotation(b.head, head.quaternion).multiply(bindHead);
    front.set(0, 0, 1).applyQuaternion(torso.quaternion);

    for (const arm of arms) {
      const { parts, shoulderPosition, elbowPosition, wristPosition } = arm;
      position(arm.shoulder, shoulderPosition);
      endpoint.set(arm.side * 0.105, 0, 0).applyQuaternion(torso.quaternion);
      shoulderPosition.add(endpoint);
      position(arm.lower, sourceDirection).sub(position(arm.upper, endpoint)).normalize();
      rotationDelta.setFromUnitVectors(arm.bindUpper, sourceDirection);
      elbowPosition.copy(arm.neutralUpper).applyQuaternion(rotationDelta).multiplyScalar(UPPER_ARM_LENGTH).add(shoulderPosition);
      position(arm.palm, sourceDirection).sub(position(arm.lower, endpoint)).normalize();
      rotationDelta.setFromUnitVectors(arm.bindLower, sourceDirection);
      wristPosition.copy(arm.neutralLower).applyQuaternion(rotationDelta).multiplyScalar(FOREARM_LENGTH).add(elbowPosition);
      orient(parts.upper, shoulderPosition, elbowPosition);
      orient(parts.forearm, elbowPosition, wristPosition);
      parts.elbow.position.copy(elbowPosition);
      parts.elbow.quaternion.copy(parts.forearm.quaternion);
      parts.hand.position.copy(wristPosition);
      parts.hand.quaternion.copy(parts.forearm.quaternion);
    }

    for (const leg of legs) {
      const { parts, hipPosition, kneePosition, footPosition } = leg;
      position(leg.hip, hipPosition);
      position(leg.knee, kneePosition);
      position(leg.foot, footPosition);
      rotation(leg.foot, quaternionScratch).multiply(leg.bindFoot);
      parts.boot.quaternion.copy(quaternionScratch);
      let soleY = Infinity;
      for (const corner of soleCorners) {
        endpoint.copy(corner).applyQuaternion(quaternionScratch);
        soleY = Math.min(soleY, endpoint.y);
      }
      footPosition.y = Math.max(0, footPosition.y - leg.soleBaseline) - soleY;
      parts.boot.position.copy(footPosition);
      parts.hip.position.copy(hipPosition);
      parts.hip.quaternion.copy(torso.quaternion);
      orient(parts.thigh, hipPosition, kneePosition, THIGH_LENGTH);
      orient(parts.shin, kneePosition, footPosition, SHIN_LENGTH);
      parts.knee.position.copy(kneePosition);
      parts.knee.quaternion.copy(parts.shin.quaternion);
    }
  };
  update();
  return [{ update }];
}
