import { isMobile } from "./useCapability.ts";

/** Never supersample a 1x display; cap high-density desktop/mobile buffers. */
export function dprRange(): [number, number] {
  const native = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const max = Math.min(native, isMobile() ? 1.5 : 2);
  return [Math.min(1, max), max];
}
