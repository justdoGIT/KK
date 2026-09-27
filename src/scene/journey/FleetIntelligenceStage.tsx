import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AiTensorProcessor } from "../components/AiTensorProcessor.tsx";

type FleetIntelligenceStageProps = {
  active: boolean;
};

type NodePoint = {
  pos: [number, number, number];
  label: string;
  color: string;
};

const NODES: NodePoint[] = [
  { pos: [0, 0, 0], label: "MSI Head Controller", color: "#38bdf8" },
  { pos: [-1.4, 0.9, -0.4], label: "Qualcomm Edge Node", color: "#10b981" },
  { pos: [1.5, 0.8, -0.3], label: "NXP i.MX8MP Video Node", color: "#f59e0b" },
  { pos: [0.9, -1.1, -0.5], label: "ZynqMP UltraScale+ R5/A53", color: "#818cf8" },
  { pos: [-1.3, -1.0, -0.6], label: "Jetson Orin Edge AI", color: "#ec4899" },
];

export function FleetIntelligenceStage({ active }: FleetIntelligenceStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active || !meshGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    meshGroupRef.current.rotation.y = time * 0.15;
    meshGroupRef.current.rotation.x = Math.sin(time * 0.1) * 0.08;
  });

  const connectionLines = useMemo(() => {
    const lines: [number, number][] = [];
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        lines.push([i, j]);
      }
    }
    return lines;
  }, []);

  return (
    <group ref={groupRef} visible={active}>
      <group ref={meshGroupRef}>
        {/* Central Autonomous Tensor AI Core */}
        <group position={[0, 0, 0]}>
          <AiTensorProcessor scale={0.7} />
        </group>

        {/* Connected Fleet Nodes */}
        {NODES.slice(1).map((n, i) => (
          <group key={i} position={n.pos}>
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial
                color={n.color}
                emissive={n.color}
                emissiveIntensity={1.5}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.22, 0.26, 24]} />
              <meshBasicMaterial
                color={n.color}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Interconnect Data Lines */}
        {connectionLines.map(([fromIdx, toIdx], idx) => {
          const p1 = new THREE.Vector3(...NODES[fromIdx].pos);
          const p2 = new THREE.Vector3(...NODES[toIdx].pos);
          const points = [p1, p2];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <primitive
              key={idx}
              object={
                new THREE.Line(
                  lineGeo,
                  new THREE.LineBasicMaterial({
                    color: "#38bdf8",
                    transparent: true,
                    opacity: 0.45,
                  }),
                )
              }
            />
          );
        })}
      </group>
    </group>
  );
}
