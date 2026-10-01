import { useCallback, useState, type JSX } from "react";
import { PerformanceMonitor } from "@react-three/drei";
import { isMobile } from "./useCapability.ts";

/** `[min, max]` drawing-buffer DPR: desktop renders up to native 2x, mobile caps at 1.5x. */
export function dprRange(): [number, number] {
  return isMobile() ? [1, 1.5] : [1, 2];
}

/**
 * One shared adaptive-DPR controller for every canvas: starts at the device's
 * capped maximum and steps down — never back up — on sustained low frame
 * rate. Render `monitor` as a child of the `<Canvas>` this `dpr` feeds.
 */
export function useAdaptiveDpr(): { dpr: number; monitor: JSX.Element } {
  const [, max] = dprRange();
  const [dpr, setDpr] = useState(max);
  const onDecline = useCallback(() => {
    setDpr((current) => (current > 1.25 ? 1.25 : 1));
  }, []);
  return { dpr, monitor: <PerformanceMonitor onDecline={onDecline} /> };
}
