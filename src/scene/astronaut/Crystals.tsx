import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPhysicalMaterial, Object3D, OctahedronGeometry, type InstancedMesh } from "three";
import { phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import type { JourneyClockRef } from "./journey-clock.ts";

// Iridescent diamonds drifting around the landed astronaut (Lusion's
// GoalWhiteTunnelParticles). Seeded layout so reloads look identical.

const COUNT = 42;
const dummy = new Object3D();

type Seed = { x: number; y: number; z: number; size: number; spin: number; phase: number; delay: number };

function seeded(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildSeeds(): Seed[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return {
      x: side * (1.1 + seeded(i, 1) * 3.6),
      y: (seeded(i, 2) - 0.5) * 4.2,
      z: -2.5 + seeded(i, 3) * 3.2,
      size: 0.05 + seeded(i, 4) * 0.12,
      spin: 0.3 + seeded(i, 5) * 1.4,
      phase: seeded(i, 6) * Math.PI * 2,
      delay: seeded(i, 7) * 0.5,
    };
  });
}

export function Crystals({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const seeds = useMemo(() => buildSeeds(), []);
  const geometry = useMemo(() => new OctahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#e8f0ff",
        metalness: 0.15,
        roughness: 0.04,
        clearcoat: 1,
        iridescence: 1,
        iridescenceIOR: 1.7,
        envMapIntensity: 2.8,
        flatShading: true,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { t } = clock.current;
    const wait = phaseRatio(t, "wait");
    mesh.visible = wait > 0;
    if (!mesh.visible) return;
    const time = state.clock.elapsedTime;
    seeds.forEach((seed, i) => {
      const pop = smoothstep(seed.delay * 0.5, seed.delay * 0.5 + 0.3, wait);
      dummy.position.set(
        seed.x + Math.sin(time * 0.3 + seed.phase) * 0.12,
        seed.y + Math.sin(time * 0.5 + seed.phase) * 0.18,
        seed.z,
      );
      dummy.rotation.set(time * seed.spin, time * seed.spin * 0.7, seed.phase);
      dummy.scale.setScalar(seed.size * pop);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />;
}
