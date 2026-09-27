import { type JSX } from "react";

type AxialResistorProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function AxialResistor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: AxialResistorProps): JSX.Element {
  // 5 standard resistor color bands (e.g. 10kΩ 1%: Brown, Black, Black, Red, Brown)
  const bandColors = ["#854d0e", "#0f172a", "#0f172a", "#dc2626", "#854d0e"];
  const bandPositions = [-0.35, -0.18, -0.02, 0.15, 0.35];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Central Cylindrical Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 24]} />
        <meshStandardMaterial color="#fef08a" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Rounded Bulb Ends */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.23, 20, 20]} />
        <meshStandardMaterial color="#fef08a" roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <sphereGeometry args={[0.23, 20, 20]} />
        <meshStandardMaterial color="#fef08a" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* 5 Color Bands */}
      {bandColors.map((col, idx) => (
        <mesh key={idx} position={[0, bandPositions[idx], 0]}>
          <cylinderGeometry args={[0.225, 0.225, 0.08, 24]} />
          <meshStandardMaterial color={col} roughness={0.2} metalness={0.3} />
        </mesh>
      ))}

      {/* Top Axial Wire Lead */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.9, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Bottom Axial Wire Lead */}
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.9, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}
