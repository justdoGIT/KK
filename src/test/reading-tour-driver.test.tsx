import { act, render } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { FrameCallback } from "../motion/frame.ts";
import { getReadingTour, updateReadingTour } from "../motion/reading-tour-state.ts";
import { useReadingTourDriver } from "../motion/use-reading-tour.ts";

const clock = vi.hoisted(() => ({ callbacks: new Set<FrameCallback>() }));
vi.mock("../motion/frame.ts", () => ({ onFrame: (_phase: string, callback: FrameCallback) => {
  clock.callbacks.add(callback);
  return () => { clock.callbacks.delete(callback); };
} }));
vi.mock("../motion/use-motion-mode.ts", () => ({ useMotionMode: () => "reduced" }));
vi.mock("../motion/smooth-scroll.ts", () => ({
  getLenis: () => null, stopCruise: () => {}, scrollToY: (y: number) => { vi.stubGlobal("scrollY", y); },
}));
vi.mock("../motion/tour-plan.ts", () => ({ buildTourPlan: () => [
  { id: "intro", chapter: "#test", label: "Intro", target: () => 0, text: () => "Read this.", seconds: 10 },
  { id: "next", chapter: "#test", label: "Next", target: () => 1000, text: () => "Read this." },
] }));

function Driver() { useReadingTourDriver(); return null; }
const status = (value: "playing" | "paused") => act(() => updateReadingTour({ status: value }));
const run = (seconds: number) => act(() => {
  for (let t = 0; t < seconds; t += 0.05) for (const callback of clock.callbacks) callback(t * 1000, 0.05);
});

beforeEach(() => {
  vi.stubGlobal("scrollY", 0);
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 10000 });
  updateReadingTour({ status: "ready", step: "hero" });
});

it("continues the remaining reading time when Resume is clicked", () => {
  render(<Driver />);
  status("playing");
  run(6);
  expect(getReadingTour().step).toBe("intro");
  status("paused");
  expect(clock.callbacks.size).toBe(0);
  status("playing");
  run(6);
  expect(getReadingTour().step).toBe("next");
});

it("resumes at manually moved content instead of the old chapter start", () => {
  render(<Driver />);
  status("playing");
  run(2);
  status("paused");
  vi.stubGlobal("scrollY", 1200);
  status("playing");
  run(2);
  expect(getReadingTour().step).toBe("next");
  expect(scrollY).toBe(1200);
});
