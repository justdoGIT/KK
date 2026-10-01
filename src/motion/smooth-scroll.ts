import type Lenis from "lenis";
import { useEffect } from "react";
import { onFrame } from "./frame.ts";
import { useMotionMode } from "./use-motion-mode.ts";

// Smooth scrolling for enhanced mode: one Lenis instance, advanced first in
// every frame by the shared scheduler. Lenis damps toward the input with a
// fixed lerp (velocity-tracking, frame-rate independent) instead of
// restarting a fixed-duration ease on every wheel event. All programmatic
// scrolling goes through `scrollToY`, so nothing fights the interpolator.

/** Clears the sticky 3.5rem nav bar when jumping to an anchor. */
const ANCHOR_OFFSET = -64;
/** Viewport fraction over which a `data-scroll-slow` section eases its wheel factor in and out. */
const SLOW_RAMP = 0.25;

let lenis: Lenis | null = null;

export type SmoothScrollOptions = {
  /** Seconds; omit to use the damped lerp. */
  duration?: number;
  easing?: (t: number) => number;
  immediate?: boolean;
  /** Ignore user input until the scroll completes. */
  lock?: boolean;
  onComplete?: () => void;
};

/** The live Lenis instance, or null in native (reduced-motion) mode. */
export function getLenis(): Lenis | null {
  return lenis;
}

/** Scrolls the page to `y` px through Lenis when it is running, natively otherwise. */
export function scrollToY(y: number, options: SmoothScrollOptions = {}): void {
  if (lenis) {
    const { onComplete, ...rest } = options;
    lenis.scrollTo(y, { ...rest, force: true, onComplete: onComplete ? () => onComplete() : undefined });
    return;
  }
  window.scrollTo({ top: y, behavior: options.immediate || options.duration === 0 ? "instant" : "smooth" });
  options.onComplete?.();
}

/** Stops any programmatic or inertial scroll where it is. */
export function haltScroll(): void {
  if (lenis) lenis.scrollTo(lenis.scroll, { immediate: true, force: true });
}

type SlowZone = { top: number; bottom: number; factor: number };

function measureSlowZones(): SlowZone[] {
  return [...document.querySelectorAll<HTMLElement>("[data-scroll-slow]")].flatMap((el) => {
    const factor = Number(el.dataset.scrollSlow);
    if (!Number.isFinite(factor) || factor <= 0) return [];
    const rect = el.getBoundingClientRect();
    return [{ top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, factor }];
  });
}

/**
 * Wheel factor at the viewport centre: sections with `data-scroll-slow` slow
 * the wheel while they span the centre, easing in and out over `SLOW_RAMP`
 * viewports so the brake never lands as a step.
 */
function wheelFactor(zones: readonly SlowZone[], scroll: number): number {
  const centre = scroll + window.innerHeight / 2;
  const ramp = window.innerHeight * SLOW_RAMP;
  for (const zone of zones) {
    const inside = Math.min(centre - zone.top, zone.bottom - centre);
    if (inside <= 0) continue;
    const k = Math.min(1, inside / ramp);
    return 1 - (1 - zone.factor) * k * k * (3 - 2 * k);
  }
  return 1;
}

/**
 * Owns the Lenis lifecycle: enhanced mode only, loaded lazily (motion chunk),
 * torn down on mode change or unmount — including when the cleanup runs
 * before the chunk resolves (StrictMode remounts, quick mode flips).
 */
export function useSmoothScroll(): void {
  const mode = useMotionMode();

  useEffect(() => {
    if (mode !== "enhanced") return;
    let cancelled = false;
    let teardown: (() => void) | null = null;
    void import("lenis").then(({ default: LenisScroller }) => {
      if (cancelled) return;
      let zones = measureSlowZones();
      const instance = new LenisScroller({
        lerp: 0.085,
        smoothWheel: true,
        anchors: { offset: ANCHOR_OFFSET, duration: 1.1 },
        virtualScroll: (data) => {
          const factor = wheelFactor(zones, instance.scroll);
          data.deltaX *= factor;
          data.deltaY *= factor;
          return true;
        },
      });
      lenis = instance;
      const resizeObserver = new ResizeObserver(() => {
        zones = measureSlowZones();
      });
      resizeObserver.observe(document.body);
      const stop = onFrame("scroll", (time) => instance.raf(time));
      teardown = () => {
        stop();
        resizeObserver.disconnect();
        instance.destroy();
        if (lenis === instance) lenis = null;
      };
    });
    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [mode]);
}
