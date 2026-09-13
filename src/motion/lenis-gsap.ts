import { useEffect } from "react";
import { useMotionMode } from "./use-motion-mode.ts";

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
