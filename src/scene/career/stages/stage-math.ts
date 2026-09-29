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
  if (!perspective.isPerspectiveCamera || Math.abs(perspective.fov - fov) < 0.01) return;
  perspective.fov = fov;
  perspective.updateProjectionMatrix();
}
