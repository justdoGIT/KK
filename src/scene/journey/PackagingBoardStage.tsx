import { useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PcbModule } from "../components/PcbModule.tsx";
import { MicrocontrollerQfp } from "../components/MicrocontrollerQfp.tsx";

type PackagingBoardStageProps = {
  active: boolean;
};

export function PackagingBoardStage({ active }: PackagingBoardStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const chipGroupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    if (chipGroupRef.current) {
      chipGroupRef.current.position.y = 0.2 + Math.sin(time * 1.5) * 0.08;
    }

    if (pulseRingRef.current) {
      const s = 1.0 + (time * 1.5) % 1.5;
      pulseRingRef.current.scale.set(s, s, 1);
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1.5 - s) * 0.7;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} rotation={[0.45, -0.3, 0.1]} visible={active}>
      {/* High-Detail PCB Substrate */}
      <PcbModule scale={0.9} theme="green" />

      {/* Floating QFP Microcontroller Landing & Bonding */}
      <group ref={chipGroupRef} position={[0, 0.35, 0.12]}>
        <MicrocontrollerQfp
          scale={0.65}
          brand="QUALCOMM"
          model="QCM2290 SOC"
          spec="QUAD-CORE 2.0GHz / PMIC BOOT"
        />
      </group>

      {/* Clock Signal Pulse Wave (Cyan) */}
      <mesh ref={pulseRingRef} position={[0, 0, 0.08]}>
        <ringGeometry args={[0.6, 0.65, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
