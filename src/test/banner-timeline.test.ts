import { describe, expect, it } from "vitest";
import {
  BANNER_SETTLED,
  DIP_DEPTH,
  DIP_DOWN,
  HEADING_AT,
  LAND_AT,
  LAND_START,
  LOUNGE_AT,
  SIT_AT,
  bannerState,
  contactPoseMode,
} from "../components/ui/contact/banner-timeline.ts";

describe("contact banner landing", () => {
  it("keeps the landing deck still while the astronaut descends", () => {
    expect(bannerState(LAND_START, 0)).toEqual({ offset: 0, fall: 0, heading: 0 });
    expect(bannerState((LAND_START + LAND_AT) / 2, 0).fall).toBeGreaterThan(0);
    expect(bannerState(LAND_AT, 0).fall).toBe(1);
    expect(bannerState(LAND_AT, 0).offset).toBe(0);
  });

  it("reveals the invitation only after touchdown", () => {
    expect(HEADING_AT).toBeGreaterThan(LAND_AT);
    expect(bannerState(LAND_AT, 0).heading).toBe(0);
    expect(bannerState(HEADING_AT + 0.1, 0).heading).toBe(1);
  });

  it("sags quickly but rises back slowly and settles flat", () => {
    expect(bannerState(LAND_AT, DIP_DOWN).offset).toBeCloseTo(DIP_DEPTH, 6);
    let half = DIP_DOWN;
    while (bannerState(LAND_AT, half).offset > DIP_DEPTH / 2) half += 0.01;
    expect(half - DIP_DOWN).toBeGreaterThan(DIP_DOWN * 3);
    expect(bannerState(LAND_AT, BANNER_SETTLED).offset).toBeCloseTo(0, 6);
  });

  it("selects standing, seated, reclining, and interactive poses", () => {
    expect(contactPoseMode(LAND_AT - 0.01, false, "dance")).toBe("landing");
    expect(contactPoseMode(LAND_AT, false, "none")).toBe("stand");
    expect(contactPoseMode(SIT_AT, false, "none")).toBe("sit");
    expect(contactPoseMode(LOUNGE_AT, false, "none")).toBe("lounge");
    expect(contactPoseMode(SIT_AT, true, "none")).toBe("lounge");
    expect(contactPoseMode(SIT_AT, false, "dance")).toBe("dance");
    expect(contactPoseMode(SIT_AT, false, "wait")).toBe("wait");
  });
});
