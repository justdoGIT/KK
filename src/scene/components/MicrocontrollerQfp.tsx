import { useEffect, useMemo, type JSX } from "react";
import * as THREE from "three";
import { createChipTexture } from "../textures.ts";
import { StaticInstances, type InstanceTransform } from "./StaticInstances.tsx";

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
  useEffect(() => () => chipTexture.dispose(), [chipTexture]);

  const pinsPerSide = 12;
  const pinSpacing = 0.11;
  const span = ((pinsPerSide - 1) * pinSpacing) / 2;
  const pinOffsets = useMemo(
    () => Array.from({ length: pinsPerSide }, (_, i) => -span + i * pinSpacing),
    [pinsPerSide, span],
  );

  const bodySize = 1.6;
  const halfBody = bodySize / 2;
  const pins = useMemo(() => pinOffsets.flatMap((offset): InstanceTransform[] => [
    { position: [offset, halfBody + 0.1, -0.02], rotation: [0.2, 0, 0], scale: [0.045, 0.22, 0.02] },
    { position: [offset, -halfBody - 0.1, -0.02], rotation: [-0.2, 0, 0], scale: [0.045, 0.22, 0.02] },
    { position: [-halfBody - 0.1, offset, -0.02], rotation: [0, -0.2, 0], scale: [0.22, 0.045, 0.02] },
    { position: [halfBody + 0.1, offset, -0.02], rotation: [0, 0.2, 0], scale: [0.22, 0.045, 0.02] },
  ]), [pinOffsets, halfBody]);

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

      {/* All four pin rows retain their authored transforms in one draw. */}
      <StaticInstances name="qfp-pins" transforms={pins}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
      </StaticInstances>
    </group>
  );
}
