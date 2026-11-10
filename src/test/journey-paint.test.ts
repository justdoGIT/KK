import { expect, it } from "vitest";
import { paintJourney, type JourneyLayout } from "../components/ui/astronaut/journey-paint.ts";
import type { JourneyElements } from "../components/ui/astronaut/useJourneyDriver.ts";
import { createFinaleClock } from "../scene/astronaut/journey-clock.ts";

it("keeps settled collaboration layers unchanged while the astronaut animates", async () => {
  const div = () => ({ current: document.createElement("div") });
  const els: JourneyElements = {
    section: div(), stage: div(), backdrop: div(), theme: div(), world: div(),
    hero: div(), cardEdge: div(), bezel: div(), intro: div(), contact: div(),
    contactMover: div(), contactHeading: { current: document.createElement("h2") },
    titleLines: { current: [document.createElement("span")] },
    clock: { current: { t: 0.98, width: 1440, height: 900, finale: createFinaleClock() } },
  };
  const layout: JourneyLayout = {
    sectionTop: 0, scrollable: 9000, width: 1440, height: 900, cssScale: 0.85,
    moverWidth: 1200, moverHeight: 550, moverTop: 230,
    headingWidth: 560, headingCentre: 1008, headingClearance: 180, navBottom: 56,
  };
  const nodes = Object.values(els).flatMap(ref => ref.current instanceof HTMLElement ? [ref.current] : []);
  let changes = 0;
  paintJourney(els, layout, 0.98, 1);
  const observer = new MutationObserver(entries => { changes += entries.length; });
  nodes.forEach(node => observer.observe(node, { attributes: true }));
  for (let frame = 0; frame < 20; frame++) paintJourney(els, layout, 0.98, 1 + frame / 60);
  await Promise.resolve();
  observer.disconnect();
  expect(changes).toBe(0);
});

it("keeps the complete phone banner visible at the final scroll position", () => {
  const div = () => ({ current: document.createElement("div") });
  const els: JourneyElements = {
    section: div(), stage: div(), backdrop: div(), theme: div(), world: div(),
    hero: div(), cardEdge: div(), bezel: div(), intro: div(), contact: div(),
    contactMover: div(), contactHeading: { current: document.createElement("h2") },
    titleLines: { current: [] },
    clock: { current: { t: 1, width: 390, height: 844, finale: createFinaleClock() } },
  };
  const layout: JourneyLayout = {
    sectionTop: 0, scrollable: 2954, width: 390, height: 844, cssScale: 1,
    moverWidth: 358, moverHeight: 438, moverTop: 270,
    headingWidth: 358, headingCentre: 195, headingClearance: 130, navBottom: 56,
  };
  paintJourney(els, layout, 1, 20);
  expect(els.contactMover.current!.style.opacity).toBe("1");
  expect(els.contactMover.current!.style.visibility).toBe("visible");
  expect(els.contactHeading.current!.style.opacity).toBe("1");
  expect(els.clock.current.finale.progress).toBe(1);
  expect(els.clock.current.finale.bodyHeight).toBeGreaterThan(40);
});
