import { afterEach, describe, expect, it, vi } from "vitest";
import { dprRange } from "../scene/render-quality.ts";

afterEach(() => vi.restoreAllMocks());

describe("canvas resolution", () => {
  it.each([1, 0.8])("does not supersample a display with pixel ratio %s", (ratio) => {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(ratio);
    expect(dprRange()).toEqual([ratio, ratio]);
  });

  it("caps high-density desktop and phone displays", () => {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(3);
    expect(dprRange()).toEqual([1, 2]);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    expect(dprRange()).toEqual([1, 1.5]);
  });
});
