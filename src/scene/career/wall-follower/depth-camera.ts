import type { Vector3 } from "three";

/**
 * Simulates a depth camera: a 2D array of depth values (distances).
 * Camera is placed at position, looks at target, with given FOV.
 * Returns depthImage[row][col] where row=0 is top, col=0 is left.
 */
export function simulateDepthCamera(
  cameraPos: Vector3,
  cameraTarget: Vector3,
  cameraFOV: number,
  cameraYaw: number, // Angle from heading (0 = straight, 45° = right)
  width: number, // Number of columns in depth image
  height: number, // Number of rows in depth image
  maxDepth: number,
  walls: Array<{ x: number; y: number; w: number; h: number }>, // Axis-aligned rectangular walls
): number[][] {
  // Build camera frame: forward, right, up.
  const forward = cameraTarget.clone().sub(cameraPos).normalize();
  const right = forward.clone().cross(new (forward.constructor as typeof Vector3)(0, 1, 0)).normalize();
  const up = right.clone().cross(forward);

  // Rotate camera by yaw angle around up axis.
  const c = Math.cos(cameraYaw);
  const s = Math.sin(cameraYaw);
  const rotForward = forward.clone().multiplyScalar(c).add(right.clone().multiplyScalar(s));
  const rotRight = right.clone().multiplyScalar(c).sub(forward.clone().multiplyScalar(s));

  const depthImage: number[][] = [];
  const tanHalfFOV = Math.tan((cameraFOV * Math.PI) / 360);

  for (let row = 0; row < height; row++) {
    const depthRow: number[] = [];
    for (let col = 0; col < width; col++) {
      // Normalize col/row to [-1, 1] in camera space.
      const normX = (col + 0.5) / width - 0.5;
      const normY = (row + 0.5) / height - 0.5;

      // Ray direction in camera space (forward + right * tan(fov) + up * tan(fov)).
      const rayDir = rotForward
        .clone()
        .multiplyScalar(1)
        .add(rotRight.clone().multiplyScalar(normX * tanHalfFOV * (width / height)))
        .add(up.clone().multiplyScalar(normY * tanHalfFOV));
      rayDir.normalize();

      // Cast ray and find closest wall intersection.
      let depth = maxDepth;
      for (const wall of walls) {
        const d = raycastBox(cameraPos, rayDir, wall);
        if (d > 0 && d < depth) {
          depth = d;
        }
      }

      depthRow.push(depth);
    }
    depthImage.push(depthRow);
  }

  return depthImage;
}

/**
 * Raycast a single AABB (axis-aligned bounding box) and return distance to first hit.
 * Wall is { x, y, w, h } (2D in XZ plane, Y is up).
 */
function raycastBox(rayOrigin: Vector3, rayDir: Vector3, box: { x: number; y: number; w: number; h: number }): number {
  const minX = box.x - box.w / 2;
  const maxX = box.x + box.w / 2;
  const minZ = box.y - box.h / 2;
  const maxZ = box.y + box.h / 2;
  const minY = 0;
  const maxY = 2; // Walls are tall enough to hit the camera.

  let tmin = -Infinity;
  let tmax = Infinity;

  // X slab.
  if (Math.abs(rayDir.x) > 1e-7) {
    const t1 = (minX - rayOrigin.x) / rayDir.x;
    const t2 = (maxX - rayOrigin.x) / rayDir.x;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  } else if (rayOrigin.x < minX || rayOrigin.x > maxX) {
    return -1; // Ray is outside slab and parallel.
  }

  // Z slab.
  if (Math.abs(rayDir.z) > 1e-7) {
    const t1 = (minZ - rayOrigin.z) / rayDir.z;
    const t2 = (maxZ - rayOrigin.z) / rayDir.z;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  } else if (rayOrigin.z < minZ || rayOrigin.z > maxZ) {
    return -1;
  }

  // Y slab.
  if (Math.abs(rayDir.y) > 1e-7) {
    const t1 = (minY - rayOrigin.y) / rayDir.y;
    const t2 = (maxY - rayOrigin.y) / rayDir.y;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  } else if (rayOrigin.y < minY || rayOrigin.y > maxY) {
    return -1;
  }

  if (tmin > tmax || tmax < 0.001) return -1;
  return Math.max(0, tmin);
}

/**
 * Project depth pixels to 3D points in camera frame, then rotate by angle to robot frame.
 * Returns array of { x, y, depth } where depth is in camera frame.
 */
export function correctDepthPixels(
  depthImage: number[][],
  cameraFOV: number,
  rotationAngle: number, // Angle to rotate corrected points (−45° for the 45° yaw camera).
): Array<{ x: number; y: number; depth: number }> {
  const height = depthImage.length;
  const width = depthImage[0]?.length || 0;
  const tanHalfFOV = Math.tan((cameraFOV * Math.PI) / 360);
  const aspectRatio = width / height;
  const cos = Math.cos(rotationAngle);
  const sin = Math.sin(rotationAngle);

  const points: Array<{ x: number; y: number; depth: number }> = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const depth = depthImage[row][col];
      const normX = (col + 0.5) / width - 0.5;
      const normY = (row + 0.5) / height - 0.5;

      // Project to 3D in camera frame (forward = Z, right = X).
      const px = normX * tanHalfFOV * aspectRatio * depth;
      const py = normY * tanHalfFOV * depth;

      // Rotate by correctionAngle.
      const rx = px * cos - py * sin;
      const ry = px * sin + py * cos;

      points.push({ x: rx, y: ry, depth });
    }
  }

  return points;
}
