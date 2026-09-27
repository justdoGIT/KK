import { useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoboticGearWheel } from "../components/RoboticGearWheel.tsx";

type PeripheralsRoboticsStageProps = {
  active: boolean;
};

export function PeripheralsRoboticsStage({ active }: PeripheralsRoboticsStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const tofConeRef = useRef<THREE.Mesh>(null);
  const rfWaveRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    // 3D Time-of-Flight camera vision cone scanning
    if (tofConeRef.current) {
      tofConeRef.current.rotation.y = Math.sin(time * 1.5) * 0.3;
    }

    // MediaTek Wi-Fi 6 / Satellite RF communication wave expansion
    if (rfWaveRef.current) {
      const s = 1.0 + (time * 1.2) % 1.5;
      rfWaveRef.current.scale.set(s, s, 1);
      const mat = rfWaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1.5 - s) * 0.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={active}>
      {/* Industrial Robotic Planetary Gear / Motor Actuator */}
      <group position={[-0.8, -0.2, 0]}>
        <RoboticGearWheel scale={0.8} color="#94a3b8" />
      </group>

      {/* 3D Time-of-Flight Vision Sensor Cone (IFM O3D) */}
      <group ref={tofConeRef} position={[0.9, 0.4, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.7, 1.2, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            wireframe
          />
        </mesh>
      </group>

      {/* RF Wireless Wave (MediaTek MT7668 & Satellite SBD) */}
      <mesh ref={rfWaveRef} position={[0.9, 1.1, 0]}>
        <ringGeometry args={[0.4, 0.45, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
