import { useEffect, useState, type RefObject } from "react";
import type { JourneyClock } from "../../../scene/astronaut/journey-clock.ts";
import {
  clamp01,
  fit,
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
  world: RefObject<HTMLDivElement | null>;
  hero: RefObject<HTMLDivElement | null>;
  cardEdge: RefObject<HTMLDivElement | null>;
  bezel: RefObject<HTMLDivElement | null>;
  intro: RefObject<HTMLDivElement | null>;
  titleLines: RefObject<(HTMLElement | null)[]>;
  end: RefObject<HTMLDivElement | null>;
  stickers: RefObject<(HTMLElement | null)[]>;
  clock: RefObject<JourneyClock>;
};

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

  const backdrop = els.backdrop.current;
  if (backdrop) {
    const navy = smoothstep(0.3, 1, white) * (1 - smoothstep(0.2, 0.9, drop));
    backdrop.style.opacity = frameIn.toFixed(3);
    backdrop.style.backgroundColor = `rgb(${(4 * navy).toFixed(0)}, ${(8 * navy).toFixed(0)}, ${(52 * navy).toFixed(0)})`;
  }

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

  const wait = phaseRatio(t, "wait");
  const end = els.end.current;
  if (end) {
    const show = smoothstep(0.05, 0.4, wait);
    end.style.opacity = show.toFixed(3);
    end.style.visibility = show > 0.01 ? "visible" : "hidden";
    end.style.transform = `translate3d(0, ${((1 - show) * 40).toFixed(1)}px, 0)`;
  }

  els.stickers.current?.forEach((sticker) => {
    if (!sticker) return;
    const delay = Number(sticker.dataset.delay ?? 0);
    const rotate = Number(sticker.dataset.rotate ?? 0);
    const k = clamp01((wait - 0.12 - delay * 0.55) / 0.22);
    const pop = k > 0 ? backOut(k) : 0;
    sticker.style.opacity = k > 0 ? "1" : "0";
    sticker.style.transform = `translate3d(-50%, -50%, 0) scale(${pop.toFixed(3)}) rotate(${fit(k, 0, 1, rotate - 40, rotate).toFixed(1)}deg)`;
  });
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
    let autoScrolling = false;
    let lastWheelTime = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        lastWheelTime = performance.now();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const section = els.section.current;
      const clock = els.clock.current;
      if (!section || !clock) return;
      const scrollable = section.offsetHeight - window.innerHeight;
      const target = scrollable > 0 ? clamp01(-section.getBoundingClientRect().top / scrollable) : 0;
      clock.t = target;

      // Autoscroll momentum assistance: when user scrolls into the small card (t >= 0.05),
      // gently drive scroll forward through the tunnel until the glass breaks (t < 0.65).
      const now = performance.now();
      if (target >= 0.05 && target < 0.65 && now - lastWheelTime < 800) {
        if (!autoScrolling) {
          autoScrolling = true;
          window.scrollBy({ top: 18, behavior: "smooth" });
          setTimeout(() => {
            autoScrolling = false;
          }, 60);
        }
      }

      const stage = els.stage.current;
      if (stage) {
        clock.width = stage.clientWidth;
        clock.height = stage.clientHeight;
      }
      paint(els, clock.t);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
    };
  }, [near, els]);

  return { near, active };
}
