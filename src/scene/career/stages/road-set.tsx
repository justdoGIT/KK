import { useState, type JSX, type Ref } from "react";
import { BufferGeometry, Float32BufferAttribute, type LineSegments } from "three";
import { SPEED_LINES, createSpeedLineSeeds } from "./speed-lines.ts";

const POLES = [-16, -11, -6, -1, 4, 9, 14];

/** Wet dark boulevard with dashed lane lines and cyan light poles, running along Z. */
export function Road(): JSX.Element {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 80]} />
        <meshStandardMaterial color="#04070d" roughness={0.22} metalness={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.003}>
        <planeGeometry args={[7, 80]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.3} metalness={0.55} />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.006, -30 + i * 3]}>
          <planeGeometry args={[0.12, 1.4]} />
          <meshBasicMaterial color="#93a4ff" toneMapped={false} />
        </mesh>
      ))}
      {POLES.flatMap((z) =>
        [-3.9, 3.9].map((x) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position-y={2} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 4, 12]} />
              <meshStandardMaterial color="#111a2e" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[x < 0 ? 0.35 : -0.35, 4, 0]}>
              <boxGeometry args={[0.8, 0.06, 0.16]} />
              <meshStandardMaterial color="#0b1220" emissive="#38bdf8" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/** Streaks rushing past the camera during the sprint (positions written each frame). */
export function SpeedLines({ ref }: { ref: Ref<LineSegments> }): JSX.Element {
  const [geometry] = useState(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(SPEED_LINES * 6), 3));
    g.userData.seeds = createSpeedLineSeeds();
    return g;
  });
  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#bae6fd" transparent opacity={0.55} toneMapped={false} />
    </lineSegments>
  );
}
