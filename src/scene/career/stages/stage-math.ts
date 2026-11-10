import type { Camera, Group, PerspectiveCamera } from "three";
import type { CareerClock } from "../career-clock.ts";

/** Shows the stage group only while its index is active; returns the clock when active. */
export function activeClock(group: Group | null, clock: CareerClock | null, index: number): CareerClock | null {
  if (!group || !clock) return null;
  group.visible = clock.stage === index;
  return group.visible ? clock : null;
}

/** Orbit shot around a point (used during morphs). */
export function orbit(
  out: { x: number; y: number; z: number },
  cx: number,
  cz: number,
  angle: number,
  radius: number,
  height: number,
): void {
  out.x = cx + Math.cos(angle) * radius;
  out.y = height;
  out.z = cz + Math.sin(angle) * radius;
}

/** Changes focal length per shot without reallocating the shared camera. */
export function cinematicLens(camera: Camera, fov: number): void {
  const perspective = camera as PerspectiveCamera;
  if (!perspective.isPerspectiveCamera) return;
  // Phone scenes need the width of the authored chase shots, including the
  // quadruped's forward-looking camera, inside their nearly square viewport.
  const framingAspect = perspective.userData.framingAspect ?? 1;
  const fittedFov = 2 * Math.atan(Math.tan(fov * Math.PI / 360)
    * Math.max(1, framingAspect / Math.max(0.45, perspective.aspect))) * 180 / Math.PI;
  if (Math.abs(perspective.fov - fittedFov) < 0.01) return;
  perspective.fov = fittedFov;
  perspective.updateProjectionMatrix();
}
