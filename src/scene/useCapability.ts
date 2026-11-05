/**
 * WebGL capability detection.
 * Returns true only when the browser supports WebGL and a context
 * can be created. Used to gate the scene chunk dynamic import.
 * Cache the result so all scenes share one tiny, unreferenced probe. Forcing
 * a context loss here emits a misleading graphics failure warning in Firefox.
 * With no buffers/textures or retained references, the browser can collect it.
 */
let webglSupported: boolean | null = null;

export function checkWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const gl =
    canvas.getContext("webgl2") ??
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");
  webglSupported = gl !== null;
  return webglSupported;
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}
