import { useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * Procedural artifact: a slowly rotating glass-like icosahedron.
 * Uses MeshPhysicalMaterial when available, falls back to
 * MeshStandardMaterial (handled by R3F automatically).
 */
export function Artifact(): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.15;
    meshRef.current.rotation.y += delta * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 1]} />
      <meshPhysicalMaterial
        color="#7dd3fc"
        metalness={0.3}
        roughness={0.1}
        transmission={0.6}
        thickness={0.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}
