import { describe, expect, it } from "vitest";
import { ROVER_WHEEL_RADIUS, roverRideHeight } from "../scene/career/rover-motion.ts";

describe("rover ride height", () => {
  it("keeps the wheel tread on or above the ground through the suspension cycle", () => {
    for (let distance = 0; distance <= Math.PI * 4; distance += 0.02) {
      expect(roverRideHeight(distance) - ROVER_WHEEL_RADIUS).toBeGreaterThanOrEqual(0);
    }
  });
});
