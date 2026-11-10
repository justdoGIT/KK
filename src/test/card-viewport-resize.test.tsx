import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CaseStudies } from "../components/sections/CaseStudies.tsx";

vi.mock("../motion/use-motion-mode.ts", () => ({ useMotionMode: () => "enhanced" }));
vi.mock("../motion/guided-scroll.ts", () => ({ useGuidedScroll: () => {} }));
vi.mock("../motion/scroll-frame.ts", async importOriginal => ({
  ...await importOriginal<typeof import("../motion/scroll-frame.ts")>(),
  useScrollFrame: () => {},
}));
vi.mock("../components/ui/CardBackArtwork.tsx", () => ({ CardBackArtwork: () => null }));
vi.mock("../components/sections/CaseStudyCardContent.tsx", () => ({
  CardFrontContent: () => <div className="card-front-scroll-body">Details</div>,
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("switches retained cards to the short-screen layout when media-query notifications lag", () => {
  const observers: { callback: ResizeObserverCallback; observer: ResizeObserver }[] = [];
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) {
      observers.push({ callback, observer: this as unknown as ResizeObserver });
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal("innerWidth", 1440);
  vi.stubGlobal("innerHeight", 1000);
  vi.spyOn(window, "matchMedia").mockImplementation(media => ({
    // Chromium can report the preceding desktop match after device metrics
    // and the layout viewport have already changed to a short screen.
    matches: media.includes("min-height: 720px"), media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false,
  }));
  const { container } = render(<CaseStudies />);
  const section = container.querySelector("#work")!;
  const retained = container.querySelector(".lusion-card-front")!;
  expect(section).not.toHaveClass("is-static");

  // The first resize notification can precede updated viewport metrics.
  act(() => window.dispatchEvent(new Event("resize")));
  act(() => frames.splice(0).forEach(callback => callback(0)));
  vi.stubGlobal("innerHeight", 600);
  act(() => observers.forEach(({ callback, observer }) => callback([], observer)));
  act(() => frames.splice(0).forEach(callback => callback(16)));

  expect(section).toHaveClass("is-static");
  expect(retained.isConnected).toBe(true);
  expect(container.querySelectorAll(".lusion-card-isolated-cell--settled")).toHaveLength(4);
  expect(retained).not.toHaveAttribute("inert");
  expect(retained).not.toHaveAttribute("aria-hidden", "true");
});
