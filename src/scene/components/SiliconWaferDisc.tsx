import { useEffect, useMemo, type JSX } from "react";
import * as THREE from "three";
import { createWaferTexture } from "../textures.ts";

type SiliconWaferDiscProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function SiliconWaferDisc({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SiliconWaferDiscProps): JSX.Element {
  const waferTexture = useMemo(() => createWaferTexture(), []);
  useEffect(() => () => waferTexture.dispose(), [waferTexture]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Silicon Wafer Disc */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.03, 48]} />
        <meshStandardMaterial
          map={waferTexture}
          roughness={0.08}
          metalness={0.7}
          envMapIntensity={2.0}
        />
      </mesh>

      {/* Wafer Outer Mirror Bevel Edge: the disc is a Y-axis cylinder, so the
          ring must lie in its top plane instead of standing through it. */}
      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.21, 48]} />
        <meshStandardMaterial
          color="#38bdf8"
          metalness={0.95}
          roughness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
