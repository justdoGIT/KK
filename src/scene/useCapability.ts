/**
 * WebGL capability detection.
 * Returns true only when the browser supports WebGL and a context
 * can be created. Used to gate the scene chunk dynamic import.
 */
export function checkWebGL(): boolean {
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl2") ??
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");
  return gl !== null;
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}
