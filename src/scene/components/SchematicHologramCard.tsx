import { useMemo, type JSX } from "react";
import * as THREE from "three";
import { createSchematicTexture } from "../textures.ts";

type SchematicHologramCardProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function SchematicHologramCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SchematicHologramCardProps): JSX.Element {
  const schematicTexture = useMemo(() => createSchematicTexture(), []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Translucent Glowing Hologram Plane */}
      <mesh>
        <planeGeometry args={[1.8, 1.8]} />
        <meshPhysicalMaterial
          map={schematicTexture}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.1}
          transmission={0.4}
          emissive="#38bdf8"
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cybernetic Glowing Card Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.8, 1.8)]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
