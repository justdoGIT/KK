import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AstronautSpaceJourney } from "../components/ui/AstronautSpaceJourney.tsx";

vi.mock("../motion/use-motion-mode.ts", () => ({ useMotionMode: () => "enhanced" }));
vi.mock("../scene/useCapability.ts", () => ({ checkWebGL: () => true }));
vi.mock("../components/ui/astronaut/useJourneyDriver.ts", () => ({
  useJourneyDriver: () => ({ near: false, active: false }),
}));

afterEach(() => vi.restoreAllMocks());

function smallScreen(matches: boolean): void {
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches, media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false,
  }));
}

const contact = <a href="mailto:hello@example.com">Start a Conversation</a>;

describe("contact finale layout", () => {
  it("flows after the pinned journey on phones and short screens", () => {
    smallScreen(true);
    const { container } = render(<AstronautSpaceJourney>{contact}</AstronautSpaceJourney>);
    const journey = screen.getByLabelText("Mission launch sequence");
    const banner = container.querySelector(".aj-contact-flow");

    expect(banner).not.toBeNull();
    expect(journey.contains(banner)).toBe(false);
    expect(journey.compareDocumentPosition(banner!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The scaled card (0.54 on an iPhone 13) is what made its text and buttons too small.
    expect(journey.querySelector(".contact-banner-mover")).toBeNull();
    expect(banner).toContainElement(screen.getByRole("link", { name: "Start a Conversation" }));
    expect(banner).toHaveTextContent("innovate");
  });

  it("keeps the card inside the pinned stage on large screens", () => {
    smallScreen(false);
    const { container } = render(<AstronautSpaceJourney>{contact}</AstronautSpaceJourney>);
    const journey = screen.getByLabelText("Mission launch sequence");

    expect(container.querySelector(".aj-contact-flow")).toBeNull();
    expect(journey.querySelector(".aj-stage .contact-banner-mover")).toContainElement(
      screen.getByRole("link", { name: "Start a Conversation" }),
    );
  });
});
