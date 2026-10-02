import { useEffect, useMemo, type JSX } from "react";
import * as THREE from "three";
import { createChipTexture } from "../textures.ts";

type AiTensorProcessorProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function AiTensorProcessor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: AiTensorProcessorProps): JSX.Element {
  const chipTexture = useMemo(
    () =>
      createChipTexture(
        "NPU TENSOR-X",
        "EDGE AI ACCELERATOR",
        "128 TOPS • FP8 / INT4",
        "NEURAL HARDWARE INFERENCE",
      ),
    [],
  );
  useEffect(() => () => chipTexture.dispose(), [chipTexture]);

  // Matrix of BGA solder balls (6x6 array)
  const bgaGrid = useMemo(() => {
    const coords: [number, number][] = [];
    const size = 6;
    const spacing = 0.22;
    const start = -((size - 1) * spacing) / 2;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip some inner corners for realistic pattern
        if ((r === 2 || r === 3) && (c === 2 || c === 3)) continue;
        coords.push([start + c * spacing, start + r * spacing]);
      }
    }
    return coords;
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Substrate Interposer Layer */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[1.7, 1.7, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Main Ceramic / Silicon Die Lid */}
      <mesh castShadow position={[0, 0, 0.05]}>
        <boxGeometry args={[1.4, 1.4, 0.14]} />
        <meshStandardMaterial
          map={chipTexture}
          roughness={0.15}
          metalness={0.5}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* Gold Heat Spreader Bevel Rim */}
      <mesh position={[0, 0, 0.125]}>
        <ringGeometry args={[0.55, 0.62, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.95}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* BGA Solder Balls (Metallic chrome spheres) */}
      {bgaGrid.map(([bx, by], idx) => (
        <mesh key={idx} position={[bx, by, -0.12]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.98} roughness={0.08} />
        </mesh>
      ))}

      {/* Neural Core Emissive Activity Circuit (Cyan glowing ring) */}
      <mesh position={[0, 0, 0.126]}>
        <ringGeometry args={[0.2, 0.23, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={3}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
