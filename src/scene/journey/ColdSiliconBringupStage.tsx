import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PcbModule } from "../components/PcbModule.tsx";
import { MicrocontrollerQfp } from "../components/MicrocontrollerQfp.tsx";

type ColdSiliconBringupStageProps = {
  active: boolean;
};

export function ColdSiliconBringupStage({ active }: ColdSiliconBringupStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const powerPulseRef = useRef<THREE.Mesh>(null);
  const jtagProbeRef = useRef<THREE.Group>(null);
  const clockWaveRef = useRef<THREE.Mesh>(null);
  const scaleTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(scaleTarget.set(targetScale, targetScale, targetScale), delta * 4.0);

    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Cascading PMIC Power Rail pulse wave (3.3V -> 1.8V -> 0.85V Core)
    if (powerPulseRef.current) {
      const s = 0.5 + (time * 1.8) % 2.0;
      powerPulseRef.current.scale.set(s, s, 1);
      const mat = powerPulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (2.0 - s) * 0.5);
    }

    // Oscillating 480MHz Clock Crystal Sine Wave
    if (clockWaveRef.current) {
      clockWaveRef.current.rotation.z = time * 3.0;
    }

    // JTAG / UART probe needle vibration & telemetry pulse
    if (jtagProbeRef.current) {
      jtagProbeRef.current.position.y = 0.6 + Math.sin(time * 8.0) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} rotation={[0.4, -0.3, 0.1]} visible={active}>
      {/* Hardware Substrate Board */}
      <PcbModule scale={0.9} theme="dark" />

      {/* Cold Silicon SoC with Pins Bonding to Circuit */}
      <group position={[0, 0.2, 0.08]}>
        <MicrocontrollerQfp
          scale={0.65}
          brand="TI SITARA / QUALCOMM"
          model="SECURE BOOT CORE"
          spec="PMIC RAIL: 3.3V ➔ 1.8V ➔ 0.85V"
        />
      </group>

      {/* Cascading PMIC Power Rail Pulse */}
      <mesh ref={powerPulseRef} position={[0, 0, 0.09]}>
        <ringGeometry args={[0.5, 0.58, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Oscillating 480MHz Clock Crystal Ring */}
      <mesh ref={clockWaveRef} position={[0.7, -0.5, 0.1]}>
        <ringGeometry args={[0.15, 0.18, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* JTAG / UART Diagnostic Probe Beam */}
      <group ref={jtagProbeRef} position={[-0.7, 0.6, 0.3]}>
        <mesh rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.02, 0.005, 0.9, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.15, -0.4, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>
    </group>
  );
}
