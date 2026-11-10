import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMediaQuery } from "../motion/use-media-query.ts";

afterEach(() => vi.restoreAllMocks());

function mockQueries(read: () => boolean): void {
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    // Existing lists still reflect the preceding frame; fresh queries see
    // the current viewport before their change notifications are delivered.
    matches: read(), media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false,
  }));
}

it("updates the layout on resize before a retained media query notifies", () => {
  let matches = true;
  mockQueries(() => matches);
  const { result } = renderHook(() => useMediaQuery("(min-height: 720px)"));
  expect(result.current).toBe(true);

  act(() => {
    matches = false;
    window.dispatchEvent(new Event("resize"));
  });
  expect(result.current).toBe(false);
});

it("updates after viewport styles reconcile on the following frame", () => {
  let matches = true;
  let nextFrame: FrameRequestCallback | undefined;
  mockQueries(() => matches);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    nextFrame = callback;
    return 1;
  });
  const { result } = renderHook(() => useMediaQuery("(min-height: 720px)"));

  act(() => { window.dispatchEvent(new Event("resize")); });
  expect(result.current).toBe(true);
  act(() => {
    matches = false;
    nextFrame?.(0);
  });
  expect(result.current).toBe(false);
});
