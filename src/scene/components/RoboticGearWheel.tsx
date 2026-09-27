import { useMemo, type JSX } from "react";
import * as THREE from "three";

type RoboticGearWheelProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  teethCount?: number;
  color?: string;
};

export function RoboticGearWheel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  teethCount = 14,
  color = "#94a3b8",
}: RoboticGearWheelProps): JSX.Element {
  const toothAngles = useMemo(() => {
    return Array.from({ length: teethCount }, (_, i) => (i * 2 * Math.PI) / teethCount);
  }, [teethCount]);

  // Weight reduction holes around the gear body
  const holeAngles = useMemo(() => [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2], []);

  const radius = 0.85;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Central Axle Bearing Hub */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.28, 32]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Internal Axle Bore (Dark center hole) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Main Gear Disc Body */}
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.18, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.25}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Precision Extruded Gear Teeth */}
      {toothAngles.map((ang, i) => {
        const tx = Math.cos(ang) * (radius + 0.09);
        const tz = Math.sin(ang) * (radius + 0.09);
        return (
          <mesh
            key={i}
            position={[tx, 0, tz]}
            rotation={[0, -ang, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.18, 0.22]} />
            <meshStandardMaterial
              color={color}
              metalness={0.88}
              roughness={0.22}
            />
          </mesh>
        );
      })}

      {/* Circular Anodized Rim Ring */}
      <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.78, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          metalness={0.9}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4 Weight-Reduction Cutout Discs */}
      {holeAngles.map((ang, i) => {
        const hx = Math.cos(ang) * 0.55;
        const hz = Math.sin(ang) * 0.55;
        return (
          <mesh key={i} position={[hx, 0, hz]}>
            <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}
