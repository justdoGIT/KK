import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createWaferTexture } from "../textures.ts";

type LithographyStageProps = {
  active: boolean;
};

export function LithographyStage({ active }: LithographyStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const scanLaserRef = useRef<THREE.Mesh>(null);
  const waferTexture = useMemo(() => createWaferTexture(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active || !scanLaserRef.current) return;
    const time = state.clock.getElapsedTime();
    scanLaserRef.current.position.y = Math.sin(time * 2.2) * 1.0;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={active}>
      {/* Silicon Wafer under EUV Scanner */}
      <mesh rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.04, 48]} />
        <meshStandardMaterial
          map={waferTexture}
          roughness={0.05}
          metalness={0.8}
        />
      </mesh>

      {/* Photomask Optical Aperture Frame */}
      <group position={[0, 1.2, 0.4]} rotation={[0.4, 0, 0]}>
        <mesh>
          <boxGeometry args={[2.0, 2.0, 0.04]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.9}
            roughness={0.2}
            wireframe
          />
        </mesh>
      </group>

      {/* EUV 13.5nm Laser Scanner Beam Plane */}
      <mesh ref={scanLaserRef} position={[0, 0, 0.1]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[2.4, 0.06, 0.02]} />
        <meshBasicMaterial
          color="#a855f7"
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* EUV Laser Beam Sheet */}
      <mesh position={[0, 0.6, 0.25]} rotation={[0.4, 0, 0]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Laser Light Cone Source */}
      <mesh position={[0, 1.8, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>
    </group>
  );
}
