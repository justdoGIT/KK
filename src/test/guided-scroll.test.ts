import { describe, expect, it } from "vitest";
import { advanceCruise } from "../motion/smooth-scroll.ts";
import { guidedCruise } from "../motion/guided-scroll.ts";

describe("guided cruise planning", () => {
  it("plays only inside a pinned section, ahead of its resting frame", () => {
    const pace = { target: 0.9, seconds: 18 };
    expect(guidedCruise(0, 1000, 4000, pace)).toBeNull();
    expect(guidedCruise(0.5, 1000, 4000, pace)).toEqual({ destination: 1000 + 0.9 * 4000, speed: (0.9 - 0.02) * 4000 / 18 });
    expect(guidedCruise(0.89, 1000, 4000, pace)).not.toBeNull();
    expect(guidedCruise(0.9, 1000, 4000, pace)).toBeNull();
    expect(guidedCruise(0.5, 1000, 0, pace)).toBeNull();
  });
});

describe("cruise kinematics", () => {
  it("accelerates from rest, brakes into the destination, and lands exactly", () => {
    const motion = { position: 0, velocity: 0 };
    for (let step = 0; step < 400; step += 1) {
      const arrived = advanceCruise(motion, 1000, 200, 140, 1 / 60);
      if (arrived) break;
    }
    expect(motion.position).toBe(1000);
    expect(motion.velocity).toBe(0);
  });

  it("never overshoots and keeps a floor speed while braking", () => {
    const motion = { position: 0, velocity: 0 };
    let maxVelocity = 0;
    for (let step = 0; step < 400 && motion.position < 1000; step += 1) {
      advanceCruise(motion, 1000, 200, 140, 1 / 60);
      maxVelocity = Math.max(maxVelocity, motion.velocity);
      expect(motion.position).toBeLessThanOrEqual(1000);
    }
    expect(maxVelocity).toBeLessThanOrEqual(200);
  });

  it("does not exceed an authored speed below the braking floor", () => {
    const motion = { position: 0, velocity: 0 };
    advanceCruise(motion, 100, 12, 5, 1 / 60);
    expect(motion.velocity).toBeLessThanOrEqual(12);
    expect(motion.position).toBeLessThanOrEqual(12 / 60);
  });

  it("settles instantly when already at the destination", () => {
    const motion = { position: 1000, velocity: 0 };
    expect(advanceCruise(motion, 1000, 200, 140, 1 / 60)).toBe(true);
    expect(motion.velocity).toBe(0);
  });
});
