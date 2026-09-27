import * as THREE from "three";
import { isBrowser, createFallbackTexture } from "./common.ts";

/**
 * Generates cylindrical electrolytic capacitor sleeve texture.
 */
export function createCapacitorTexture(): THREE.CanvasTexture | THREE.Texture {
  if (!isBrowser()) return createFallbackTexture("#0284c7");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return createFallbackTexture();

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0369a1");
  grad.addColorStop(0.5, "#0284c7");
  grad.addColorStop(1, "#075985");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
  ctx.fillRect(40, 0, 50, 256);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  for (let y = 30; y < 256; y += 45) {
    ctx.fillText("—", 65, y);
  }

  ctx.fillStyle = "#fef08a";
  ctx.textAlign = "left";
  ctx.font = "bold 26px 'SF Mono', monospace";
  ctx.fillText("470 µF", 140, 80);
  ctx.font = "bold 22px 'SF Mono', monospace";
  ctx.fillText("35 V", 140, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "14px 'SF Mono', monospace";
  ctx.fillText("LOW ESR • 105°C", 140, 160);
  ctx.fillText("INDUSTRIAL GRADE", 140, 190);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generates an engineering circuit schematic texture with logic gates,
 * op-amps, and routing nets.
 */
export function createSchematicTexture(): THREE.CanvasTexture | THREE.Texture {
  if (!isBrowser()) return createFallbackTexture("rgba(14,165,233,0.1)");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return createFallbackTexture();

  ctx.clearRect(0, 0, 1024, 1024);

  ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Op-Amp
  const scale = 1.4;
  const cx = 320;
  const cy = 320;
  ctx.beginPath();
  ctx.moveTo(cx - 50 * scale, cy - 60 * scale);
  ctx.lineTo(cx - 50 * scale, cy + 60 * scale);
  ctx.lineTo(cx + 60 * scale, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("−", cx - 40 * scale, cy - 25 * scale);
  ctx.fillText("+", cx - 40 * scale, cy + 35 * scale);

  ctx.beginPath();
  ctx.moveTo(cx - 90 * scale, cy - 30 * scale);
  ctx.lineTo(cx - 50 * scale, cy - 30 * scale);
  ctx.moveTo(cx - 90 * scale, cy + 30 * scale);
  ctx.lineTo(cx - 50 * scale, cy + 30 * scale);
  ctx.moveTo(cx + 60 * scale, cy);
  ctx.lineTo(cx + 110 * scale, cy);
  ctx.stroke();

  // Logic Gate
  const gx = 720;
  const gy = 680;
  ctx.beginPath();
  ctx.moveTo(gx - 40, gy - 40);
  ctx.lineTo(gx, gy - 40);
  ctx.arc(gx, gy, 40, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(gx - 40, gy + 40);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(gx + 48, gy, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Resistor Zig-Zag
  const drawResistor = (x1: number, y1: number, x2: number) => {
    const len = x2 - x1;
    const seg = len / 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + seg, y1);
    ctx.lineTo(x1 + seg * 1.5, y1 - 18);
    ctx.lineTo(x1 + seg * 2.5, y1 + 18);
    ctx.lineTo(x1 + seg * 3.5, y1 - 18);
    ctx.lineTo(x1 + seg * 4.5, y1 + 18);
    ctx.lineTo(x1 + seg * 5, y1);
    ctx.lineTo(x2, y1);
    ctx.stroke();
  };

  drawResistor(120, 680, 360);
  drawResistor(560, 240, 820);

  // Labels
  ctx.shadowBlur = 0;
  ctx.font = "bold 16px 'SF Mono', monospace";
  ctx.fillStyle = "#7dd3fc";
  ctx.fillText("R_FEEDBACK = 10kΩ", 150, 650);
  ctx.fillText("OPAMP_STAGE_1", 180, 220);
  ctx.fillText("C_FILTER = 100nF", 520, 485);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}
