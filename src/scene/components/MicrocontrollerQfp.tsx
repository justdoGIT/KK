import { useMemo, type JSX } from "react";
import * as THREE from "three";
import { createChipTexture } from "../textures.ts";

type MicrocontrollerQfpProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  brand?: string;
  model?: string;
  spec?: string;
};

export function MicrocontrollerQfp({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  brand = "QUALCOMM",
  model = "SNAPDRAGON 8",
  spec = "OCTA-CORE 3.2GHz / 5G DSP",
}: MicrocontrollerQfpProps): JSX.Element {
  const chipTexture = useMemo(
    () => createChipTexture(brand, model, spec, "EMBEDDED HIGH-SPEED SOC"),
    [brand, model, spec],
  );

  const pinsPerSide = 12;
  const pinSpacing = 0.11;
  const span = ((pinsPerSide - 1) * pinSpacing) / 2;
  const pinOffsets = useMemo(
    () => Array.from({ length: pinsPerSide }, (_, i) => -span + i * pinSpacing),
    [pinsPerSide, span],
  );

  const bodySize = 1.6;
  const halfBody = bodySize / 2;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main Epoxy IC Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[bodySize, bodySize, 0.22]} />
        <meshStandardMaterial
          map={chipTexture}
          roughness={0.2}
          metalness={0.3}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Central Copper / Nickel Heatspreader Rim */}
      <mesh position={[0, 0, 0.115]}>
        <ringGeometry args={[0.62, 0.65, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* 4 Sides of Metallic Pins */}
      {/* Top & Bottom Pins */}
      {pinOffsets.map((offset, i) => (
        <group key={`tb-${i}`}>
          {/* Top pin */}
          <mesh position={[offset, halfBody + 0.1, -0.02]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.045, 0.22, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Bottom pin */}
          <mesh position={[offset, -halfBody - 0.1, -0.02]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.045, 0.22, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Left & Right Pins */}
      {pinOffsets.map((offset, i) => (
        <group key={`lr-${i}`}>
          {/* Left pin */}
          <mesh position={[-halfBody - 0.1, offset, -0.02]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.22, 0.045, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Right pin */}
          <mesh position={[halfBody + 0.1, offset, -0.02]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.22, 0.045, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
