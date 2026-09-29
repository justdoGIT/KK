/**
 * Deterministic maze generation using seeded DFS.
 * Returns a grid where each cell is a bitmask of open sides: N=1, E=2, S=4, W=8.
 */

const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;

/** Seeded pseudo-random number generator. */
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Generate a maze using depth-first search with a seeded RNG.
 * Returns a 2D array where grid[y][x] is a bitmask of open sides.
 */
export function generateMaze(
  width: number,
  height: number,
  seed: number = 42,
): number[][] {
  const rng = new SeededRNG(seed);
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  const directions = [
    { dy: -1, dx: 0, bit: NORTH, opposite: SOUTH },
    { dy: 0, dx: 1, bit: EAST, opposite: WEST },
    { dy: 1, dx: 0, bit: SOUTH, opposite: NORTH },
    { dy: 0, dx: -1, bit: WEST, opposite: EAST },
  ];

  function dfs(y: number, x: number): void {
    visited[y][x] = true;
    const shuffled = [...directions].sort(() => rng.next() - 0.5);

    for (const { dy, dx, bit, opposite } of shuffled) {
      const ny = y + dy;
      const nx = x + dx;

      if (ny >= 0 && ny < height && nx >= 0 && nx < width && !visited[ny][nx]) {
        grid[y][x] |= bit;
        grid[ny][nx] |= opposite;
        dfs(ny, nx);
      }
    }
  }

  dfs(0, 0);
  return grid;
}

/**
 * Find a start and exit for a maze. Start is top-left, exit is bottom-right.
 */
export function findStartAndExit(
  grid: number[][],
): { start: [number, number]; exit: [number, number] } {
  return {
    start: [0, 0],
    exit: [grid.length - 1, grid[0].length - 1],
  };
}

/**
 * Compute a right-hand-rule wall-following path through the maze.
 * Returns a list of cells [y, x] ordered from start to exit.
 */
export function computeWallFollowingPath(
  grid: number[][],
  startY: number,
  startX: number,
  exitY: number,
  exitX: number,
): Array<[number, number]> {
  const height = grid.length;
  const width = grid[0].length;
  const path: Array<[number, number]> = [[startY, startX]];
  const visited = new Set<string>();
  visited.add(`${startY},${startX}`);

  let y = startY;
  let x = startX;
  // Start facing east (right).
  let heading = 0; // 0=E, 1=S, 2=W, 3=N

  const directions = [
    { dy: 0, dx: 1, name: "E" }, // 0: East
    { dy: 1, dx: 0, name: "S" }, // 1: South
    { dy: 0, dx: -1, name: "W" }, // 2: West
    { dy: -1, dx: 0, name: "N" }, // 3: North
  ];

  const dirBits = [EAST, SOUTH, WEST, NORTH];

  // Right-hand rule: try to turn right, then forward, then left, then back.
  const MAX_ITERATIONS = height * width * 4;
  let iterations = 0;

  while ((y !== exitY || x !== exitX) && iterations < MAX_ITERATIONS) {
    iterations++;

    // Try: right (heading + 1), forward (heading), left (heading - 1), back (heading + 2).
    let moved = false;
    for (let turn = 1; turn <= 3; turn++) {
      const nextHeading = (heading + turn) % 4;
      const { dy, dx } = directions[nextHeading];
      const ny = y + dy;
      const nx = x + dx;

      // Check if this direction is open (has the bit in current cell).
      const currentBit = dirBits[nextHeading];
      if (
        ny >= 0 &&
        ny < height &&
        nx >= 0 &&
        nx < width &&
        (grid[y][x] & currentBit) &&
        !visited.has(`${ny},${nx}`)
      ) {
        y = ny;
        x = nx;
        heading = nextHeading;
        path.push([y, x]);
        visited.add(`${y},${x}`);
        moved = true;
        break;
      }
    }

    if (!moved) {
      // Dead end or loop: backtrack. For now, just stop.
      break;
    }
  }

  return path;
}
