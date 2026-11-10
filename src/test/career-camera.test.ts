import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { cinematicLens } from "../scene/career/stages/stage-math.ts";

describe("responsive career camera", () => {
  it("keeps the same scene width visible when the animation viewport narrows", () => {
    const camera = new PerspectiveCamera(40, 1, 0.1, 80);
    cinematicLens(camera, 40);
    const desktop = new Vector3(0.8, 0, -3).project(camera).x;
    camera.aspect = 0.5;
    cinematicLens(camera, 40);
    const portrait = new Vector3(0.8, 0, -3).project(camera).x;
    expect(Math.abs(portrait)).toBeLessThan(1);
    expect(portrait).toBeCloseTo(desktop, 5);
  });

  it("restores the authored shot after resizing to a wide viewport", () => {
    const camera = new PerspectiveCamera(40, 0.5, 0.1, 80);
    cinematicLens(camera, 40);
    expect(camera.fov).toBeGreaterThan(40);
    camera.aspect = 1.5;
    cinematicLens(camera, 40);
    expect(camera.fov).toBeCloseTo(40);
  });

  it("preserves the width of a chase shot in the square phone panel", () => {
    const camera = new PerspectiveCamera(35, 1.4, 0.1, 80);
    camera.userData.framingAspect = 1.4;
    cinematicLens(camera, 35);
    const authored = new Vector3(-1, 0, -2.5).project(camera).x;
    camera.aspect = 0.96;
    cinematicLens(camera, 35);
    expect(new Vector3(-1, 0, -2.5).project(camera).x).toBeCloseTo(authored, 5);
  });
});
