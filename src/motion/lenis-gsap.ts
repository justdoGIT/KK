import { useEffect } from "react";
import { useMotionMode } from "./use-motion-mode.ts";

/**
 * Sections can ask for a slower wheel by setting `data-scroll-slow="0.6"`;
 * the factor applies while the section spans the viewport centre.
 */
function wheelFactorAtCentre(): number {
  const centre = window.innerHeight / 2;
  for (const el of document.querySelectorAll<HTMLElement>("[data-scroll-slow]")) {
    const rect = el.getBoundingClientRect();
    if (rect.top <= centre && rect.bottom >= centre) {
      const factor = Number(el.dataset.scrollSlow);
      return Number.isFinite(factor) && factor > 0 ? factor : 1;
    }
  }
  return 1;
}

/**
 * Lenis + GSAP ScrollTrigger integration.
 * Only initializes when motion mode is "enhanced".
 * One GSAP ticker drives both Lenis.raf and ScrollTrigger.update.
 * Cleans up on unmount or mode change.
 */
export function useLenisGsap() {
  const mode = useMotionMode();

  useEffect(() => {
    if (mode !== "enhanced") return;

    let tickerFn: ((time: number) => void) | null = null;
    let cleanupFns: (() => void)[] = [];

    (async () => {
      const Lenis = (await import("lenis")).default;
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      gsap.registerPlugin(ScrollTrigger);

      const lenisInstance = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        touchMultiplier: 2,
        virtualScroll: (data) => {
          const factor = wheelFactorAtCentre();
          data.deltaX *= factor;
          data.deltaY *= factor;
          return true;
        },
      });

      tickerFn = (time: number) => {
        lenisInstance.raf(time * 1000);
        ScrollTrigger.update();
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      cleanupFns.push(() => {
        gsap.ticker.remove(tickerFn!);
        lenisInstance.destroy();
        ScrollTrigger.killAll();
      });
    })();

    return () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, [mode]);
}
