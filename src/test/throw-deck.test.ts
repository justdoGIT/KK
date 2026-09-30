import { describe, expect, it } from "vitest";
import { STACK_STEP_PX, throwFrame, throwPose, throwProgressFor } from "../motion/throw-deck.ts";

const COUNT = 6;

describe("services throw deck", () => {
  it("keeps each card hidden until its throw starts", () => {
    for (let i = 0; i < COUNT; i++) {
      expect(throwPose(i, i, COUNT).visible).toBe(false);
      expect(throwPose(i, i + 0.05, COUNT).visible).toBe(true);
    }
  });

  it("does not expose the first card while the service stage is entering", () => {
    expect(throwPose(0, throwFrame(0, COUNT), COUNT).visible).toBe(false);
  });

  it("throws cards edge-on before opening their face to the viewport", () => {
    const early = throwPose(0, 0.05, COUNT);
    const yaw = Number(/rotateY\((-?[\d.]+)deg/.exec(early.transform)?.[1]);
    expect(Math.abs(yaw)).toBeGreaterThan(75);
    expect(early.opacity).toBe(0);
  });

  it("alternates the throwing side: even cards from the left, odd from the right", () => {
    const x = (i: number) => Number(/translate3d\((-?[\d.]+)vw/.exec(throwPose(i, i + 0.05, COUNT).transform)?.[1]);
    for (let i = 0; i < COUNT; i++) expect(Math.sign(x(i))).toBe(i % 2 === 0 ? -1 : 1);
  });

  it("lands skewed and is straight once its scroll window ends", () => {
    const landed = throwPose(3, 3.6, COUNT).transform;
    expect(landed).toMatch(/rotateZ\(-?[1-9]/);
    const straight = throwPose(3, 4, COUNT);
    expect(straight.settled).toBe(true);
    expect(straight.transform).not.toMatch(/rotate/);
  });

  it("keeps thrown cards stacked, each resting one step lower than the last", () => {
    const restY = (i: number) => {
      const t = throwPose(i, throwFrame(1, COUNT), COUNT).transform;
      return t === "none" ? 0 : Number(/translate3d\(0, (-?[\d.]+)px/.exec(t)?.[1]);
    };
    for (let i = 0; i < COUNT; i++) {
      const pose = throwPose(i, throwFrame(1, COUNT), COUNT);
      expect(pose.visible).toBe(true);
      expect(restY(i)).toBe(i * STACK_STEP_PX);
      // Only the top card shows its content; covered cards fade theirs.
      expect(pose.covered).toBe(i === COUNT - 1 ? 0 : 1);
    }
  });

  it("jumping to a card lands exactly on its straightened pose", () => {
    for (let i = 0; i < COUNT; i++) {
      const frame = throwFrame(throwProgressFor(i, COUNT), COUNT);
      expect(frame).toBeCloseTo(i + 1, 6);
      expect(throwPose(i, frame, COUNT).settled).toBe(true);
    }
  });

  it("ends the section with the last card straight, uncovered, and fully visible", () => {
    const pose = throwPose(COUNT - 1, throwFrame(1, COUNT), COUNT);
    expect(pose.transform).not.toMatch(/rotate/);
    expect(pose.opacity).toBe(1);
    expect(pose.covered).toBe(0);
  });
});
