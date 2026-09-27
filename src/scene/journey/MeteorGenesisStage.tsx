import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type MeteorGenesisStageProps = {
  active: boolean;
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function MeteorGenesisStage({ active }: MeteorGenesisStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const meteorPointsRef = useRef<THREE.Points>(null);
  const sandPointsRef = useRef<THREE.Points>(null);

  const meteorCount = 180;
  const sandCount = 1800;

  // Falling Meteor particles
  const [meteorPositions, meteorVels] = useMemo(() => {
    const pos = new Float32Array(meteorCount * 3);
    const vel = new Float32Array(meteorCount * 3);
    for (let i = 0; i < meteorCount; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 6.0;
      pos[i * 3 + 1] = pseudoRandom(i * 3 + 2) * 5.0 + 2.0;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 6.0;

      vel[i * 3] = (pseudoRandom(i * 3 + 4) - 0.5) * 0.5;
      vel[i * 3 + 1] = -(pseudoRandom(i * 3 + 5) * 3.5 + 2.5); // Downward meteor velocity
      vel[i * 3 + 2] = (pseudoRandom(i * 3 + 6) - 0.5) * 0.5;
    }
    return [pos, vel];
  }, [meteorCount]);

  // Desert Sand bed that crystallizes into microchips
  const [sandPos, sandCols] = useMemo(() => {
    const pos = new Float32Array(sandCount * 3);
    const col = new Float32Array(sandCount * 3);
    const goldColor = new THREE.Color("#f59e0b");
    const cyanColor = new THREE.Color("#38bdf8");

    for (let i = 0; i < sandCount; i++) {
      const u = pseudoRandom(i * 3 + 7);
      const v = pseudoRandom(i * 3 + 8);
      const x = (u - 0.5) * 6.5;
      const z = (v - 0.5) * 6.5;
      const y = Math.sin(x * 1.5) * 0.25 + Math.cos(z * 1.2) * 0.2 - 0.9;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color transition from golden desert sand to cyan silicon crystal
      const isCenter = Math.sqrt(x * x + z * z) < 1.8;
      const c = isCenter ? cyanColor : goldColor;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [sandCount]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Animate falling meteors
    if (meteorPointsRef.current) {
      const posAttr = meteorPointsRef.current.geometry.attributes.position;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < meteorCount; i++) {
          arr[i * 3] += meteorVels[i * 3] * delta;
          arr[i * 3 + 1] += meteorVels[i * 3 + 1] * delta;
          arr[i * 3 + 2] += meteorVels[i * 3 + 2] * delta;

          // Reset when hitting desert sand plane
          if (arr[i * 3 + 1] < -0.8) {
            arr[i * 3] = (pseudoRandom(i + time) - 0.5) * 5.0;
            arr[i * 3 + 1] = pseudoRandom(i * 2 + time) * 4.0 + 3.0;
            arr[i * 3 + 2] = (pseudoRandom(i * 3 + time) - 0.5) * 5.0;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    if (sandPointsRef.current) {
      sandPointsRef.current.rotation.y = time * 0.04;
    }
  });

  return (
    <group ref={groupRef} visible={active}>
      {/* Falling Cosmic Plasma Meteor Shower */}
      <points ref={meteorPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[meteorPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#ffedd5"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Desert Sand Bed Crystallizing into Silicon */}
      <points ref={sandPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sandPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[sandCols, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Center Impact Crater: Crystallized Silicon Die Forming */}
      <group position={[0, -0.4, 0]}>
        {/* Plasma Impact Glow Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.4, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Cold Unpowered Silicon Die Coalescing */}
        <mesh position={[0, 0.2, 0]} rotation={[0.2, 0.4, 0]}>
          <boxGeometry args={[1.2, 0.15, 1.2]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.4}
            metalness={0.7}
            wireframe
          />
        </mesh>
      </group>
    </group>
  );
}
