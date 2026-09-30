import { describe, expect, it } from "vitest";
import {
  BANNER_POP,
  BANNER_SETTLED,
  DIP_DEPTH,
  DIP_DOWN,
  LAND_AT,
  bannerState,
} from "../components/ui/contact/banner-timeline.ts";

describe("contact banner landing", () => {
  it("has the banner at rest when the astronaut touches down, then sags", () => {
    expect(BANNER_POP).toBeLessThan(LAND_AT);
    const touch = bannerState(LAND_AT);
    expect(touch.fall).toBe(1);
    expect(touch.offset).toBeCloseTo(0, 6);
    expect(bannerState(LAND_AT - 0.01).fall).toBeLessThan(1);
    expect(bannerState(LAND_AT + DIP_DOWN).offset).toBeCloseTo(DIP_DEPTH, 6);
  });

  it("sinks quickly but rises back slowly and settles flat", () => {
    const sink = DIP_DOWN;
    // Time to recover half the depth after the lowest point.
    let half = LAND_AT + DIP_DOWN;
    while (bannerState(half).offset > DIP_DEPTH / 2) half += 0.01;
    expect(half - (LAND_AT + DIP_DOWN)).toBeGreaterThan(sink * 3);
    expect(bannerState(BANNER_SETTLED).offset).toBeCloseTo(0, 6);
    expect(bannerState(BANNER_SETTLED + 5).offset).toBeCloseTo(0, 6);
  });

  it("pops up from below before the landing", () => {
    const start = bannerState(0);
    expect(start.offset).toBeGreaterThan(50);
    expect(start.opacity).toBe(0);
    expect(start.fall).toBe(0);
    expect(bannerState(BANNER_POP).offset).toBeCloseTo(0, 6);
  });
});
