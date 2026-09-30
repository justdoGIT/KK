import { useEffect, useState, type RefObject } from "react";
import type { JourneyClock } from "../../../scene/astronaut/journey-clock.ts";
import {
  ARRIVE_AT,
  clamp01,
  frameRect,
  heroUnmasked,
  phaseAt,
  phaseRatio,
  smoothstep,
  type FrameRect,
} from "./journey-timeline.ts";

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
  titleLines: RefObject<(HTMLElement | null)[]>;
  end: RefObject<HTMLDivElement | null>;
  clock: RefObject<JourneyClock>;
};

/** Wait-phase ratio at which the finale heading pops, once the wave has begun. */
const TITLE_POP_AT = ARRIVE_AT * 0.8;

/** Slow scroll cruise: start window, destination, and speed in px per second. */
const CRUISE_ARM = 0.28;
const CRUISE_TARGET = 0.62;
const CRUISE_SPEED = 240;

function backOut(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

function clipFor(rect: FrameRect, width: number, height: number): string {
  const right = width - rect.x - rect.width;
  const bottom = height - rect.y - rect.height;
  return `inset(${rect.y.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${rect.x.toFixed(1)}px round ${rect.radius.toFixed(1)}px)`;
}

function placeRect(el: HTMLElement, rect: FrameRect): void {
  el.style.width = `${rect.width.toFixed(1)}px`;
  el.style.height = `${rect.height.toFixed(1)}px`;
  el.style.borderRadius = `${rect.radius.toFixed(1)}px`;
  el.style.transform = `translate3d(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px, 0) rotate(${rect.rotation.toFixed(3)}deg)`;
}

function applyMask(el: HTMLElement, rect: FrameRect | null, width: number, height: number): void {
  if (!rect) {
    el.style.clipPath = "none";
    el.style.transform = "none";
    return;
  }
  el.style.clipPath = clipFor(rect, width, height);
  el.style.transformOrigin = `${(rect.x + rect.width / 2).toFixed(1)}px ${(rect.y + rect.height / 2).toFixed(1)}px`;
  el.style.transform = rect.rotation ? `rotate(${rect.rotation.toFixed(3)}deg)` : "none";
}

function paint(els: JourneyElements, t: number): void {
  const stage = els.stage.current;
  if (!stage) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const rect = frameRect(t, width, height);
  const phase = phaseAt(t);
  if (stage.dataset.phase !== phase) stage.dataset.phase = phase;
  // Clear the close-up before the transparent lounge canvas overlaps this
  // stage; otherwise the finale astronaut appears behind the reclined one.
  stage.style.opacity = (1 - smoothstep(0.94, 1, t)).toFixed(3);

  const world = els.world.current;
  if (world) {
    world.style.visibility = phaseRatio(t, "drop") >= 1 ? "hidden" : "visible";
    applyMask(world, rect, width, height);
  }
  const hero = els.hero.current;
  if (hero) applyMask(hero, heroUnmasked(t) ? null : rect, width, height);

  const frameIn = phaseRatio(t, "frameIn");
  const white = phaseRatio(t, "whiteTunnel");
  const drop = phaseRatio(t, "drop");

  // After the break the black void gives way to the site's own background:
  // the backdrop fades out so the page colour shows, and the theme glows fade in.
  const themed = smoothstep(0.15, 0.95, drop);
  const backdrop = els.backdrop.current;
  if (backdrop) {
    const navy = smoothstep(0.3, 1, white) * (1 - smoothstep(0.2, 0.9, drop));
    backdrop.style.opacity = (frameIn * (1 - themed)).toFixed(3);
    backdrop.style.backgroundColor = `rgb(${(4 * navy).toFixed(0)}, ${(8 * navy).toFixed(0)}, ${(52 * navy).toFixed(0)})`;
  }
  const theme = els.theme.current;
  if (theme) theme.style.opacity = themed.toFixed(3);

  const cardEdge = els.cardEdge.current;
  if (cardEdge) {
    placeRect(cardEdge, rect);
    cardEdge.style.opacity = (1 - smoothstep(0.05, 0.6, frameIn)).toFixed(3);
  }
  const bezel = els.bezel.current;
  if (bezel) {
    placeRect(bezel, rect);
    const shown = smoothstep(0.35, 1, white) * (1 - smoothstep(0.7, 1, drop));
    bezel.style.opacity = shown.toFixed(3);
    bezel.style.visibility = shown > 0.001 ? "visible" : "hidden";
  }

  const intro = els.intro.current;
  if (intro) {
    const fade = smoothstep(0, 0.4, frameIn);
    intro.style.opacity = (1 - fade).toFixed(3);
    intro.style.transform = `translate3d(0, ${(-60 * fade).toFixed(1)}px, 0)`;
  }

  const title = phaseRatio(t, "title");
  const leave = smoothstep(0, 0.12, phaseRatio(t, "blackTunnel"));
  els.titleLines.current?.forEach((line, i) => {
    if (!line) return;
    const enter = smoothstep(0.1 + i * 0.1, 0.4 + i * 0.1, title);
    line.style.opacity = (enter * (1 - leave)).toFixed(3);
    line.style.transform = `translate3d(0, ${((1 - enter) * 70 - leave * 40).toFixed(1)}px, 0)`;
  });

  const heading = els.end.current;
  if (heading) {
    const pop = clamp01((phaseRatio(t, "wait") - TITLE_POP_AT) / 0.16);
    const eased = pop > 0 ? backOut(pop) : 0;
    heading.style.opacity = pop.toFixed(3);
    heading.style.visibility = pop > 0.001 ? "visible" : "hidden";
    heading.style.transform = `translate3d(0, ${((1 - eased) * 28).toFixed(1)}px, 0) scale(${(0.82 + 0.18 * eased).toFixed(3)})`;
  }
}

/**
 * Drives the pinned astronaut journey: tracks the section's scroll progress,
 * damps it, writes it to the shared clock for the canvases, and paints the DOM
 * layers imperatively (no React renders per frame). Returns whether the
 * section is near (mount canvases) and on screen (run the render loops).
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
    let rafId = 0;
    let cruising = false;
    let cruised = false;
    let armed = false;
    let lastFrame = performance.now();
    let touchY: number | null = null;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        armed = false;
        cruising = false;
      } else if (event.deltaY > 0) {
        armed = true;
      }
    };
    const onTouchStart = (event: TouchEvent) => {
      cruising = false;
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? null;
      if (y !== null && touchY !== null && y < touchY) armed = true;
      touchY = y;
    };
    const onKeyDown = () => {
      armed = false;
      cruising = false;
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const now = performance.now();
      // Clamped so a stalled frame cannot teleport the reader.
      const elapsed = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      const section = els.section.current;
      const clock = els.clock.current;
      if (!section || !clock) return;
      const scrollable = section.offsetHeight - window.innerHeight;
      const sectionTop = section.getBoundingClientRect().top;
      const target = scrollable > 0 ? clamp01(-sectionTop / scrollable) : 0;
      clock.t = target;

      // Slow scroll scrub: once the pinned card is on screen and the reader has
      // shown downward intent, the story cruises through the tunnel on its own.
      // A reverse wheel, touch, or key hands control straight back.
      if (target < 0.005) cruised = false;
      const pinned = sectionTop <= 0 && target < CRUISE_ARM;
      if (armed && pinned && !cruising && !cruised) cruising = true;
      if (cruising) {
        const remaining = (CRUISE_TARGET - target) * scrollable;
        if (remaining <= 2) {
          cruising = false;
          cruised = true;
        } else {
          // `scroll-behavior: smooth` would animate every frame's nudge and the
          // page would never actually advance, so the cruise steps instantly.
          const step = Math.min(CRUISE_SPEED * elapsed, remaining);
          window.scrollTo({ top: window.scrollY + step, behavior: "instant" });
        }
      }

      const stageEl = els.stage.current;
      if (stageEl) {
        clock.width = stageEl.clientWidth;
        clock.height = stageEl.clientHeight;
      }
      paint(els, clock.t);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(rafId);
    };
  }, [near, els]);

  return { near, active };
}
