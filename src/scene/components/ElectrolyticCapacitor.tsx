import { useMemo, type JSX } from "react";
import * as THREE from "three";
import { createCapacitorTexture } from "../textures.ts";

type ElectrolyticCapacitorProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function ElectrolyticCapacitor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: ElectrolyticCapacitorProps): JSX.Element {
  const capTexture = useMemo(() => createCapacitorTexture(), []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Cylindrical Insulated Body Sleeve */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 1.4, 32]} />
        <meshStandardMaterial
          map={capTexture}
          roughness={0.3}
          metalness={0.4}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Top Aluminum Metal Cap */}
      <mesh position={[0, 0.705, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.02, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Stamped Cross Pressure Vent on Top */}
      <group position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.4, 0.03]} />
          <meshStandardMaterial color="#475569" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.03, 0.4]} />
          <meshStandardMaterial color="#475569" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Bottom Rubber Stopper Base */}
      <mesh position={[0, -0.71, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>

      {/* Long Positive Lead */}
      <mesh position={[0.15, -0.95, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.45, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Shorter Negative Lead */}
      <mesh position={[-0.15, -0.88, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.32, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}
