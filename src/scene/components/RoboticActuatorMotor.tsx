import { type JSX } from "react";
import * as THREE from "three";

type RoboticActuatorMotorProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function RoboticActuatorMotor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RoboticActuatorMotorProps): JSX.Element {
  const flangeHoles: [number, number][] = [
    [-0.48, -0.48],
    [0.48, -0.48],
    [-0.48, 0.48],
    [0.48, 0.48],
  ];

  // Cooling fin grooves
  const fins = [-0.3, -0.15, 0, 0.15, 0.3];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Stator Body (Square-ish cylindrical housing) */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.2, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Cooling Fins / Grooves */}
      {fins.map((fz, idx) => (
        <mesh key={idx} position={[0, 0, fz]}>
          <boxGeometry args={[1.24, 1.24, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.9} />
        </mesh>
      ))}

      {/* Front Faceplate Flange */}
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[1.3, 1.3, 0.1]} />
        <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Flange Mounting Holes */}
      {flangeHoles.map(([hx, hy], idx) => (
        <mesh key={idx} position={[hx, hy, 0.555]}>
          <ringGeometry args={[0.04, 0.08, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Front Bearing Pilot Collar */}
      <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.15, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Stainless Steel D-Cut Output Shaft */}
      <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.55, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.1} />
      </mesh>
      {/* Rear Encoder / Wiring Connector Cap */}
      <mesh position={[0, 0, -0.52]}>
        <boxGeometry args={[0.8, 0.8, 0.14]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}
