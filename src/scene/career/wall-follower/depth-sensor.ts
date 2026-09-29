import { WALL_H, type Pose, type Wall } from "./maze.ts";

/**
 * Simulated 3D time-of-flight camera (IFM O3D-style) mounted on the robot's
 * front-right corner, yawed 45° toward the followed (right-hand) wall.
 *
 * Correction: wall returns are projected into the camera frame (a straight
 * wall appears as a 45° diagonal), then rotated by the mount yaw into the
 * robot frame where the followed wall becomes a line parallel to the heading.
 * Returns whose local direction is rotated 90° from that line belong to a
 * perpendicular wall, so the break between the two clusters is a corner.
 */

export const DEPTH_COLS = 48;
export const DEPTH_ROWS = 24;
export const MAX_RANGE = 2.4;
export const MOUNT_YAW = -Math.PI / 4;
export const MOUNT_FWD = 0.1;
export const MOUNT_RIGHT = 0.1;
export const MOUNT_H = 0.19;
const HFOV = (70 * Math.PI) / 180;
const VFOV = (44 * Math.PI) / 180;
const PITCH = (-10 * Math.PI) / 180;

export type SensorFrame = {
  /** Range in metres per pixel (row-major); 0 = no return. */
  depth: Float32Array;
  /** Floor=1, wall=2 per pixel. */
  surface: Uint8Array;
  /** Mid-scanline wall returns in the camera frame (x forward, y left). */
  rawX: Float32Array;
  rawY: Float32Array;
  /** Same returns rotated into the robot frame. */
  corrX: Float32Array;
  corrY: Float32Array;
  valid: Uint8Array;
  /** 1 = parallel to heading (followed wall), 2 = rotated 90° (perpendicular wall). */
  cls: Uint8Array;
  corner: { active: boolean; x: number; y: number };
  /** Lateral distance to the followed wall in the robot frame (m), NaN if unseen. */
  wallOffset: number;
};

export function createSensorFrame(): SensorFrame {
  return {
    depth: new Float32Array(DEPTH_COLS * DEPTH_ROWS),
    surface: new Uint8Array(DEPTH_COLS * DEPTH_ROWS),
    rawX: new Float32Array(DEPTH_COLS),
    rawY: new Float32Array(DEPTH_COLS),
    corrX: new Float32Array(DEPTH_COLS),
    corrY: new Float32Array(DEPTH_COLS),
    valid: new Uint8Array(DEPTH_COLS),
    cls: new Uint8Array(DEPTH_COLS),
    corner: { active: false, x: 0, y: 0 },
    wallOffset: Number.NaN,
  };
}

/** Camera world position/yaw for a robot pose. */
export function mountPose(pose: Pose): { x: number; z: number; yaw: number } {
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  // Robot forward (c, -s); robot right is forward rotated -90° in yaw: (s, c).
  return { x: pose.x + c * MOUNT_FWD + s * MOUNT_RIGHT, z: pose.z - s * MOUNT_FWD + c * MOUNT_RIGHT, yaw: pose.yaw + MOUNT_YAW };
}

