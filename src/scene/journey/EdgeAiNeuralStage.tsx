import { useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AiTensorProcessor } from "../components/AiTensorProcessor.tsx";

type EdgeAiNeuralStageProps = {
  active: boolean;
};

export function EdgeAiNeuralStage({ active }: EdgeAiNeuralStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const synapseGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active) return;
    const time = state.clock.getElapsedTime();

    if (synapseGroupRef.current) {
      synapseGroupRef.current.rotation.z = time * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} visible={active}>
      {/* Central High-Performance AI Tensor NPU Core */}
      <AiTensorProcessor scale={0.85} />

      {/* Neural Synapse Interconnect Orbit Grid */}
      <group ref={synapseGroupRef} position={[0, 0, 0.15]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ang = (i * Math.PI) / 3;
          const x = Math.cos(ang) * 1.35;
          const y = Math.sin(ang) * 1.35;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          );
        })}
        <mesh>
          <ringGeometry args={[1.3, 1.35, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
