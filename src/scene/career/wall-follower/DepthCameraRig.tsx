import { useState, type JSX } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { MOUNT_FWD, MOUNT_H, MOUNT_RIGHT, MOUNT_YAW } from "./depth-sensor.ts";

const RANGE = 1.1;
const HALF_H = (35 * Math.PI) / 180;
const HALF_V = (22 * Math.PI) / 180;
const PITCH = (-10 * Math.PI) / 180;

function frustumGeometry(): { faces: BufferGeometry; edges: BufferGeometry } {
  const corners: number[][] = [];
  for (const [h, v] of [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    const yaw = h * HALF_H;
    const pitch = PITCH + v * HALF_V;
    corners.push([Math.cos(pitch) * Math.cos(yaw) * RANGE, Math.sin(pitch) * RANGE, -Math.cos(pitch) * Math.sin(yaw) * RANGE]);
  }
  const face: number[] = [];
  const edge: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    face.push(0, 0, 0, ...a, ...b);
    edge.push(0, 0, 0, ...a, ...a, ...b);
  }
  const faces = new BufferGeometry();
  faces.setAttribute("position", new Float32BufferAttribute(face, 3));
  const edges = new BufferGeometry();
  edges.setAttribute("position", new Float32BufferAttribute(edge, 3));
  return { faces, edges };
}

/**
 * Original ToF camera body (primitives, IFM O3D-like proportions) mounted on
 * the robot's front-right corner, yawed 45° toward the followed wall, with a
 * translucent field-of-view frustum. Rendered in robot-local space.
 */
export function DepthCameraRig(): JSX.Element {
  const [geometry] = useState(frustumGeometry);
  return (
    <group position={[MOUNT_FWD, MOUNT_H, MOUNT_RIGHT]} rotation-y={MOUNT_YAW}>
      <mesh position={[-0.06, -0.035, 0]} castShadow>
        <boxGeometry args={[0.012, 0.07, 0.012]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.02, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.034, 0.064]} />
        <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
      </mesh>
      {[-0.014, 0.014].map((z) => (
        <mesh key={z} position={[0.006, 0, z]} rotation-z={-Math.PI / 2}>
          <cylinderGeometry args={[0.009, 0.009, 0.006, 20]} />
          <meshStandardMaterial color="#020617" emissive="#38bdf8" emissiveIntensity={z < 0 ? 2.5 : 0.8} toneMapped={false} />
        </mesh>
      ))}
      <mesh geometry={geometry.faces}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.07} depthWrite={false} side={2} />
      </mesh>
      <lineSegments geometry={geometry.edges}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.45} />
      </lineSegments>
    </group>
  );
}
