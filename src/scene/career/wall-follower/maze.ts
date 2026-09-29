/**
 * Deterministic maze + right-hand-rule wall-follower trajectory for the
 * IFM stage. World frame: x east, z south, y up; maze centred on the origin.
 * Yaw follows three.js `rotation.y`: yaw 0 faces +x, heading vector
 * (cos yaw, -sin yaw) in (x, z).
 */

export const MAZE_COLS = 7;
export const MAZE_ROWS = 5;
export const CELL = 0.8;
export const WALL_T = 0.06;
export const WALL_H = 0.34;

const E = 0;
const S = 1;
const W = 2;
const N = 3;
const DX = [1, 0, -1, 0];
const DZ = [0, 1, 0, -1];
const DIR_YAW = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
const ARC_R = CELL * 0.32;
const SPIN_COST = 0.4;

export type Wall = { x: number; z: number; w: number; d: number };
export type Pose = { x: number; z: number; yaw: number; s: number; turn: number; kind: PieceKind };
export type PieceKind = "line" | "arc-left" | "arc-right" | "spin";

type Piece = {
  kind: PieceKind;
  cost: number;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  cx: number;
  cz: number;
  a0: number;
  yaw0: number;
  dyaw: number;
};

export type Maze = {
  open: number[][];
  walls: Wall[];
  pieces: Piece[];
  costs: number[];
  total: number;
  start: { x: number; z: number };
  exit: { x: number; z: number };
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cellCenter(cx: number, cz: number): { x: number; z: number } {
  return { x: (cx - (MAZE_COLS - 1) / 2) * CELL, z: (cz - (MAZE_ROWS - 1) / 2) * CELL };
}

function carve(seed: number): number[][] {
  const rand = mulberry32(seed);
  const open = Array.from({ length: MAZE_ROWS }, () => new Array<number>(MAZE_COLS).fill(0));
  const seen = Array.from({ length: MAZE_ROWS }, () => new Array<boolean>(MAZE_COLS).fill(false));
  const stack: [number, number][] = [[0, MAZE_ROWS - 1]];
  seen[MAZE_ROWS - 1][0] = true;
  while (stack.length > 0) {
    const [cx, cz] = stack[stack.length - 1];
    const options = [E, S, W, N].filter((d) => {
      const nx = cx + DX[d];
      const nz = cz + DZ[d];
      return nx >= 0 && nz >= 0 && nx < MAZE_COLS && nz < MAZE_ROWS && !seen[nz][nx];
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const d = options[Math.floor(rand() * options.length)];
    const nx = cx + DX[d];
    const nz = cz + DZ[d];
    open[cz][cx] |= 1 << d;
    open[nz][nx] |= 1 << ((d + 2) % 4);
    seen[nz][nx] = true;
    stack.push([nx, nz]);
  }
  open[MAZE_ROWS - 1][0] |= 1 << W; // entrance
  open[0][MAZE_COLS - 1] |= 1 << E; // exit
  return open;
}

/** Right-hand rule on the grid: try right, forward, left, back. */
function followRightWall(open: number[][]): { cells: [number, number][]; dirs: number[] } {
  let cx = 0;
  let cz = MAZE_ROWS - 1;
  let heading = E;
  const cells: [number, number][] = [[cx, cz]];
  const dirs: number[] = [];
  for (let guard = 0; guard < 400; guard += 1) {
    if (cx === MAZE_COLS - 1 && cz === 0) {
      dirs.push(E);
      break;
    }
    for (const turn of [1, 0, 3, 2]) {
      const d = (heading + turn) % 4;
      if (!(open[cz][cx] & (1 << d))) continue;
      const nx = cx + DX[d];
      const nz = cz + DZ[d];
      if (nx < 0 || nz < 0 || nx >= MAZE_COLS || nz >= MAZE_ROWS) continue;
      heading = d;
      cx = nx;
      cz = nz;
      cells.push([cx, cz]);
      dirs.push(d);
      break;
    }
  }
  return { cells, dirs };
}

function buildWalls(open: number[][]): Wall[] {
  const walls: Wall[] = [];
  const half = CELL / 2;
  for (let cz = 0; cz < MAZE_ROWS; cz += 1) {
    for (let cx = 0; cx < MAZE_COLS; cx += 1) {
      const c = cellCenter(cx, cz);
      if (!(open[cz][cx] & (1 << N))) walls.push({ x: c.x, z: c.z - half, w: CELL + WALL_T, d: WALL_T });
      if (!(open[cz][cx] & (1 << W))) walls.push({ x: c.x - half, z: c.z, w: WALL_T, d: CELL + WALL_T });
      if (cz === MAZE_ROWS - 1 && !(open[cz][cx] & (1 << S))) {
        walls.push({ x: c.x, z: c.z + half, w: CELL + WALL_T, d: WALL_T });
      }
      if (cx === MAZE_COLS - 1 && !(open[cz][cx] & (1 << E))) {
        walls.push({ x: c.x + half, z: c.z, w: WALL_T, d: CELL + WALL_T });
      }
    }
  }
  return walls;
}

function line(x0: number, z0: number, x1: number, z1: number, yaw: number): Piece {
  const cost = Math.hypot(x1 - x0, z1 - z0);
  return { kind: "line", cost, x0, z0, x1, z1, cx: 0, cz: 0, a0: 0, yaw0: yaw, dyaw: 0 };
}

function buildPieces(cells: [number, number][], dirs: number[]): Piece[] {
  const pieces: Piece[] = [];
  const first = cellCenter(cells[0][0], cells[0][1]);
  let px = first.x - CELL * 0.9;
  let pz = first.z;
  let yaw = DIR_YAW[E];
  let incoming = E;
  for (let i = 0; i < dirs.length; i += 1) {
    const c = cellCenter(cells[i][0], cells[i][1]);
    const out = dirs[i];
    const diff = (out - incoming + 4) % 4;
    if (diff === 0) continue;
    if (diff === 2) {
      pieces.push(line(px, pz, c.x, c.z, yaw));
      pieces.push({ kind: "spin", cost: SPIN_COST, x0: c.x, z0: c.z, x1: c.x, z1: c.z, cx: 0, cz: 0, a0: 0, yaw0: yaw, dyaw: Math.PI });
      px = c.x;
      pz = c.z;
    } else {
      const inX = c.x - DX[incoming] * ARC_R;
      const inZ = c.z - DZ[incoming] * ARC_R;
      pieces.push(line(px, pz, inX, inZ, yaw));
      const cx = inX + DX[out] * ARC_R;
      const cz = inZ + DZ[out] * ARC_R;
      const right = diff === 1;
      const dyaw = right ? -Math.PI / 2 : Math.PI / 2;
      const a0 = Math.atan2(-(inZ - cz), inX - cx);
      pieces.push({ kind: right ? "arc-right" : "arc-left", cost: (ARC_R * Math.PI) / 2, x0: inX, z0: inZ, x1: 0, z1: 0, cx, cz, a0, yaw0: yaw, dyaw });
      px = c.x + DX[out] * ARC_R;
      pz = c.z + DZ[out] * ARC_R;
    }
    yaw += pieces[pieces.length - 1].dyaw;
    incoming = out;
  }
  const last = cellCenter(cells[cells.length - 1][0], cells[cells.length - 1][1]);
  pieces.push(line(px, pz, last.x + CELL * 1.6, last.z, yaw));
  return pieces;
}

function pathLength(open: number[][]): { moves: number; deadEnds: number } {
  const { dirs } = followRightWall(open);
  let deadEnds = 0;
  for (let i = 1; i < dirs.length; i += 1) if ((dirs[i] - dirs[i - 1] + 4) % 4 === 2) deadEnds += 1;
  return { moves: dirs.length, deadEnds };
}

/** Picks the first seed whose wall-follow run is cinematic: long enough, with dead ends. */
function pickSeed(): number {
  for (let seed = 1; seed < 500; seed += 1) {
    const { moves, deadEnds } = pathLength(carve(seed));
    if (moves >= 22 && moves <= 30 && deadEnds >= 2) return seed;
  }
  return 7;
}

export function createMaze(): Maze {
  const open = carve(pickSeed());
  const { cells, dirs } = followRightWall(open);
  const pieces = buildPieces(cells, dirs);
  const costs: number[] = [];
  let total = 0;
  for (const piece of pieces) {
    costs.push(total);
    total += piece.cost;
  }
  const s = cellCenter(0, MAZE_ROWS - 1);
  const e = cellCenter(MAZE_COLS - 1, 0);
  return { open, walls: buildWalls(open), pieces, costs, total, start: { x: s.x - CELL / 2, z: s.z }, exit: { x: e.x + CELL / 2, z: e.z } };
}

/** Robot pose at normalized run progress u (0..1). `s` is linear distance; `turn` is cumulative yaw. */
export function poseAt(maze: Maze, u: number, out: Pose): Pose {
  const target = Math.min(Math.max(u, 0), 1) * maze.total;
  let i = maze.pieces.length - 1;
  while (i > 0 && maze.costs[i] > target) i -= 1;
  let s = 0;
  let turn = 0;
  for (let k = 0; k < i; k += 1) {
    const p = maze.pieces[k];
    if (p.kind !== "spin") s += p.cost;
    turn += p.dyaw;
  }
  const piece = maze.pieces[i];
  const f = piece.cost > 0 ? Math.min(Math.max((target - maze.costs[i]) / piece.cost, 0), 1) : 1;
  out.kind = piece.kind;
  if (piece.kind === "line") {
    out.x = piece.x0 + (piece.x1 - piece.x0) * f;
    out.z = piece.z0 + (piece.z1 - piece.z0) * f;
    out.yaw = piece.yaw0;
    out.s = s + piece.cost * f;
    out.turn = turn;
  } else if (piece.kind === "spin") {
    out.x = piece.x0;
    out.z = piece.z0;
    out.yaw = piece.yaw0 + piece.dyaw * f;
    out.s = s;
    out.turn = turn + piece.dyaw * f;
  } else {
    const a = piece.a0 + piece.dyaw * f;
    out.x = piece.cx + ARC_R * Math.cos(a);
    out.z = piece.cz - ARC_R * Math.sin(a);
    out.yaw = piece.yaw0 + piece.dyaw * f;
    out.s = s + piece.cost * f;
    out.turn = turn + piece.dyaw * f;
  }
  return out;
}

export function createPose(): Pose {
  return { x: 0, z: 0, yaw: 0, s: 0, turn: 0, kind: "line" };
}

let shared: Maze | null = null;

/** The single deterministic maze shared by the 3D stage and the DOM HUD. */
export function sharedMaze(): Maze {
  shared ??= createMaze();
  return shared;
}

/** Stage-local progress → wall-follow run progress (overview first, exit shot last). */
export function runProgress(local: number): number {
  return Math.min(Math.max((local - 0.08) / 0.84, 0), 1);
}
