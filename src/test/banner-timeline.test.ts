import { describe, expect, it } from "vitest";
import {
  BANNER_SETTLED,
  DIP_DEPTH,
  DIP_DOWN,
  HEADING_AT,
  LAND_AT,
  HOVER_DANCE_END,
  HOVER_RECLINE_END,
  HOVER_SEQUENCE_END,
  LAND_START,
  SIT_AT,
  ZOOM_OUT_END,
  ZOOM_OUT_START,
  bannerState,
  contactPoseMode,
} from "../components/ui/contact/banner-timeline.ts";

describe("contact banner landing", () => {
  it("keeps the landing deck still while the astronaut descends", () => {
    expect(bannerState(LAND_START, 0)).toEqual({ offset: 0, fall: 0, heading: 0, closeUp: 1 });
    expect(bannerState((LAND_START + LAND_AT) / 2, 0).fall).toBeGreaterThan(0);
    expect(bannerState(LAND_AT, 0).fall).toBe(1);
    expect(bannerState(LAND_AT, 0).offset).toBe(0);
  });

  it("reveals the invitation only after touchdown", () => {
    expect(HEADING_AT).toBeGreaterThan(LAND_AT);
    expect(bannerState(LAND_AT, 0).heading).toBe(0);
    expect(bannerState(HEADING_AT + 0.1, 0).heading).toBe(1);
  });

  it("waves in the close-up, then zooms out before sitting upright", () => {
    expect(bannerState(LAND_AT, 0).closeUp).toBe(1);
    expect(bannerState(HEADING_AT + 0.1, 0).closeUp).toBe(1);
    expect(HEADING_AT + 0.1).toBeLessThanOrEqual(ZOOM_OUT_START);
    expect(contactPoseMode(ZOOM_OUT_START, "none")).toBe("stand");
    expect(bannerState(ZOOM_OUT_END, 0).closeUp).toBe(0);
    expect(SIT_AT).toBeGreaterThanOrEqual(ZOOM_OUT_END);
    expect(contactPoseMode(SIT_AT, "none")).toBe("sit");
    expect(contactPoseMode(1, "none")).toBe("sit");
  });

  it("sags quickly but rises back slowly and settles flat", () => {
    expect(bannerState(LAND_AT, DIP_DOWN).offset).toBeCloseTo(DIP_DEPTH, 6);
    let half = DIP_DOWN;
    while (bannerState(LAND_AT, half).offset > DIP_DEPTH / 2) half += 0.01;
    expect(half - DIP_DOWN).toBeGreaterThan(DIP_DOWN * 3);
    expect(bannerState(LAND_AT, BANNER_SETTLED).offset).toBeCloseTo(0, 6);
  });

  it("selects landing, standing, seated, and interactive upright poses", () => {
    expect(contactPoseMode(LAND_AT - 0.01, "dance")).toBe("landing");
    expect(contactPoseMode(LAND_AT, "none")).toBe("stand");
    expect(contactPoseMode(SIT_AT, "none")).toBe("sit");
    expect(contactPoseMode(1, "none")).toBe("sit");
    expect(contactPoseMode(SIT_AT, "wait")).toBe("wait");
  });

  it("loops recline, dance, and moonwalk from CTA entry time", () => {
    expect(contactPoseMode(SIT_AT, "dance", 0)).toBe("lie");
    expect(contactPoseMode(SIT_AT, "dance", HOVER_RECLINE_END - 0.01)).toBe("lie");
    expect(contactPoseMode(SIT_AT, "dance", HOVER_RECLINE_END)).toBe("dance");
    expect(contactPoseMode(SIT_AT, "dance", HOVER_DANCE_END)).toBe("moonwalk");
    expect(contactPoseMode(SIT_AT, "dance", HOVER_SEQUENCE_END)).toBe("lie");
  });
});
