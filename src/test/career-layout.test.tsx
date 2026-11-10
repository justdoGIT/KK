import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CareerTimeline } from "../components/sections/CareerTimeline.tsx";
import { career } from "../content/career.ts";
import { useCareerDriver } from "../components/sections/career/useCareerDriver.ts";

vi.mock("../motion/use-motion-mode.ts", () => ({ useMotionMode: () => "enhanced" }));
vi.mock("../scene/useCapability.ts", () => ({ checkWebGL: () => true }));
vi.mock("../components/sections/career/useCareerDriver.ts", () => ({
  useCareerDriver: vi.fn(() => ({ near: false, active: false, stage: 0 })),
}));

afterEach(() => vi.restoreAllMocks());

function layoutQuery(flow: boolean, mobile = false): void {
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches: media === "(max-width: 767px), (max-width: 1023px) and (max-height: 719px)" ? mobile : flow,
    media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false,
  }));
}

describe("responsive career layout", () => {
  it("reuses natural flow without a viewport height or animated driver", () => {
    layoutQuery(true);
    render(<CareerTimeline />);
    const section = screen.getByLabelText("Career timeline");
    expect(section).toHaveClass("career-journey--static");
    expect(section.style.height).toBe("");
    expect(section.querySelector(".career-screen")).toBeNull();
    expect(vi.mocked(useCareerDriver).mock.lastCall?.[1]).toBe(false);
  });

  it("keeps every role, accomplishment and technology reachable in flow", () => {
    layoutQuery(true);
    render(<CareerTimeline />);
    const section = screen.getByLabelText("Career timeline");
    for (const entry of career) {
      const button = within(section).getByRole("button", {
        name: new RegExp(entry.organization.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      });
      if (button.getAttribute("aria-expanded") !== "true") fireEvent.click(button);
      const panel = document.getElementById(`disclosure-panel-${entry.id}`)!;
      expect(within(panel).getByText(entry.summary)).toBeVisible();
      for (const text of [...entry.accomplishments, ...entry.technologies]) {
        expect(within(panel).getByText(text)).toBeVisible();
      }
    }
  });

  it("retains the twelve-viewport film and driver on supported viewports", () => {
    layoutQuery(false);
    render(<CareerTimeline />);
    const section = screen.getByLabelText("Career timeline");
    expect(section).not.toHaveClass("career-journey--static");
    expect(section.style.height).toBe("1200vh");
    expect(section.querySelector(".career-screen")).not.toBeNull();
    expect(vi.mocked(useCareerDriver).mock.lastCall?.[1]).toBe(true);
  });

  it("keeps the film and all five role controls on phones", () => {
    layoutQuery(true, true);
    render(<CareerTimeline />);
    const section = screen.getByLabelText("Career timeline");
    expect(section).toHaveClass("career-journey--mobile");
    expect(section).not.toHaveClass("career-journey--static");
    expect(section.style.height).toBe("1200svh");
    expect(section.querySelector(".career-screen")).not.toBeNull();
    expect(within(screen.getByLabelText("Career evolution stages")).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByLabelText("Career role details")).toHaveAttribute("tabindex", "0");
    expect(vi.mocked(useCareerDriver).mock.lastCall?.[1]).toBe(true);
  });
});
