import * as THREE from "three";

export function isBrowser(): boolean {
  return typeof document !== "undefined";
}

export function createFallbackTexture(color: string = "#1e293b"): THREE.Texture {
  if (!isBrowser()) return new THREE.Texture();
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
  }
  return new THREE.CanvasTexture(canvas);
}
