import { describe, expect, it } from "vitest";
import { ROVER_GROUND_CLEARANCE, roverRideHeight } from "../scene/career/rover-motion.ts";

describe("rover ride height", () => {
  it("keeps the wheel tread on or above the ground through the suspension cycle", () => {
    // Tread bottom sits at rideHeight - ROVER_GROUND_CLEARANCE below the hub's
    // local origin (measured from the husky.glb mesh); it must never go
    // negative, i.e. rideHeight must never dip below the clearance baseline.
    for (let distance = 0; distance <= Math.PI * 4; distance += 0.02) {
      expect(roverRideHeight(distance) - ROVER_GROUND_CLEARANCE).toBeGreaterThanOrEqual(0);
    }
  });
});
