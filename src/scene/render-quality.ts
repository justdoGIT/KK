import { isMobile } from "./useCapability.ts";

/** Never supersample a 1x display; cap high-density desktop/mobile buffers. */
export function dprRange(): [number, number] {
  const native = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const max = Math.min(native, isMobile() ? 1.5 : 2);
  // Keep a lower-cost tier available even on 1x displays. Only canvas pixels
  // change; the portfolio's HTML text and controls retain native sharpness.
  return [Math.min(0.75, max), max];
}
