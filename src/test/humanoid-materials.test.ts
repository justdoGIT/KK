import { describe, expect, it } from "vitest";
import { humanoidMaterialStyle } from "../scene/career/humanoid.ts";

describe("humanoid material theme", () => {
  it("uses blue armor, white panels, and a dark visor", () => {
    expect(humanoidMaterialStyle("Main").color).toBe("#38bdf8");
    expect(humanoidMaterialStyle("Grey").color).toBe("#eef8ff");
    expect(humanoidMaterialStyle("Black").color).toBe("#06111f");
  });
});
