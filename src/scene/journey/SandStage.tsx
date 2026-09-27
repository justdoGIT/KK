import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SandStageProps = {
  active: boolean;
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function SandStage({ active }: SandStageProps): JSX.Element {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const count = 2400;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const sandColors = [
      new THREE.Color("#d97706"), // Golden amber
      new THREE.Color("#f59e0b"), // Bright quartz gold
      new THREE.Color("#fde68a"), // Light silica crystal
      new THREE.Color("#b45309"), // Deep desert shadow
    ];

    for (let i = 0; i < count; i++) {
      const u = pseudoRandom(i * 3 + 1);
      const v = pseudoRandom(i * 3 + 2);
      const x = (u - 0.5) * 7.5;
      const z = (v - 0.5) * 7.5;
      const y = Math.sin(x * 1.2) * 0.4 + Math.cos(z * 1.5) * 0.3 - 0.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const cIndex = Math.floor(pseudoRandom(i * 3 + 3) * sandColors.length);
      const c = sandColors[cIndex];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.05;
      const posAttr = pointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < count; i += 6) {
          const x = arr[i * 3];
          const z = arr[i * 3 + 2];
          arr[i * 3 + 1] =
            Math.sin(x * 1.2 + time * 1.2) * 0.4 +
            Math.cos(z * 1.5 + time * 0.8) * 0.3 -
            0.5 +
            Math.sin(time * 2.5 + i) * 0.03;
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Quartz Sand Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Central Sparkling Quartz Crystal Cluster */}
      <group position={[0, -0.2, 0]}>
        <mesh rotation={[0.4, 0.6, 0.2]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshPhysicalMaterial
            color="#fef08a"
            roughness={0.1}
            metalness={0.2}
            transmission={0.7}
            thickness={0.8}
            transparent
            opacity={0.85}
            emissive="#f59e0b"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[0.7, -0.3, 0.4]} rotation={[-0.3, 0.8, -0.4]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshPhysicalMaterial
            color="#fbbf24"
            roughness={0.15}
            transmission={0.65}
            transparent
            opacity={0.8}
          />
        </mesh>
        <mesh position={[-0.7, -0.35, -0.3]} rotation={[0.5, -0.6, 0.3]}>
          <octahedronGeometry args={[0.48, 0]} />
          <meshPhysicalMaterial
            color="#fde047"
            roughness={0.12}
            transmission={0.7}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}
