/**
 * WebGL capability detection.
 * Returns true only when the browser supports WebGL and a context
 * can be created. Used to gate the scene chunk dynamic import.
 * The probe context is expensive to create repeatedly and each one leaks
 * until GC unless explicitly lost, so the result is cached at module scope
 * and the probe context is released immediately after checking.
 */
let webglSupported: boolean | null = null;

export function checkWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl2") ??
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");
  webglSupported = gl !== null;
  if (gl && "getExtension" in gl) {
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webglSupported;
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}
