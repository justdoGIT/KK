import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";

// Pixel-LED visor face shown once the astronaut has landed (Lusion drives a
// sprite sheet on a helmet "card"; this draws the frames procedurally).

const COLS = 32;
const ROWS = 14;
const CELL = 4;

// 1 = lit pixel. Eyes are rounded "^" arcs when happy, flat bars when blinking.
const EYE_OPEN = ["01110", "11111", "11011", "10001"];
const EYE_BLINK = ["00000", "00000", "11111", "00000"];
const SMILE = ["1000000001", "0100000010", "0011111100"];

function hue(x: number, y: number): string {
  const h = (x / COLS) * 300 + y * 6;
  return `hsl(${h.toFixed(0)} 100% 62%)`;
}

function stamp(ctx: CanvasRenderingContext2D, glyph: string[], ox: number, oy: number): void {
  glyph.forEach((row, y) => {
    [...row].forEach((bit, x) => {
      if (bit !== "1") return;
      const gx = ox + x;
      const gy = oy + y;
      ctx.fillStyle = hue(gx, gy);
      ctx.fillRect(gx * CELL, gy * CELL, CELL - 1, CELL - 1);
    });
  });
}

function drawFace(blink: boolean): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Unlit LED grid so the panel reads as hardware even between frames.
    ctx.fillStyle = "rgba(90, 120, 170, 0.12)";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
    }
    const eye = blink ? EYE_BLINK : EYE_OPEN;
    stamp(ctx, eye, 8, 3);
    stamp(ctx, eye, 19, 3);
    stamp(ctx, SMILE, 11, 9);
  }
  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export type LedFace = { open: CanvasTexture; blink: CanvasTexture; dispose: () => void };

export function createLedFace(): LedFace {
  const open = drawFace(false);
  const blink = drawFace(true);
  return {
    open,
    blink,
    dispose: () => {
      open.dispose();
      blink.dispose();
    },
  };
}
