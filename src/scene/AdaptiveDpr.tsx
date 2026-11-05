import { useCallback, useState, type JSX } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { dprRange } from "./render-quality.ts";

/**
 * One shared adaptive-DPR controller for every canvas: starts at the device's
 * capped maximum and steps down — never back up — on sustained low frame
 * rate. Render `monitor` as a child of the `<Canvas>` this `dpr` feeds.
 */
export function useAdaptiveDpr(): { dpr: number; monitor: JSX.Element } {
  const [min, max] = dprRange();
  const [dpr, setDpr] = useState(max);
  const onDecline = useCallback(() => {
    setDpr((current) => Math.max(min, current - 0.25));
  }, [min]);
  return { dpr: Math.min(dpr, max), monitor: <PerformanceMonitor onDecline={onDecline} /> };
}
