import { useEffect, useState, type RefObject } from "react";
import type { JourneyClock } from "../../../scene/astronaut/journey-clock.ts";
import { onFrame } from "../../../motion/frame.ts";
import { useGuidedScroll } from "../../../motion/guided-scroll.ts";
import { getLenis } from "../../../motion/smooth-scroll.ts";
import { paintJourney, type JourneyLayout } from "./journey-paint.ts";
import { clamp01, phaseRatio } from "./journey-timeline.ts";

export type JourneyElements = {
  section: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  backdrop: RefObject<HTMLDivElement | null>;
  theme: RefObject<HTMLDivElement | null>;
  world: RefObject<HTMLDivElement | null>;
  hero: RefObject<HTMLDivElement | null>;
  cardEdge: RefObject<HTMLDivElement | null>;
  bezel: RefObject<HTMLDivElement | null>;
  intro: RefObject<HTMLDivElement | null>;
  contact: RefObject<HTMLDivElement | null>;
  contactMover: RefObject<HTMLDivElement | null>;
  contactHeading: RefObject<HTMLHeadingElement | null>;
  titleLines: RefObject<(HTMLElement | null)[]>;
  clock: RefObject<JourneyClock>;
};

/** The authored tunnel cruise stops before the glass-break finale. */
const CRUISE_TARGET = 0.62;
const CRUISE_SPEED = 240;
/** Gap between the heading's bottom edge and the card's top edge (px). */
const HEADING_CLEARANCE = 20;

/**
 * Measures everything painting needs. Runs on mount and whenever the stage,
 * card, heading, or document resizes. The heading's bottom becomes the card's
 * minimum top (`--contact-heading-clear`), so the card never slides over it.
 */
function measure(els: JourneyElements, layout: JourneyLayout): void {
  const section = els.section.current;
  const stage = els.stage.current;
  const contact = els.contact.current;
  const mover = els.contactMover.current;
  const heading = els.contactHeading.current;
  if (!section || !stage) return;
  layout.sectionTop = section.getBoundingClientRect().top + window.scrollY;
  layout.scrollable = section.offsetHeight - window.innerHeight;
  layout.width = stage.clientWidth;
  layout.height = stage.clientHeight;
  // The nav bar is sticky at the viewport top, and so is the pinned stage.
  layout.navBottom = document.querySelector<HTMLElement>(".nav-bar")?.offsetHeight ?? 0;
  if (heading && contact) {
    contact.style.setProperty("--contact-heading-clear", `${heading.offsetTop + heading.offsetHeight + HEADING_CLEARANCE}px`);
    layout.headingWidth = heading.offsetWidth;
    layout.headingCentre = heading.offsetLeft;
  }
  if (contact) layout.cssScale = Number.parseFloat(getComputedStyle(contact).getPropertyValue("--contact-scale")) || 1;
  if (mover) {
    layout.moverWidth = mover.offsetWidth;
    layout.moverHeight = mover.offsetHeight;
    layout.moverTop = mover.offsetTop;
  }
}

/**
 * Drives the pinned astronaut journey on the shared frame scheduler: the read
 * phase turns the scroll position into progress from cached layout, and the
 * write phase paints every DOM layer and the clock the canvases render from.
 * Returns whether the section is near (mount canvases) and on screen (render).
 */
export function useJourneyDriver(els: JourneyElements): { near: boolean; active: boolean } {
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  useGuidedScroll(els.section, near, CRUISE_TARGET, CRUISE_SPEED);

  useEffect(() => {
    const section = els.section.current;
    if (!section) return;
    const nearObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, {
      rootMargin: "250% 0px 250% 0px",
    });
    const activeObserver = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 });
    nearObserver.observe(section);
    activeObserver.observe(section);
    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [els.section]);

  useEffect(() => {
    if (!near) return;
    const layout: JourneyLayout = {
      sectionTop: 0,
      scrollable: 0,
      width: 1,
      height: 1,
      cssScale: 1,
      moverWidth: 0,
      moverHeight: 0,
      moverTop: 0,
      headingWidth: 0,
      headingCentre: 0,
      navBottom: 0,
    };
    let dirty = true;
    let target = 0;
    let painted = -1;

    const invalidate = () => {
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(invalidate);
    for (const el of [els.stage.current, els.contactMover.current, els.contactHeading.current, document.body]) {
      if (el) resizeObserver.observe(el);
    }
    window.addEventListener("resize", invalidate);

    const stopRead = onFrame("read", () => {
      if (dirty) {
        measure(els, layout);
        dirty = false;
        painted = -1;
      }
      const scrolled = (getLenis()?.scroll ?? window.scrollY) - layout.sectionTop;
      target = layout.scrollable > 0 ? clamp01(scrolled / layout.scrollable) : 0;
    });
    const stopWrite = onFrame("write", (time) => {
      const clock = els.clock.current;
      clock.t = target;
      clock.width = layout.width;
      clock.height = layout.height;
      // Before the finale, painting depends on progress alone: skip unchanged frames.
      if (target === painted && phaseRatio(target, "wait") === 0) return;
      paintJourney(els, layout, target, time / 1000);
      painted = target;
    });
    return () => {
      stopRead();
      stopWrite();
      resizeObserver.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [near, els]);

  return { near, active };
}
