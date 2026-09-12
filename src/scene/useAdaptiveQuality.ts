import { useEffect, useRef, useState } from "react";

export type QualityTier = "high" | "medium" | "off";

type FrameSample = {
  interval: number;
};

type WindowStats = {
  medianFPS: number;
  p95FrameTime: number;
};

const WINDOW_MS = 2000;
const DEGRADE_FPS = 40;
const DEGRADE_P95 = 25.0;
const DISABLE_FPS = 30;
const DISABLE_P95 = 33.3;
const RECOVER_FPS = 50;
const RECOVER_P95 = 20.0;
const RECOVER_WINDOWS = 3;
const DEGRADE_WINDOWS = 2;

function computeStats(samples: FrameSample[]): WindowStats {
  if (samples.length === 0) {
    return { medianFPS: 60, p95FrameTime: 16.7 };
  }
  const intervals = samples
    .map((s) => s.interval)
    .sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  const medianInterval = intervals[mid];
  const p95Index = Math.floor(intervals.length * 0.95);
  const p95Interval = intervals[Math.min(p95Index, intervals.length - 1)];
  return {
    medianFPS: 1000 / medianInterval,
    p95FrameTime: p95Interval,
  };
}

/**
 * Adaptive quality hook: monitors frame times over a rolling
 * 2-second window and degrades/restores postprocessing quality.
 */
export function useAdaptiveQuality(enabled: boolean) {
  const [tier, setTier] = useState<QualityTier>("high");
  const framesRef = useRef<FrameSample[]>([]);
  const lastTimeRef = useRef<number>(0);
  const degradeCountRef = useRef(0);
  const recoverCountRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    let windowStart = performance.now();

    const tick = (now: number) => {
      if (lastTimeRef.current > 0) {
        framesRef.current.push({ interval: now - lastTimeRef.current });
      }
      lastTimeRef.current = now;

      if (now - windowStart >= WINDOW_MS) {
        const stats = computeStats(framesRef.current);
        framesRef.current = [];
        windowStart = now;

        setTier((current) => {
          if (current === "off") {
            if (
              stats.medianFPS >= RECOVER_FPS &&
              stats.p95FrameTime <= RECOVER_P95
            ) {
              recoverCountRef.current++;
              if (recoverCountRef.current >= RECOVER_WINDOWS) {
                recoverCountRef.current = 0;
                return "medium";
              }
            } else {
              recoverCountRef.current = 0;
            }
            return current;
          }

          if (
            stats.medianFPS < DISABLE_FPS ||
            stats.p95FrameTime > DISABLE_P95
          ) {
            degradeCountRef.current++;
            if (degradeCountRef.current >= DEGRADE_WINDOWS) {
              degradeCountRef.current = 0;
              recoverCountRef.current = 0;
              return "off";
            }
          } else if (
            stats.medianFPS < DEGRADE_FPS ||
            stats.p95FrameTime > DEGRADE_P95
          ) {
            degradeCountRef.current++;
            if (degradeCountRef.current >= DEGRADE_WINDOWS && current === "high") {
              degradeCountRef.current = 0;
              return "medium";
            }
          } else {
            degradeCountRef.current = 0;
          }
          return current;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled]);

  return tier;
}
