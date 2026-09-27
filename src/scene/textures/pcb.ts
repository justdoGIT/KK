import * as THREE from "three";
import { isBrowser, createFallbackTexture } from "./common.ts";

/**
 * Generates a high-detail PCB top surface texture with gold traces,
 * solder mask vias, SMT pads, and silkscreen engineering labels.
 */
export function createPcbTexture(
  theme: "green" | "dark" | "blue" = "green",
): THREE.CanvasTexture | THREE.Texture {
  if (!isBrowser()) return createFallbackTexture("#064e3b");

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return createFallbackTexture();

  // Background solder mask substrate
  let bgGrad: CanvasGradient;
  if (theme === "green") {
    bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, "#063d2e");
    bgGrad.addColorStop(0.5, "#084938");
    bgGrad.addColorStop(1, "#042c20");
  } else if (theme === "blue") {
    bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, "#082f49");
    bgGrad.addColorStop(0.5, "#0c4a6e");
    bgGrad.addColorStop(1, "#031c30");
  } else {
    bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, "#0d1117");
    bgGrad.addColorStop(0.5, "#161b22");
    bgGrad.addColorStop(1, "#0a0c10");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Fiberglass weave pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Golden copper traces
  const drawTrace = (pts: [number, number][], width = 3, color = "#eab308") => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
  };

  // Parallel bus lines
  for (let i = 0; i < 8; i++) {
    const offset = i * 16;
    drawTrace(
      [
        [120 + offset, 120],
        [280 + offset, 280],
        [280 + offset, 650],
        [420 + offset, 790],
        [850, 790 + offset * 0.4],
      ],
      3.5,
      i % 2 === 0 ? "#fbbf24" : "#d97706",
    );
  }

  // Microcontroller bus fanout
  for (let i = 0; i < 6; i++) {
    const offset = i * 18;
    drawTrace(
      [
        [512 - 90 + offset, 512 - 120],
        [512 - 90 + offset, 250 - offset * 0.5],
        [200, 250 - offset * 0.5],
      ],
      2.5,
      "#f59e0b",
    );
  }

  for (let i = 0; i < 6; i++) {
    const offset = i * 18;
    drawTrace(
      [
        [512 + 120, 512 - 60 + offset],
        [780 + offset * 0.8, 512 - 60 + offset],
        [880, 400 + offset],
      ],
      2.5,
      "#fbbf24",
    );
  }

  // Ground plane vias
  const drawVia = (cx: number, cy: number, r = 6) => {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  };

  for (let x = 60; x <= 960; x += 120) {
    drawVia(x, 60, 8);
    drawVia(x, 964, 8);
  }
  for (let y = 60; y <= 960; y += 120) {
    drawVia(60, y, 8);
    drawVia(964, y, 8);
  }

  // Central QFP / BGA chip pad layout
  ctx.fillStyle = "#fde047";
  const chipSize = 220;
  const chipX = 512 - chipSize / 2;
  const chipY = 512 - chipSize / 2;
  const padLen = 14;
  const padW = 5;
  const padCount = 16;
  const step = chipSize / (padCount + 1);

  for (let i = 1; i <= padCount; i++) {
    const pos = chipX + i * step;
    ctx.fillRect(pos - padW / 2, chipY - padLen - 4, padW, padLen);
    ctx.fillRect(pos - padW / 2, chipY + chipSize + 4, padW, padLen);
    ctx.fillRect(chipX - padLen - 4, chipY + i * step - padW / 2, padLen, padW);
    ctx.fillRect(chipX + chipSize + 4, chipY + i * step - padW / 2, padLen, padW);
  }

  // SMT resistor & capacitor pads
  const smtLocations: [number, number, boolean][] = [
    [220, 380, true],
    [220, 420, true],
    [220, 460, true],
    [780, 200, false],
    [820, 200, false],
    [860, 200, false],
    [340, 880, true],
    [400, 880, true],
    [460, 880, true],
    [720, 700, false],
    [720, 740, false],
  ];

  smtLocations.forEach(([x, y, h]) => {
    ctx.fillStyle = "#fef08a";
    if (h) {
      ctx.fillRect(x - 14, y - 6, 10, 12);
      ctx.fillRect(x + 4, y - 6, 10, 12);
    } else {
      ctx.fillRect(x - 6, y - 14, 12, 10);
      ctx.fillRect(x - 6, y + 4, 12, 10);
    }
  });

  // Silkscreen engineering labels
  ctx.fillStyle = "rgba(248, 250, 252, 0.92)";
  ctx.font = "bold 14px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillText("U1: ARM-CORTEX-M7 / 480MHz", chipX - 20, chipY - 26);
  ctx.font = "11px 'SF Mono', 'Cascadia Code', monospace";
  ctx.fillText("VCC_3V3", 70, 90);
  ctx.fillText("GND_ISO", 70, 110);
  ctx.fillText("SYS_RESET#", 70, 130);
  ctx.fillText("UART1_TX / PIN22", 720, 120);
  ctx.fillText("UART1_RX / PIN23", 720, 140);
  ctx.fillText("I2C_SDA [FAST+]", 720, 160);
  ctx.fillText("CAN-FD BUS / 5Mbps", 180, 930);
  ctx.fillText("NPU_ACCEL INTERCONNECT", 600, 930);
  ctx.fillText("REV 3.4 [PROD-CERT]", 820, 930);

  ctx.strokeStyle = "rgba(248, 250, 252, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(chipX - 2, chipY - 2, chipSize + 4, chipSize + 4);

  // Pin 1 dot
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(chipX + 16, chipY + 16, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}
