import type { Camera, PerspectiveCamera } from "three";
import type { FrameRect } from "../../components/ui/astronaut/journey-timeline.ts";
import type { ContactInteraction, ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";

/**
 * DOM-measured finale state in stage pixels, shared with the foreground rig:
 * the contact card's box (the landing panel sits on its top edge), the point
 * where the astronaut stands on it, and his target height.
 */
export type FinaleClock = {
  progress: number;
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  footX: number;
  bodyHeight: number;
  cursorX: number;
  cursorY: number;
  lastPointerAt: number;
  interactionStartedAt: number;
  interaction: ContactInteraction;
  mode: ContactPoseMode;
};

export function createFinaleClock(): FinaleClock {
  return {
    progress: 0, cardLeft: 0, cardTop: 0, cardWidth: 0, footX: 0, bodyHeight: 0,
    cursorX: 0, cursorY: 0, lastPointerAt: 0, interactionStartedAt: 0,
    interaction: "none", mode: "landing",
  };
}

/** Mutable scroll state written by the DOM driver and read inside useFrame. */
export type JourneyClock = {
  /** Smoothed timeline progress 0..1. */
  t: number;
  /** Stage size in CSS pixels. */
  width: number;
  height: number;
  finale: FinaleClock;
};

export type JourneyClockRef = { readonly current: JourneyClock };

export type WorldRect = { cx: number; cy: number; width: number; height: number };

/** World units per stage pixel on the plane at depth `z`, for a perspective camera looking down -Z. */
export function stageUnitAt(stageHeight: number, camera: Camera, z = 0): number {
  const cam = camera as PerspectiveCamera;
  return (2 * (cam.position.z - z) * Math.tan((cam.fov * Math.PI) / 360)) / stageHeight;
}

/** Map a stage-pixel rect onto the z=0 plane of a perspective camera looking down -Z. */
export function stageRectToWorld(rect: FrameRect, stageWidth: number, stageHeight: number, camera: Camera): WorldRect {
  const unit = stageUnitAt(stageHeight, camera);
  return {
    cx: (rect.x + rect.width / 2 - stageWidth / 2) * unit,
    cy: -(rect.y + rect.height / 2 - stageHeight / 2) * unit,
    width: rect.width * unit,
    height: rect.height * unit,
  };
}
