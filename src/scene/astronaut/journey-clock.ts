import type { Camera, PerspectiveCamera } from "three";
import type { FrameRect } from "../../components/ui/astronaut/journey-timeline.ts";

/** Mutable scroll state written by the DOM driver and read inside useFrame. */
export type JourneyClock = {
  /** Smoothed timeline progress 0..1. */
  t: number;
  /** Stage size in CSS pixels. */
  width: number;
  height: number;
};

export type JourneyClockRef = { readonly current: JourneyClock };

export type WorldRect = { cx: number; cy: number; width: number; height: number };

/** Map a stage-pixel rect onto the z=0 plane of a perspective camera looking down -Z. */
export function stageRectToWorld(rect: FrameRect, stageWidth: number, stageHeight: number, camera: Camera): WorldRect {
  const cam = camera as PerspectiveCamera;
  const viewHeight = 2 * cam.position.z * Math.tan((cam.fov * Math.PI) / 360);
  const unit = viewHeight / stageHeight;
  return {
    cx: (rect.x + rect.width / 2 - stageWidth / 2) * unit,
    cy: -(rect.y + rect.height / 2 - stageHeight / 2) * unit,
    width: rect.width * unit,
    height: rect.height * unit,
  };
}
