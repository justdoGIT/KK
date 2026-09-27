import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type HeatFurnaceStageProps = {
  active: boolean;
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function HeatFurnaceStage({ active }: HeatFurnaceStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const sparkPointsRef = useRef<THREE.Points>(null);
  const oxygenPointsRef = useRef<THREE.Points>(null);
  const crucibleMeshRef = useRef<THREE.Mesh>(null);
  const sparkCount = 450;
  const oxygenCount = 180;

  // Sparks rising from 2000C reduction
  const [sparkPos, sparkVels] = useMemo(() => {
    const pos = new Float32Array(sparkCount * 3);
    const vel = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 2.2;
      pos[i * 3 + 1] = pseudoRandom(i * 3 + 2) * 2.5 - 0.8;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 2.2;

      vel[i * 3] = (pseudoRandom(i * 3 + 4) - 0.5) * 0.4;
      vel[i * 3 + 1] = pseudoRandom(i * 3 + 5) * 1.5 + 0.8;
      vel[i * 3 + 2] = (pseudoRandom(i * 3 + 6) - 0.5) * 0.4;
    }
    return [pos, vel];
  }, [sparkCount]);

  // Oxygen gas release particles (SiO2 + 2C -> Si + 2CO)
  const [oxyPos, oxyVels] = useMemo(() => {
    const pos = new Float32Array(oxygenCount * 3);
    const vel = new Float32Array(oxygenCount * 3);
    for (let i = 0; i < oxygenCount; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 7) - 0.5) * 1.8;
      pos[i * 3 + 1] = pseudoRandom(i * 3 + 8) * 3.0 - 0.5;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 9) - 0.5) * 1.8;

      vel[i * 3] = (pseudoRandom(i * 3 + 10) - 0.5) * 0.8;
      vel[i * 3 + 1] = pseudoRandom(i * 3 + 11) * 2.0 + 1.2;
      vel[i * 3 + 2] = (pseudoRandom(i * 3 + 12) - 0.5) * 0.8;
    }
    return [pos, vel];
  }, [oxygenCount]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Pulse molten crucible glow
    if (crucibleMeshRef.current) {
      const mat = crucibleMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 2.0 + Math.sin(time * 6.0) * 0.5;
      }
    }

    // Animate rising thermal sparks
    if (sparkPointsRef.current) {
      const posAttr = sparkPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          arr[i * 3] += sparkVels[i * 3] * delta;
          arr[i * 3 + 1] += sparkVels[i * 3 + 1] * delta;
          arr[i * 3 + 2] += sparkVels[i * 3 + 2] * delta;

          if (arr[i * 3 + 1] > 2.8) {
            arr[i * 3] = (pseudoRandom(i + time) - 0.5) * 1.8;
            arr[i * 3 + 1] = -0.8;
            arr[i * 3 + 2] = (pseudoRandom(i * 2 + time) - 0.5) * 1.8;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Animate stripping oxygen molecules
    if (oxygenPointsRef.current) {
      const posAttr = oxygenPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < oxygenCount; i++) {
          arr[i * 3] += oxyVels[i * 3] * delta;
          arr[i * 3 + 1] += oxyVels[i * 3 + 1] * delta;
          arr[i * 3 + 2] += oxyVels[i * 3 + 2] * delta;

          if (arr[i * 3 + 1] > 3.2) {
            arr[i * 3] = (pseudoRandom(i * 4 + time) - 0.5) * 1.5;
            arr[i * 3 + 1] = -0.4;
            arr[i * 3 + 2] = (pseudoRandom(i * 5 + time) - 0.5) * 1.5;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* 2000°C Arc Furnace Crucible */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[1.3, 1.0, 1.2, 32]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.7} metalness={0.8} />
      </mesh>

      {/* Incandescent Molten Silicon Melt Pool */}
      <mesh ref={crucibleMeshRef} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.2, 32]} />
        <meshStandardMaterial
          color="#ff4500"
          emissive="#ff2200"
          emissiveIntensity={2.2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Glowing Electrodes (Graphite Arc Rods) */}
      <mesh position={[-0.5, 1.2, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 2.0, 16]} />
        <meshStandardMaterial color="#09090b" roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 1.2, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 2.0, 16]} />
        <meshStandardMaterial color="#09090b" roughness={0.5} />
      </mesh>

      {/* Electric Arc Discharge Glow */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color="#ffedd5"
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Rising 2000C Thermal Sparks */}
      <points ref={sparkPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#fbbf24"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Rising Oxygen Atoms (Cyan-white stripping gas) */}
      <points ref={oxygenPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[oxyPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
