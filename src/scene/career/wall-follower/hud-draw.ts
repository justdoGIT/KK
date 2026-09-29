import { CELL, MAZE_COLS, MAZE_ROWS, createPose, poseAt, type Maze, type Pose } from "./maze.ts";
import { DEPTH_COLS, DEPTH_ROWS, MOUNT_FWD, MOUNT_RIGHT, MOUNT_YAW, mountPose, type SensorFrame } from "./depth-sensor.ts";

const CYAN = "#38bdf8";
const INDIGO = "#93a4ff";
const AMBER = "#fbbf24";
const BG = "#02040a";
const TRAIL_SAMPLES = 240;

export type HudCanvases = { depth: HTMLCanvasElement; correction: HTMLCanvasElement; top: HTMLCanvasElement };

export type MotorCommand = { left: number; right: number; mode: string };

export type Hud = {
  draw: (frame: SensorFrame, pose: Pose, u: number, now: number) => void;
};

function fit(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
const NEAR_RANGE = 1.6;
const STOPS: [number, number, number][] = [
  [254, 243, 199],
  [56, 189, 248],
  [99, 102, 241],
  [30, 27, 75],
];

/** Warm near → cyan → indigo far, like a ToF amplitude-coded depth map. */
function heat(range: number, surface: number): [number, number, number] {
  if (surface === 0) return [2, 4, 10];
  const n = Math.min(range / NEAR_RANGE, 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(n), STOPS.length - 2);
  const f = n - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const dim = surface === 1 ? 0.45 : 1;
  return [(a[0] + (b[0] - a[0]) * f) * dim, (a[1] + (b[1] - a[1]) * f) * dim, (a[2] + (b[2] - a[2]) * f) * dim];
}

/** Motor PWM (percent) for the current manoeuvre, driven by the corrected wall offset. */
export function motorCommand(pose: Pose, frame: SensorFrame): MotorCommand {
  if (pose.kind === "spin") return { left: -60, right: 60, mode: "DEAD END · PIVOT 180°" };
  if (pose.kind === "arc-left") return { left: 28, right: 82, mode: "CORNER · TURN LEFT" };
  if (pose.kind === "arc-right") return { left: 82, right: 28, mode: "WALL ENDS · TURN RIGHT" };
  const error = Number.isNaN(frame.wallOffset) ? 0 : frame.wallOffset + 0.37;
  const trim = Math.round(error * 180);
  const mode = frame.corner.active ? "CORNER DETECTED · PREP TURN" : "PID WALL HOLD 0.37 m";
  return { left: 62 - trim, right: 62 + trim, mode };
}

export function createHud(canvases: HudCanvases, maze: Maze): Hud {
  const pixels = document.createElement("canvas");
  pixels.width = DEPTH_COLS;
  pixels.height = DEPTH_ROWS;
  const pixelCtx = pixels.getContext("2d");
  const image = pixelCtx?.createImageData(DEPTH_COLS, DEPTH_ROWS) ?? null;
  const trail: { x: number; z: number }[] = [];
  const scratch = createPose();
  for (let i = 0; i <= TRAIL_SAMPLES; i += 1) {
    poseAt(maze, i / TRAIL_SAMPLES, scratch);
    trail.push({ x: scratch.x, z: scratch.z });
  }

  function drawDepth(frame: SensorFrame): void {
    const ctx = fit(canvases.depth);
    if (!ctx || !pixelCtx || !image) return;
    const w = canvases.depth.clientWidth;
    const h = canvases.depth.clientHeight;
    for (let i = 0; i < DEPTH_COLS * DEPTH_ROWS; i += 1) {
      const [r, g, b] = heat(frame.depth[i], frame.surface[i]);
      image.data[i * 4] = r;
      image.data[i * 4 + 1] = g;
      image.data[i * 4 + 2] = b;
      image.data[i * 4 + 3] = 255;
    }
    pixelCtx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixels, 0, 0, w, h);
    const colW = w / DEPTH_COLS;
    for (let c = 0; c < DEPTH_COLS; c += 1) {
      if (!frame.cls[c]) continue;
      ctx.fillStyle = frame.cls[c] === 1 ? CYAN : AMBER;
      ctx.fillRect(c * colW, h - 4, colW - 1, 4);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawCorrection(frame: SensorFrame, swing: number): void {
    const ctx = fit(canvases.correction);
    if (!ctx) return;
    const w = canvases.correction.clientWidth;
    const h = canvases.correction.clientHeight;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    const scale = h / 1.5;
    const ox = w * 0.5;
    const oy = h * 0.88;
    const toScreen = (x: number, y: number): [number, number] => [ox - y * scale, oy - x * scale];
    const angle = MOUNT_YAW * swing;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Robot body + camera boresight.
    ctx.fillStyle = "rgba(147,164,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(...toScreen(0.12, 0));
    ctx.lineTo(...toScreen(-0.08, 0.08));
    ctx.lineTo(...toScreen(-0.08, -0.08));
    ctx.fill();
    ctx.strokeStyle = "rgba(56,189,248,0.4)";
    ctx.beginPath();
    ctx.moveTo(...toScreen(MOUNT_FWD * swing, -MOUNT_RIGHT * swing));
    ctx.lineTo(...toScreen(MOUNT_FWD * swing + Math.cos(angle) * 1.2, -MOUNT_RIGHT * swing + Math.sin(angle) * 1.2));
    ctx.stroke();
    for (let c = 0; c < DEPTH_COLS; c += 1) {
      if (!frame.valid[c]) continue;
      const rx = frame.rawX[c];
      const ry = frame.rawY[c];
      if (swing > 0.02) {
        ctx.fillStyle = "rgba(147,164,255,0.25)";
        ctx.fillRect(...toScreen(rx, ry), 2, 2);
      }
      const px = rx * cos - ry * sin + MOUNT_FWD * swing;
      const py = rx * sin + ry * cos - MOUNT_RIGHT * swing;
      const settled = swing > 0.96;
      ctx.fillStyle = settled ? (frame.cls[c] === 2 ? AMBER : frame.cls[c] === 1 ? CYAN : INDIGO) : INDIGO;
      const [sx, sy] = toScreen(px, py);
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
    if (swing > 0.96) {
      if (!Number.isNaN(frame.wallOffset)) {
        ctx.strokeStyle = CYAN;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(...toScreen(-0.1, frame.wallOffset));
        ctx.lineTo(...toScreen(1.45, frame.wallOffset));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (frame.corner.active) {
        const [cx, cy] = toScreen(frame.corner.x, frame.corner.y);
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy);
        ctx.lineTo(cx + 9, cy);
        ctx.moveTo(cx, cy - 9);
        ctx.lineTo(cx, cy + 9);
        ctx.stroke();
        ctx.strokeRect(cx - 5, cy - 5, 10, 10);
        ctx.lineWidth = 1;
        ctx.fillStyle = AMBER;
        ctx.font = "600 10px ui-monospace, monospace";
        ctx.fillText("90° CORNER", Math.min(cx + 8, w - 70), Math.max(cy - 8, 12));
      }
    }
    ctx.fillStyle = "rgba(226,232,240,0.75)";
    ctx.font = "600 9px ui-monospace, monospace";
    ctx.fillText(swing > 0.96 ? "ROBOT FRAME · ROTATED −45°" : "CAMERA FRAME · RAW", 8, 14);
  }

  function drawTop(pose: Pose, u: number): void {
    const ctx = fit(canvases.top);
    if (!ctx) return;
    const w = canvases.top.clientWidth;
    const h = canvases.top.clientHeight;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w / ((MAZE_COLS + 2.2) * CELL), h / ((MAZE_ROWS + 0.6) * CELL));
    const map = (x: number, z: number): [number, number] => [w / 2 + x * scale, h / 2 + z * scale];
    ctx.fillStyle = "rgba(147,164,255,0.55)";
    for (const wall of maze.walls) {
      const [x, y] = map(wall.x - wall.w / 2, wall.z - wall.d / 2);
      ctx.fillRect(x, y, Math.max(1.5, wall.w * scale), Math.max(1.5, wall.d * scale));
    }
    const upto = Math.round(u * TRAIL_SAMPLES);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(56,189,248,0.18)";
    ctx.beginPath();
    trail.forEach((p, i) => (i === 0 ? ctx.moveTo(...map(p.x, p.z)) : ctx.lineTo(...map(p.x, p.z))));
    ctx.stroke();
    ctx.strokeStyle = CYAN;
    ctx.beginPath();
    for (let i = 0; i <= upto; i += 1) (i === 0 ? ctx.moveTo : ctx.lineTo).apply(ctx, map(trail[i].x, trail[i].z));
    ctx.stroke();
    const cam = mountPose(pose);
    const [cx, cy] = map(cam.x, cam.z);
    ctx.fillStyle = "rgba(56,189,248,0.18)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (const a of [-0.61, 0.61]) {
      const yaw = cam.yaw + a;
      ctx.lineTo(...map(cam.x + Math.cos(yaw) * 1.1, cam.z - Math.sin(yaw) * 1.1));
    }
    ctx.fill();
    const [rx, ry] = map(pose.x, pose.z);
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-pose.yaw);
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, 4.5);
    ctx.lineTo(-5, -4.5);
    ctx.fill();
    ctx.restore();
    const [ex, ey] = map(maze.exit.x, maze.exit.z);
    ctx.fillStyle = CYAN;
    ctx.fillRect(ex - 2, ey - CELL * scale * 0.4, 4, CELL * scale * 0.8);
  }

  return {
    draw(frame, pose, u, now) {
      // Correction animation: raw → rotated, hold, repeat (≈2.6 s cycle).
      const cycle = (now / 2600) % 1;
      const swing = cycle < 0.35 ? 0.5 - 0.5 * Math.cos((cycle / 0.35) * Math.PI) : 1;
      drawDepth(frame);
      drawCorrection(frame, swing);
      drawTop(pose, u);
    },
  };
}
