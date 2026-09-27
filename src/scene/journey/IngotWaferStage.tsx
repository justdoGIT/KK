import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createWaferTexture } from "../textures.ts";

type IngotWaferStageProps = {
  active: boolean;
};

export function IngotWaferStage({ active }: IngotWaferStageProps): JSX.Element {
  const ingotGroupRef = useRef<THREE.Group>(null);
  const waferTexture = useMemo(() => createWaferTexture(), []);

  useFrame((state, delta) => {
    if (!ingotGroupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    ingotGroupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();
    ingotGroupRef.current.rotation.y = time * 0.4;
  });

  return (
    <group ref={ingotGroupRef} visible={active}>
      {/* Monocrystalline Silicon Ingot (Boule) */}
      <group position={[-1.0, 0, 0]}>
        {/* Seed Crystal Rod Top */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Ingot Cone Crown */}
        <mesh position={[0, 0.85, 0]}>
          <coneGeometry args={[0.85, 0.5, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Main Monocrystalline Cylindrical Ingot Body */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 1.6, 32]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.88}
            roughness={0.15}
            envMapIntensity={1.8}
          />
        </mesh>

        {/* Hot Bottom Melt Zone */}
        <mesh position={[0, -1.05, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.85, 0.4, 32]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={1.8}
          />
        </mesh>
      </group>

      {/* Sliced 300mm Polished Wafer Discs (Fanning Out) */}
      <group position={[1.1, 0, 0]}>
        {[-0.4, -0.1, 0.2, 0.5].map((offset, i) => (
          <mesh
            key={i}
            position={[offset * 0.4, offset * 0.8, offset * 0.2]}
            rotation={[0.4 + i * 0.1, 0.2, -0.1]}
          >
            <cylinderGeometry args={[0.85, 0.85, 0.02, 36]} />
            <meshStandardMaterial
              map={waferTexture}
              metalness={0.9}
              roughness={0.08}
            />
          </mesh>
        ))}

        {/* Diamond Wire Cutting Laser Beam Indicator */}
        <mesh position={[-0.3, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 2.2, 8]} />
          <meshBasicMaterial
            color="#38bdf8"
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}
