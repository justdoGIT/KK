import type { JSX } from "react";

/** Glowing transformation pad under a morph. */
export function MorphPad({ radius, position }: { radius: number; position: [number, number, number] }): JSX.Element {
  return (
    <group position={position}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.003} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#0b1220" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}>
        <ringGeometry args={[radius * 0.96, radius, 96]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}>
        <ringGeometry args={[radius * 0.6, radius * 0.62, 96]} />
        <meshBasicMaterial color="#93a4ff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
