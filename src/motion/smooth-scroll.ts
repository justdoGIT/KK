import type Lenis from "lenis";
import { useEffect } from "react";
import { onFrame } from "./frame.ts";
import { useMotionMode } from "./use-motion-mode.ts";

// Smooth scrolling for enhanced mode: one Lenis instance, advanced first in
// every frame by the shared scheduler. Lenis damps toward the input with a
// fixed lerp (velocity-tracking, frame-rate independent) instead of
// restarting a fixed-duration ease on every wheel event. All programmatic
// scrolling goes through `scrollToY` or `cruiseTo`, so nothing fights the
// interpolator.

/** Clears the sticky 3.5rem nav bar when jumping to an anchor. */
const ANCHOR_OFFSET = -64;
/** Viewport fraction over which a `data-scroll-slow` section eases its wheel factor in and out. */
const SLOW_RAMP = 0.25;
/** Seconds a cruise takes to reach its full speed from rest. */
const CRUISE_RAMP = 0.6;
/** Slowest cruise speed (px/s) while braking, so the last pixels still arrive. */
const CRUISE_CREEP = 36;
/** Scroll drift (px) between cruise steps that means something else moved the page. */
const CRUISE_TAKEOVER = 2;

let lenis: Lenis | null = null;
let stopActiveCruise: (() => void) | null = null;

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
  stopCruise();
  if (lenis) {
    const { onComplete, ...rest } = options;
    lenis.scrollTo(y, { ...rest, force: true, onComplete: onComplete ? () => onComplete() : undefined });
    return;
  }
  window.scrollTo({ top: y, behavior: options.immediate || options.duration === 0 ? "instant" : "smooth" });
  options.onComplete?.();
}

/** Cruise kinematics, advanced in place by `advanceCruise`. */
export type CruiseMotion = {
  position: number;
  /** Current speed in px/s. */
  velocity: number;
};

/**
 * One cruise step toward `destination`: accelerates to `speed` over
 * `CRUISE_RAMP` seconds, brakes with constant deceleration over the last
 * `brake` px (never below `CRUISE_CREEP`), and lands exactly on the
 * destination without overshooting. Returns true once it has arrived.
 */
export function advanceCruise(motion: CruiseMotion, destination: number, speed: number, brake: number, delta: number): boolean {
  const remaining = destination - motion.position;
  if (remaining <= 0.5) {
    motion.position = destination;
    motion.velocity = 0;
    return true;
  }
  const accelerated = Math.min(speed, motion.velocity + (speed / CRUISE_RAMP) * delta);
  const braking = speed * Math.sqrt(Math.min(1, remaining / Math.max(1, brake)));
  motion.velocity = Math.min(speed, Math.max(Math.min(CRUISE_CREEP, speed), Math.min(accelerated, braking)));
  motion.position = Math.min(destination, motion.position + motion.velocity * delta);
  const arrived = motion.position >= destination;
  if (arrived) motion.velocity = 0;
  return arrived;
}

/** Stops a running cruise where it is, leaving no pending Lenis target behind. */
export function stopCruise(): void {
  const stop = stopActiveCruise;
  stopActiveCruise = null;
  stop?.();
}

/**
 * Plays the page toward `destination` at `speed` px/s from the scroll phase of
 * the shared scheduler, starting from `initialSpeed`. Every step is an
 * immediate Lenis jump, so no long-running animation holds a far target: when
 * the user takes over (any input calls `stopCruise`), their scroll continues
 * from where the page is. A step that finds the page moved by something else
 * (scrollbar drag, find-in-page) hands control back the same way.
 */
export function cruiseTo(destination: number, speed: number, initialSpeed = 0, onDone?: () => void): void {
  stopCruise();
  const instance = lenis;
  if (!instance || speed <= 0) return;
  const target = Math.min(destination, instance.limit);
  const motion: CruiseMotion = { position: instance.animatedScroll, velocity: Math.min(speed, Math.max(0, initialSpeed)) };
  if (target - motion.position <= 0.5) return;
  // Take over from the current position: drop whatever smoothing distance
  // Lenis still had left, carrying its momentum as the initial speed instead.
  instance.scrollTo(motion.position, { immediate: true, force: true });
  const brake = Math.min((target - motion.position) / 2, speed * 0.7);
  let expected = instance.actualScroll;
  const unsubscribe = onFrame("scroll", (_time, delta) => {
    if (Math.abs(instance.actualScroll - expected) > CRUISE_TAKEOVER) {
      stopCruise();
      return;
    }
    const arrived = advanceCruise(motion, target, speed, brake, delta);
    expected = motion.position;
    instance.scrollTo(motion.position, { immediate: true, force: true });
    if (!arrived) return;
    stopCruise();
    onDone?.();
  });
  stopActiveCruise = unsubscribe;
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
        stopCruise();
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
