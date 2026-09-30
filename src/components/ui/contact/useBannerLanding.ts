import { useEffect, useRef, useState, type RefObject } from "react";
import type { LoungeClock } from "../../../scene/astronaut/LoungeCanvas.tsx";
import { BANNER_SETTLED, bannerState } from "./banner-timeline.ts";

function paint(mover: HTMLElement, elapsed: number): void {
  const state = bannerState(elapsed);
  mover.style.opacity = state.opacity.toFixed(3);
  mover.style.transform = `translate3d(0, ${state.offset.toFixed(1)}px, 0) scale(${state.scale.toFixed(4)})`;
}

/**
 * Plays the banner's landing beat when it scrolls into view: pop up, the
 * astronaut drops onto the top face, sag and slow recovery. Scrolling back
 * above the banner rewinds it so the beat replays. Returns whether the lounge
 * canvas should mount (`near`) and render (`active`), plus the shared clock.
 */
export function useBannerLanding(
  root: RefObject<HTMLDivElement | null>,
  mover: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): { near: boolean; active: boolean; clock: RefObject<LoungeClock> } {
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const clock = useRef<LoungeClock>({ elapsed: -1 });

  useEffect(() => {
    const banner = root.current;
    const moving = mover.current;
    if (!enabled || !banner || !moving) return;
    let rafId = 0;
    let start: number | null = null;

    const tick = () => {
      if (start === null) return;
      const elapsed = (performance.now() - start) / 1000;
      clock.current.elapsed = elapsed;
      paint(moving, elapsed);
      if (elapsed < BANNER_SETTLED) rafId = requestAnimationFrame(tick);
    };
    const rewind = () => {
      cancelAnimationFrame(rafId);
      start = null;
      clock.current.elapsed = -1;
      paint(moving, 0);
    };
    rewind();

    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "60% 0px 60% 0px",
    });
    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (entry.isIntersecting && start === null) {
          start = performance.now();
          rafId = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          rewind();
        }
      },
      { threshold: 0.15 },
    );
    nearObserver.observe(banner);
    revealObserver.observe(banner);
    return () => {
      nearObserver.disconnect();
      revealObserver.disconnect();
      cancelAnimationFrame(rafId);
      moving.style.opacity = "";
      moving.style.transform = "";
    };
  }, [enabled, root, mover]);

  return { near, active, clock };
}
