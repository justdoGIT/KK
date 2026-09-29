/**
 * Smooth a grid path using Catmull-Rom curve interpolation.
 * Returns a list of (x, z) points that can be rendered or followed.
 */

export function smoothPath(
  gridPath: Array<[number, number]>,
  pointsPerSegment: number = 20,
  cellSize: number = 1,
): Array<{ x: number; z: number }> {
  if (gridPath.length === 0) return [];
  if (gridPath.length === 1) {
    const [row, col] = gridPath[0];
    return [{ x: col * cellSize + cellSize / 2, z: row * cellSize + cellSize / 2 }];
  }

  const controlPoints = gridPath.map(([row, col]) => ({
    x: col * cellSize + cellSize / 2,
    z: row * cellSize + cellSize / 2,
  }));

  const smoothed: Array<{ x: number; z: number }> = [];

  // For each segment, interpolate using Catmull-Rom.
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[Math.max(0, i - 1)];
    const p1 = controlPoints[i];
    const p2 = controlPoints[i + 1];
    const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];

    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const point = catmullRom(p0, p1, p2, p3, t);
      smoothed.push(point);
    }
  }

  // Add the final point.
  const last = controlPoints[controlPoints.length - 1];
  smoothed.push(last);

  return smoothed;
}

/**
 * Evaluate a Catmull-Rom curve at parameter t ∈ [0, 1].
 */
function catmullRom(
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  p3: { x: number; z: number },
  t: number,
): { x: number; z: number } {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom basis functions.
  const q0 = -0.5 * t3 + t2 - 0.5 * t;
  const q1 = 1.5 * t3 - 2.5 * t2 + 1;
  const q2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
  const q3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: q0 * p0.x + q1 * p1.x + q2 * p2.x + q3 * p3.x,
    z: q0 * p0.z + q1 * p1.z + q2 * p2.z + q3 * p3.z,
  };
}
