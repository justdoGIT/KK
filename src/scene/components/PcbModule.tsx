import { useMemo, type JSX } from "react";
import * as THREE from "three";
import { createPcbTexture } from "../textures.ts";

type PcbModuleProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  theme?: "green" | "dark" | "blue";
};

export function PcbModule({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  theme = "green",
}: PcbModuleProps): JSX.Element {
  const pcbTexture = useMemo(() => createPcbTexture(theme), [theme]);

  // Gold mounting hole ring markers
  const mountingHoles = useMemo<[number, number][]>(() => [
    [-0.95, -0.95],
    [0.95, -0.95],
    [-0.95, 0.95],
    [0.95, 0.95],
  ], []);

  // Header pins on top edge
  const pinCount = 10;
  const pinSpacing = 0.15;
  const pinStartX = -((pinCount - 1) * pinSpacing) / 2;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main PCB Substrate */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 2.2, 0.06]} />
        <meshStandardMaterial
          map={pcbTexture}
          roughness={0.35}
          metalness={0.4}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Gold Edge Connector Fingers (Bottom edge) */}
      <mesh position={[0, -1.06, 0.01]}>
        <boxGeometry args={[1.6, 0.12, 0.07]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Corner Gold Mounting Rings */}
      {mountingHoles.map(([hx, hy], idx) => (
        <mesh key={idx} position={[hx, hy, 0.035]}>
          <ringGeometry args={[0.04, 0.09, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Surface Mount IC 1 (Microcontroller) */}
      <mesh position={[-0.2, 0.1, 0.06]}>
        <boxGeometry args={[0.55, 0.55, 0.07]} />
        <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* Surface Mount IC 2 (Flash/EEPROM Memory) */}
      <mesh position={[0.55, -0.3, 0.05]}>
        <boxGeometry args={[0.4, 0.28, 0.06]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Golden Pin Header Array */}
      {Array.from({ length: pinCount }).map((_, i) => (
        <mesh key={i} position={[pinStartX + i * pinSpacing, 0.95, 0.12]}>
          <boxGeometry args={[0.035, 0.035, 0.22]} />
          <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}

      {/* Header plastic base block */}
      <mesh position={[0, 0.95, 0.04]}>
        <boxGeometry args={[1.65, 0.1, 0.06]} />
        <meshStandardMaterial color="#09090b" roughness={0.6} />
      </mesh>

      {/* SMD Ceramic Capacitors (0805 passives) */}
      <group position={[-0.6, -0.4, 0.04]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.04]} />
          <meshStandardMaterial color="#b45309" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.04]} />
          <meshStandardMaterial color="#b45309" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.04]} />
          <meshStandardMaterial color="#b45309" roughness={0.4} />
        </mesh>
      </group>

      {/* Pulsing Status Micro-LED */}
      <mesh position={[0.8, 0.7, 0.05]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