/** Ray (origin, unit dir) vs axis-aligned wall boxes in the x/z plane. */
function castRay(ox: number, oz: number, dx: number, dz: number, walls: readonly Wall[]): number {
  let best = MAX_RANGE;
  for (const wall of walls) {
    const minX = wall.x - wall.w / 2;
    const maxX = wall.x + wall.w / 2;
    const minZ = wall.z - wall.d / 2;
    const maxZ = wall.z + wall.d / 2;
    let t0 = 0;
    let t1 = best;
    if (Math.abs(dx) < 1e-9) {
      if (ox < minX || ox > maxX) continue;
    } else {
      const a = (minX - ox) / dx;
      const b = (maxX - ox) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (Math.abs(dz) < 1e-9) {
      if (oz < minZ || oz > maxZ) continue;
    } else {
      const a = (minZ - oz) / dz;
      const b = (maxZ - oz) / dz;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (t0 <= t1 && t0 < best) best = t0;
  }
  return best;
}

function classify(frame: SensorFrame): void {
  const { corrX, corrY, valid, cls } = frame;
  cls.fill(0);
  for (let i = 1; i < DEPTH_COLS - 1; i += 1) {
    if (!valid[i - 1] || !valid[i] || !valid[i + 1]) continue;
    const dx = corrX[i + 1] - corrX[i - 1];
    const dy = corrY[i + 1] - corrY[i - 1];
    if (Math.hypot(dx, dy) > 0.25) continue; // depth discontinuity, not one surface
    const angle = Math.abs(Math.atan2(dy, dx));
    const fromHeading = Math.min(angle, Math.PI - angle);
    if (fromHeading < 0.3) cls[i] = 1;
    else if (fromHeading > Math.PI / 2 - 0.3) cls[i] = 2;
  }
}

/** Intersection of the fitted followed-wall line (y = mean) and perpendicular line (x = mean). */
function locateCorner(frame: SensorFrame): void {
  let n1 = 0;
  let n2 = 0;
  let y1 = 0;
  let x2 = 0;
  let sumOffset = 0;
  for (let i = 0; i < DEPTH_COLS; i += 1) {
    if (frame.cls[i] === 1) {
      n1 += 1;
      y1 += frame.corrY[i];
    } else if (frame.cls[i] === 2) {
      n2 += 1;
      x2 += frame.corrX[i];
    }
  }
  if (n1 > 0) sumOffset = y1 / n1;
  frame.wallOffset = n1 >= 3 ? sumOffset : Number.NaN;
  frame.corner.active = n1 >= 3 && n2 >= 3;
  if (frame.corner.active) {
    frame.corner.x = x2 / n2;
    frame.corner.y = y1 / n1;
  }
}

/** Fills `frame` with a depth image and corrected returns for the given robot pose. */
export function senseInto(frame: SensorFrame, pose: Pose, walls: readonly Wall[]): SensorFrame {
  const cam = mountPose(pose);
  const midRow = Math.floor(DEPTH_ROWS / 2);
  const cosM = Math.cos(-MOUNT_YAW);
  const sinM = Math.sin(-MOUNT_YAW);
  for (let col = 0; col < DEPTH_COLS; col += 1) {
    const alpha = (0.5 - (col + 0.5) / DEPTH_COLS) * HFOV;
    const yaw = cam.yaw + alpha;
    const horizontal = castRay(cam.x, cam.z, Math.cos(yaw), -Math.sin(yaw), walls);
    const hit = horizontal < MAX_RANGE;
    for (let row = 0; row < DEPTH_ROWS; row += 1) {
      const beta = PITCH + (0.5 - (row + 0.5) / DEPTH_ROWS) * VFOV;
      const idx = row * DEPTH_COLS + col;
      const tan = Math.tan(beta);
      const heightAtWall = MOUNT_H + horizontal * tan;
      if (hit && heightAtWall >= 0 && heightAtWall <= WALL_H) {
        frame.depth[idx] = horizontal / Math.cos(beta);
        frame.surface[idx] = 2;
      } else if (beta < 0 && MOUNT_H / -tan < Math.min(horizontal, MAX_RANGE)) {
        frame.depth[idx] = MOUNT_H / Math.sin(-beta);
        frame.surface[idx] = 1;
      } else {
        frame.depth[idx] = 0;
        frame.surface[idx] = 0;
      }
    }
    const valid = hit && frame.surface[midRow * DEPTH_COLS + col] === 2;
    frame.valid[col] = valid ? 1 : 0;
    // Camera frame: x along the optical axis, y to the left.
    const cx = horizontal * Math.cos(alpha);
    const cy = horizontal * Math.sin(alpha);
    frame.rawX[col] = cx;
    frame.rawY[col] = cy;
    // Rotate by the mount yaw (-45°) into the robot frame and add the mount offset.
    frame.corrX[col] = cx * cosM + cy * sinM + MOUNT_FWD;
    frame.corrY[col] = -cx * sinM + cy * cosM - MOUNT_RIGHT;
  }
  classify(frame);
  locateCorner(frame);
  return frame;
}
