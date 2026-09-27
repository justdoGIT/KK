import { useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PcbModule } from "../components/PcbModule.tsx";

type KernelBootStageProps = {
  active: boolean;
};

export function KernelBootStage({ active }: KernelBootStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const statusLedRef = useRef<THREE.Mesh>(null);
  const securityShieldRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Emerald Status LED steady operational glow
    if (statusLedRef.current) {
      const mat = statusLedRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.5 + Math.sin(time * 3.0) * 0.4;
    }

    // Hardware Root-of-Trust security shield rotation
    if (securityShieldRef.current) {
      securityShieldRef.current.rotation.z = time * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} rotation={[0.4, -0.2, 0.05]} visible={active}>
      {/* Active Operational Board */}
      <PcbModule scale={0.9} theme="green" />

      {/* Solid Emerald Status LED indicating successful kernel boot */}
      <mesh ref={statusLedRef} position={[0.75, 0.75, 0.09]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={2.8}
        />
      </mesh>

      {/* Hardware Root-of-Trust (HSM) Security Shield Hologram */}
      <mesh ref={securityShieldRef} position={[0, 0, 0.18]}>
        <ringGeometry args={[0.5, 0.56, 6]} />
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
