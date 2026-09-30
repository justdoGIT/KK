import { describe, expect, it } from "vitest";
import { humanoidMaterialStyle } from "../scene/career/humanoid.ts";

describe("humanoid material theme", () => {
  it("uses cream shell, orange accents, and a dark visor", () => {
    expect(humanoidMaterialStyle("Main").color).toBe("#f6f1e7");
    expect(humanoidMaterialStyle("Grey").color).toBe("#e0812f");
    expect(humanoidMaterialStyle("Black").color).toBe("#15151d");
  });
});
