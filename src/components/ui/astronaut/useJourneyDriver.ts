import { useEffect, useState, type RefObject } from "react";
import type { JourneyClock } from "../../../scene/astronaut/journey-clock.ts";
import {
  clamp01,
  frameRect,
  heroUnmasked,
  phaseAt,
  phaseRatio,
  smoothstep,
  type FrameRect,
} from "./journey-timeline.ts";
import {
  LAND_AT,
  ZOOM_OUT_END,
  ZOOM_OUT_START,
  bannerState,
  contactPoseMode,
} from "../contact/banner-timeline.ts";

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
/** Fraction of the card width where the astronaut stands; the zoom pivots on his feet. */
const STAND_AT = 0.35;
/** Close-up: where the card's front-top edge sits, as a fraction of stage height. */
const CLOSE_UP_DECK = 0.92;
/** Astronaut height : card width, held through the zoom so pad and astronaut shrink as one. */
const BODY_RATIO = 0.3;
/** Astronaut height at touchdown as a stage fraction — his size at the end of the drop. */
const LANDING_BODY = 0.58;

function paintFinale(els: JourneyElements, t: number, height: number, nowSec: number): void {
  const root = els.contact.current;
  const mover = els.contactMover.current;
  const heading = els.contactHeading.current;
  const stage = els.stage.current;
  if (!root || !mover || !heading || !stage) return;

  // ── 1. DOM READS (before any writes to avoid forced layout) ─────────────
  const cssScale = Number.parseFloat(getComputedStyle(root).getPropertyValue("--contact-scale")) || 1;
  const moverOffsetWidth = mover.offsetWidth;
  const moverOffsetHeight = mover.offsetHeight;
  const moverOffsetTop = mover.offsetTop;
  const stageBox = stage.getBoundingClientRect();

  // ── 2. COMPUTE ──────────────────────────────────────────────────────────
  const progress = phaseRatio(t, "wait");
  const finale = els.clock.current.finale;
  finale.progress = progress;

  if (progress >= 0.28) {
    if (!root.dataset.finaleFirstSeen) root.dataset.finaleFirstSeen = nowSec.toFixed(2);
  } else {
    delete root.dataset.finaleFirstSeen;
  }
  const firstSeen = root.dataset.finaleFirstSeen ? parseFloat(root.dataset.finaleFirstSeen) : nowSec;
  const idleElapsed = Math.max(0, nowSec - firstSeen);

  finale.mode = contactPoseMode(progress, finale.interaction, idleElapsed);

  const reveal = smoothstep(0, 0.06, progress);
  const isSettled = progress >= ZOOM_OUT_END;
  const sinceLanding = Math.max(0, (progress - LAND_AT) * 3);
  const frame = bannerState(progress, sinceLanding);
  // `mover.offsetHeight` is the card's unscaled layout height (CSS transforms
  // don't affect it), so this shrinks the settled scale just enough to keep
  // the card's bottom edge inside the pinned 100vh stage instead of being
  // clipped by `.contact-banner`'s `overflow:clip` — the CSS breakpoints
  // alone only covered height < 700px, leaving the common 700-950px laptop
  // range free to overflow.
  const fitScale = moverOffsetHeight > 0
    ? Math.max(0.55, Math.min(1, (stageBox.height - moverOffsetTop - 24) / moverOffsetHeight))
    : 1;
  const base = Math.min(cssScale, fitScale);
  const baseDeckWidth = Math.max(1, moverOffsetWidth * base);
  const closeUpZoom = Math.max(1, (height * LANDING_BODY) / BODY_RATIO / baseDeckWidth);
  const zoom = 1 + (closeUpZoom - 1) * frame.closeUp;
  const scale = base * zoom;
  const pivotX = (STAND_AT - 0.5) * moverOffsetWidth;
  const shiftX = pivotX * (base - scale);
  const shiftY = frame.closeUp * (height * CLOSE_UP_DECK - moverOffsetTop);
  const translatedY = frame.offset + shiftY;
  const attach = smoothstep(ZOOM_OUT_START - 0.04, ZOOM_OUT_START + 0.08, progress);

  // Card rect for THIS frame, derived analytically from the same scale/
  // shift values driving `mover.style.transform` below, instead of reading
  // `mover.getBoundingClientRect()` — that rect reflects last frame's
  // transform (one paint behind), and during active scroll that lag was
  // visible as a gap between the 3D landing deck (placed from this data)
  // and the actually-rendered card edge. `.contact-banner-mover`'s
  // transform-origin is 50% 0% (top-center, see contact-banner.css), and
  // it's horizontally centred by `margin: auto` inside `.contact-banner-
  // stage`'s symmetric side padding, so its pre-transform left edge is
  // just (stage width - mover width) / 2 regardless of that padding.
  const left0 = (stageBox.width - moverOffsetWidth) / 2;
  const cardLeft = left0 + (moverOffsetWidth * (1 - scale)) / 2 + shiftX;
  const cardTop = moverOffsetTop + translatedY;
  const cardWidth = moverOffsetWidth * scale;

  // Update finale anchor data from the analytic rect above.
  finale.cardLeft = cardLeft;
  finale.cardTop = cardTop;
  finale.cardWidth = cardWidth;
  finale.footX = finale.cardLeft + cardWidth * STAND_AT;
  const headroom = Math.max(40, finale.cardTop - 16) / 1.1;
  finale.bodyHeight = Math.min(cardWidth * BODY_RATIO, height * LANDING_BODY, headroom);

  // ── 3. DOM WRITES ───────────────────────────────────────────────────────
  root.dataset.finaleProgress = progress.toFixed(3);
  root.dataset.astronautMode = finale.mode;
  root.style.opacity = reveal.toFixed(3);
  root.style.visibility = reveal > 0.001 ? "visible" : "hidden";
  // Pointer events unlock as soon as the card visually reads as attached
  // (attach≈1), not only once the slower zoom-out fully settles — otherwise
  // the button looks clickable for ~8% of scroll before hover actually works.
  const interactive = attach >= 0.98;
  root.style.pointerEvents = interactive ? "auto" : "none";
  if (isSettled) {
    root.dataset.finaleSettled = "true";
    mover.dataset.settled = "true";
  } else {
    delete root.dataset.finaleSettled;
    delete mover.dataset.settled;
  }
  mover.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${translatedY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
  mover.style.opacity = attach.toFixed(3);
  mover.style.visibility = attach > 0.001 ? "visible" : "hidden";
  heading.style.opacity = frame.heading.toFixed(3);
  heading.style.visibility = frame.heading > 0.001 ? "visible" : "hidden";
  heading.style.transform = `translate3d(-50%, ${((1 - frame.heading) * 26).toFixed(1)}px, 0) scale(${(0.86 + frame.heading * 0.14).toFixed(3)})`;
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

function paint(els: JourneyElements, t: number, nowSec = 0): void {
  const stage = els.stage.current;
  if (!stage) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const rect = frameRect(t, width, height);
  const phase = phaseAt(t);
  if (stage.dataset.phase !== phase) stage.dataset.phase = phase;
  // The contact card and astronaut remain in this pinned stage through t=1.
  stage.style.opacity = "1";

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
  paintFinale(els, t, height, nowSec);
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
      const nowSec = now / 1000;
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
      paint(els, clock.t, nowSec);
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
