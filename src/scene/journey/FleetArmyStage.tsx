import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AiTensorProcessor } from "../components/AiTensorProcessor.tsx";

type FleetArmyStageProps = {
  active: boolean;
};

type ArmyNode = {
  pos: [number, number, number];
  color: string;
  size: number;
};

const ARMY_NODES: ArmyNode[] = [
  { pos: [0, 0, 0], color: "#38bdf8", size: 0.22 },
  { pos: [-1.5, 1.1, -0.4], color: "#10b981", size: 0.16 },
  { pos: [1.6, 1.0, -0.3], color: "#f59e0b", size: 0.16 },
  { pos: [1.1, -1.2, -0.5], color: "#818cf8", size: 0.16 },
  { pos: [-1.4, -1.1, -0.6], color: "#ec4899", size: 0.16 },
  { pos: [-2.6, 0.2, -1.0], color: "#38bdf8", size: 0.14 },
  { pos: [2.5, -0.1, -1.0], color: "#10b981", size: 0.14 },
  { pos: [0, 2.0, -0.8], color: "#f59e0b", size: 0.14 },
  { pos: [0, -2.0, -0.8], color: "#818cf8", size: 0.14 },
];

export function FleetArmyStage({ active }: FleetArmyStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const constellationRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 4.0,
    );

    if (!active || !constellationRef.current) return;
    const time = state.clock.getElapsedTime();
    constellationRef.current.rotation.y = time * 0.15;
    constellationRef.current.rotation.x = Math.sin(time * 0.08) * 0.06;
  });

  const meshLines = useMemo(() => {
    const lines: [number, number][] = [];
    for (let i = 0; i < ARMY_NODES.length; i++) {
      for (let j = i + 1; j < ARMY_NODES.length; j++) {
        const d = Math.hypot(
          ARMY_NODES[i].pos[0] - ARMY_NODES[j].pos[0],
          ARMY_NODES[i].pos[1] - ARMY_NODES[j].pos[1],
          ARMY_NODES[i].pos[2] - ARMY_NODES[j].pos[2],
        );
        if (d < 2.4) {
          lines.push([i, j]);
        }
      }
    }
    return lines;
  }, []);

  return (
    <group ref={groupRef} visible={active}>
      <group ref={constellationRef}>
        {/* Central Controller Fleet Head */}
        <group position={[0, 0, 0]}>
          <AiTensorProcessor scale={0.65} />
        </group>

        {/* Army of Autonomous Fleet Nodes */}
        {ARMY_NODES.slice(1).map((n, i) => (
          <group key={i} position={n.pos}>
            <mesh>
              <sphereGeometry args={[n.size, 16, 16]} />
              <meshStandardMaterial
                color={n.color}
                emissive={n.color}
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[n.size * 1.3, n.size * 1.5, 24]} />
              <meshBasicMaterial
                color={n.color}
                transparent
                opacity={0.65}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Telemetry Interconnect Mesh Lines */}
        {meshLines.map(([fromIdx, toIdx], idx) => {
          const p1 = new THREE.Vector3(...ARMY_NODES[fromIdx].pos);
          const p2 = new THREE.Vector3(...ARMY_NODES[toIdx].pos);
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
                    opacity: 0.4,
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
