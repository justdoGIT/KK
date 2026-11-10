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
