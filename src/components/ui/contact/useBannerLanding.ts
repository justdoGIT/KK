import { useEffect, useRef, useState, type RefObject } from "react";
import type { LoungeClock } from "../../../scene/astronaut/LoungeCanvas.tsx";
import {
  IDLE_AFTER,
  LAND_AT,
  bannerState,
  contactPoseMode,
} from "./banner-timeline.ts";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function paint(mover: HTMLElement, heading: HTMLElement, offset: number, reveal: number): void {
  mover.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(var(--contact-scale, 0.82))`;
  heading.style.opacity = reveal.toFixed(3);
  heading.style.visibility = reveal > 0.001 ? "visible" : "hidden";
  heading.style.transform = `translate3d(-50%, ${((1 - reveal) * 26).toFixed(1)}px, 0) scale(${(0.86 + reveal * 0.14).toFixed(3)})`;
}

/**
 * Drives the sticky contact landing zone from scroll progress. The astronaut
 * touches the already-visible top face, the impact dips the whole cuboid, and
 * subsequent scroll/idle/CTA input selects his pose through the shared clock.
 */
export function useBannerLanding(
  root: RefObject<HTMLDivElement | null>,
  mover: RefObject<HTMLDivElement | null>,
  heading: RefObject<HTMLHeadingElement | null>,
  enabled: boolean,
): {
  near: boolean;
  active: boolean;
  clock: RefObject<LoungeClock>;
  interact: (interaction: "none" | "dance" | "wait") => void;
} {
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const clock = useRef<LoungeClock>({
    progress: 0,
    elapsed: 0,
    fall: 0,
    mode: "landing",
    interaction: "none",
    interactionUntil: 0,
    lastActivity: 0,
  });

  const interact = (interaction: "none" | "dance" | "wait") => {
    const now = performance.now() / 1000;
    clock.current.lastActivity = now;
    if (interaction === "none") {
      if (clock.current.interaction === "dance") clock.current.interaction = "none";
      return;
    }
    clock.current.interaction = interaction;
    if (interaction === "wait") clock.current.interactionUntil = now + 8;
  };

  useEffect(() => {
    const banner = root.current;
    if (!enabled || !banner) return;
    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "75% 0px 75% 0px",
    });
    const activeObserver = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 });
    nearObserver.observe(banner);
    activeObserver.observe(banner);
    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [enabled, root]);

  useEffect(() => {
    const banner = root.current;
    const moving = mover.current;
    const title = heading.current;
    if (!enabled || !near || !banner || !moving || !title) return;
    let rafId = 0;
    let landedAt: number | null = null;
    let previousProgress = 0;

    const markActivity = () => {
      clock.current.lastActivity = performance.now() / 1000;
    };
    markActivity();
    window.addEventListener("wheel", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const now = performance.now() / 1000;
      const scrollable = banner.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? clamp01(-banner.getBoundingClientRect().top / scrollable) : 1;
      if (Math.abs(progress - previousProgress) > 0.0001) clock.current.lastActivity = now;
      if (progress >= LAND_AT && previousProgress < LAND_AT) landedAt = now;
      if (progress < LAND_AT) landedAt = null;
      previousProgress = progress;

      if (clock.current.interaction === "wait" && now >= clock.current.interactionUntil) {
        clock.current.interaction = "none";
      }
      const state = bannerState(progress, landedAt === null ? 0 : now - landedAt);
      const idle = progress >= LAND_AT && now - clock.current.lastActivity >= IDLE_AFTER;
      const mode = contactPoseMode(progress, idle, clock.current.interaction);

      clock.current.progress = progress;
      clock.current.elapsed = now;
      clock.current.fall = state.fall;
      clock.current.mode = mode;
      if (banner.dataset.astronautMode !== mode) banner.dataset.astronautMode = mode;
      paint(moving, title, state.offset, state.heading);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("wheel", markActivity);
      window.removeEventListener("touchstart", markActivity);
      window.removeEventListener("keydown", markActivity);
      cancelAnimationFrame(rafId);
    };
  }, [enabled, near, root, mover, heading]);

  return { near, active, clock, interact };
}
