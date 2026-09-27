import * as THREE from "three";
import { isBrowser, createFallbackTexture } from "./common.ts";

/**
 * Generates high-resolution laser-etched top surface texture for IC chips,
 * microcontrollers, and AI Tensor processors.
 */
export function createChipTexture(
  brand: string,
  model: string,
  spec: string,
  subLabel: string = "ARM 64-BIT DUAL-CORE",
): THREE.CanvasTexture | THREE.Texture {
  if (!isBrowser()) return createFallbackTexture("#18181b");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return createFallbackTexture();

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 320);
  grad.addColorStop(0, "#1c2128");
  grad.addColorStop(0.7, "#12161c");
  grad.addColorStop(1, "#0b0e12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Pin 1 dimple
  ctx.fillStyle = "#07090b";
  ctx.beginPath();
  ctx.arc(56, 56, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emblem
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(256, 85);
  ctx.lineTo(285, 130);
  ctx.lineTo(227, 130);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.textAlign = "center";
  ctx.font = "bold 24px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillText(brand, 256, 185);

  ctx.font = "600 28px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(model, 256, 230);

  ctx.font = "14px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.fillText(subLabel, 256, 275);

  ctx.font = "13px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
  ctx.fillText(spec, 256, 315);

  // 2D Data Matrix code
  const matrixX = 380;
  const matrixY = 380;
  ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c * 3 + r * c) % 2 === 0 || r === 0 || c === 0 || r === 7) {
        ctx.fillRect(matrixX + c * 8, matrixY + r * 8, 7, 7);
      }
    }
  }

  ctx.textAlign = "left";
  ctx.font = "11px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
  ctx.fillText("LOT: 2638-K4X", 48, 430);
  ctx.fillText("TAIWAN / SECURED", 48, 450);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates silicon wafer photolithography pattern with iridescent
 * micro-die matrix grid.
 */
export function createWaferTexture(): THREE.CanvasTexture | THREE.Texture {
  if (!isBrowser()) return createFallbackTexture("#38bdf8");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return createFallbackTexture();

  const grad = ctx.createRadialGradient(512, 512, 20, 512, 512, 500);
  grad.addColorStop(0, "#0ea5e9");
  grad.addColorStop(0.25, "#6366f1");
  grad.addColorStop(0.5, "#ec4899");
  grad.addColorStop(0.75, "#eab308");
  grad.addColorStop(1, "#10b981");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const dieSize = 36;
  const street = 3;
  ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;

  for (let x = 64; x < 960; x += dieSize + street) {
    for (let y = 64; y < 960; y += dieSize + street) {
      const dx = x + dieSize / 2 - 512;
      const dy = y + dieSize / 2 - 512;
      if (dx * dx + dy * dy < 440 * 440) {
        ctx.fillRect(x, y, dieSize, dieSize);
        ctx.strokeRect(x, y, dieSize, dieSize);

        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.fillRect(x + 4, y + 4, dieSize - 8, dieSize - 8);
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}
