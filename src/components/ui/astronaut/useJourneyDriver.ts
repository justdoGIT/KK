import { useEffect, useState, type RefObject } from "react";
import type { JourneyClock } from "../../../scene/astronaut/journey-clock.ts";
import { onFrame } from "../../../motion/frame.ts";
import { getLenis, haltScroll, scrollToY } from "../../../motion/smooth-scroll.ts";
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

/** Slow scroll cruise: start window, destination, and speed in px per second. */
const CRUISE_ARM = 0.28;
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

  useEffect(() => {
    const section = els.section.current;
    if (!section) return;
    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "100% 0px 100% 0px",
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
    let cruising = false;
    let cruised = false;
    let armed = false;
    let touchY: number | null = null;
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

    const cancelCruise = () => {
      armed = false;
      if (!cruising) return;
      cruising = false;
      haltScroll();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) cancelCruise();
      else if (event.deltaY > 0) armed = true;
    };
    const onTouchStart = (event: TouchEvent) => {
      cancelCruise();
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? null;
      if (y !== null && touchY !== null && y < touchY) armed = true;
      touchY = y;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", cancelCruise);

    const stopRead = onFrame("read", () => {
      if (dirty) {
        measure(els, layout);
        dirty = false;
        painted = -1;
      }
      const scrolled = (getLenis()?.scroll ?? window.scrollY) - layout.sectionTop;
      target = layout.scrollable > 0 ? clamp01(scrolled / layout.scrollable) : 0;
      // Slow scroll scrub: once the pinned card is on screen and the reader has
      // shown downward intent, the story cruises through the tunnel on its own,
      // at a constant speed through the one smooth-scroll owner. A reverse
      // wheel, touch, or key hands control straight back.
      if (target < 0.005) cruised = false;
      if (armed && scrolled >= 0 && target < CRUISE_ARM && !cruising && !cruised) {
        cruising = true;
        scrollToY(layout.sectionTop + CRUISE_TARGET * layout.scrollable, {
          duration: ((CRUISE_TARGET - target) * layout.scrollable) / CRUISE_SPEED,
          easing: (x) => x,
          onComplete: () => {
            cruising = false;
            cruised = true;
          },
        });
      }
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
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", cancelCruise);
      if (cruising) haltScroll();
    };
  }, [near, els]);

  return { near, active };
}
