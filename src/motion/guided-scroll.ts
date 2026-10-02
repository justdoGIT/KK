import { useEffect, type RefObject } from "react";
import { onFrame } from "./frame.ts";
import { cruiseTo, getLenis, stopCruise } from "./smooth-scroll.ts";

// Guided playback for pinned, scroll-driven stories. When a visitor scrolls
// down into one and stops, the story keeps playing forward at its authored
// pace until its resting frame, then hands the page back. Any input — wheel,
// touch, key, click, resize, or programmatic navigation — stops it at once,
// and scrolling up never plays anything.

/** Section progress before which a story never plays: it must be pinned first. */
const START_AT = 0.02;
/** Quiet time after the last wheel or touch input before playback may start. */
const SETTLE_MS = 140;
/** Lenis smoothing distance (px) still treated as settled. */
const SETTLED_PX = 24;
/** Stop waiting for the page to settle after this long. */
const ARM_TIMEOUT_MS = 2500;

export type GuidedPace = {
  /** Section progress (0..1) where playback stops: the story's resting frame. */
  target: number;
  /** Authored seconds for playing from the section start to `target`. */
  seconds: number;
};

/** Where and how fast a section plays from `progress`, or null when it should not. */
export function guidedCruise(
  progress: number,
  top: number,
  scrollable: number,
  pace: GuidedPace,
): { destination: number; speed: number } | null {
  if (scrollable <= 0 || pace.seconds <= 0) return null;
  if (progress < START_AT || progress >= pace.target - 0.005) return null;
  return {
    destination: top + pace.target * scrollable,
    speed: ((pace.target - START_AT) * scrollable) / pace.seconds,
  };
}

type GuidedSection = { element: HTMLElement; pace: GuidedPace };

const sections = new Set<GuidedSection>();
let playing: GuidedSection | null = null;
let stopWatching: (() => void) | null = null;
let armedAt = 0;
let lastInputAt = 0;
let touchY: number | null = null;
let touchStartY: number | null = null;
let observedScroll = 0;
let lastMovementAt = 0;
let touching = false;

function disarm(): void {
  stopWatching?.();
  stopWatching = null;
}

function takeOver(): void {
  disarm();
  playing = null;
  touching = false;
  touchY = null;
  touchStartY = null;
  stopCruise();
}

/** Read phase, only while armed: once the page settles, play the pinned story it rests in. */
function watch(_time: number, delta: number): void {
  const now = performance.now();
  const lenis = getLenis();
  if (!lenis || lenis.isStopped) {
    disarm();
    return;
  }
  if (Math.abs(lenis.actualScroll - observedScroll) > 0.5) {
    observedScroll = lenis.actualScroll;
    lastMovementAt = now;
  }
  if (touching) return;
  const settling = now - lastMovementAt < SETTLE_MS
    || Math.abs(lenis.targetScroll - lenis.animatedScroll) > SETTLED_PX;
  if (now - lastInputAt < SETTLE_MS || (settling && now - armedAt < ARM_TIMEOUT_MS)) return;
  disarm();
  if (settling) return;
  const viewport = window.innerHeight;
  for (const section of sections) {
    const rect = section.element.getBoundingClientRect();
    const scrollable = section.element.offsetHeight - viewport;
    const cruise = guidedCruise(-rect.top / Math.max(1, scrollable), lenis.animatedScroll + rect.top, scrollable, section.pace);
    if (!cruise) continue;
    playing = section;
    // Lenis velocity is px/frame; preserve px/s momentum on any refresh rate.
    const velocity = delta > 0 ? Math.abs(lenis.velocity) / delta : 0;
    cruiseTo(cruise.destination, cruise.speed, velocity, () => {
      playing = null;
    });
    return;
  }
}

function arm(): void {
  const now = performance.now();
  armedAt = now;
  observedScroll = getLenis()?.actualScroll ?? window.scrollY;
  lastMovementAt = now;
  stopWatching ??= onFrame("read", watch);
}

function onWheel(event: WheelEvent): void {
  // Pinch-zoom arrives as ctrl+wheel; horizontal swipes are not story intent.
  takeOver();
  if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  if (event.target instanceof Element && event.target.closest("[data-lenis-prevent], [role=dialog]")) return;
  lastInputAt = performance.now();
  if (event.deltaY > 0) arm();
}

function onTouchStart(event: TouchEvent): void {
  takeOver();
  touching = true;
  lastInputAt = performance.now();
  touchY = event.touches.length === 1 ? (event.touches[0]?.clientY ?? null) : null;
  if (event.target instanceof Element && event.target.closest("[data-lenis-prevent], [role=dialog]")) touchY = null;
  touchStartY = touchY;
}

function onTouchMove(event: TouchEvent): void {
  lastInputAt = performance.now();
  const y = event.touches.length === 1 ? (event.touches[0]?.clientY ?? null) : null;
  if (y === null || touchY === null) {
    disarm();
  } else if (touchY - y > 0) {
    arm();
  } else if (touchY - y < 0) {
    disarm();
  }
  touchY = y;
}

function onTouchEnd(event: TouchEvent): void {
  const endY = event.changedTouches[0]?.clientY ?? touchY;
  const shouldPlay = touchStartY !== null && endY !== null && touchStartY > endY;
  touching = event.touches.length > 0;
  lastInputAt = performance.now();
  if (touching) return;
  touchY = null;
  touchStartY = null;
  if (shouldPlay) arm();
}

const LISTENERS = [
  ["wheel", onWheel],
  ["touchstart", onTouchStart],
  ["touchmove", onTouchMove],
  ["touchend", onTouchEnd],
  ["touchcancel", takeOver],
  ["keydown", takeOver],
  ["pointerdown", takeOver],
  ["resize", takeOver],
] as const;
const LISTEN = { capture: true, passive: true } as const;

function register(section: GuidedSection): void {
  if (sections.size === 0) {
    for (const [type, listener] of LISTENERS) window.addEventListener(type, listener as EventListener, LISTEN);
  }
  sections.add(section);
}

function unregister(section: GuidedSection): void {
  sections.delete(section);
  if (playing === section) takeOver();
  if (sections.size > 0) return;
  takeOver();
  for (const [type, listener] of LISTENERS) window.removeEventListener(type, listener as EventListener, LISTEN);
}

/**
 * Registers a pinned section for guided playback while `enabled` (enhanced
 * motion, and whatever layout the section's scroll story needs).
 */
export function useGuidedScroll(section: RefObject<HTMLElement | null>, enabled: boolean, pace: GuidedPace): void {
  const { target, seconds } = pace;
  useEffect(() => {
    const element = section.current;
    if (!enabled || !element) return;
    const entry: GuidedSection = { element, pace: { target, seconds } };
    register(entry);
    return () => unregister(entry);
  }, [enabled, section, target, seconds]);
}
