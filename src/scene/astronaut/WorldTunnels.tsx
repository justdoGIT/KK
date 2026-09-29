import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PlaneGeometry,
  RingGeometry,
  Shape,
  TorusGeometry,
  type Group,
  type InstancedMesh,
} from "three";
import { phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import type { JourneyClockRef } from "./journey-clock.ts";

// Free-fall tunnels. Black tunnel: glowing rings + speed streaks rushing past
// the tumbling astronaut. White tunnel: Lusion's blue-lit corridor of white
// arches, seen through the shrinking 16:9 screen.

const RINGS = 34;
const RING_GAP = 1.4;
const STREAKS = 90;
const ARCHES = 12;
const ARCH_GAP = 2.4;
const FLOOR_Y = -1.9;

function archGeometry(): ExtrudeGeometry {
  const outer = new Shape();
  outer.moveTo(-6, FLOOR_Y);
  outer.lineTo(6, FLOOR_Y);
  outer.lineTo(6, 5);
  outer.lineTo(-6, 5);
  outer.closePath();
  const hole = new Path();
  hole.moveTo(-1.25, FLOOR_Y);
  hole.lineTo(1.25, FLOOR_Y);
  hole.lineTo(1.25, 0.9);
  hole.absarc(0, 0.9, 1.25, 0, Math.PI, false);
  hole.lineTo(-1.25, FLOOR_Y);
  outer.holes.push(hole);
  const porthole = (cx: number) => {
    const p = new Path();
    p.absarc(cx, 1.4, 0.55, 0, Math.PI * 2, true);
    return p;
  };
  outer.holes.push(porthole(-3.2), porthole(3.2));
  return new ExtrudeGeometry(outer, { depth: 0.35, bevelEnabled: false, curveSegments: 32 });
}

function seeded(i: number, k: number): number {
  const s = Math.sin(i * 91.345 + k * 47.853) * 43758.5453;
  return s - Math.floor(s);
}

const dummy = new Object3D();

export function WorldTunnels({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const ringsRef = useRef<InstancedMesh>(null);
  const streaksRef = useRef<InstancedMesh>(null);
  const archesRef = useRef<InstancedMesh>(null);
  const discsRef = useRef<InstancedMesh>(null);
  const corridorRef = useRef<Group>(null);
  const kit = useMemo(
    () => ({
      ring: new TorusGeometry(2.7, 0.014, 6, 120),
      ringMat: new MeshBasicMaterial({ color: "#9d8cff", transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      streak: new BoxGeometry(0.014, 0.014, 1.6),
      streakMat: new MeshBasicMaterial({ color: "#dfe6ff", transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      arch: archGeometry(),
      archMat: new MeshStandardMaterial({ color: "#f4f6ff", roughness: 0.85, metalness: 0 }),
      floor: new PlaneGeometry(12, 40),
      floorMat: new MeshStandardMaterial({ color: "#e9edff", roughness: 0.9 }),
      disc: new RingGeometry(0.34, 0.56, 48),
      discMat: new MeshBasicMaterial({ color: "#aebcff", toneMapped: false }),
      exit: new PlaneGeometry(3, 4),
      exitMat: new MeshBasicMaterial({ color: new Color(3, 3, 3.4), toneMapped: false, fog: false }),
    }),
    [],
  );

  useEffect(
    () => () => {
      Object.values(kit).forEach((item) => item.dispose());
    },
    [kit],
  );

  useFrame((state) => {
    const { t } = clock.current;
    const time = state.clock.elapsedTime;
    const title = phaseRatio(t, "title");
    const tunnel = phaseRatio(t, "blackTunnel");
    const blackStrength = smoothstep(0.55, 1, title) * (1 - smoothstep(0.85, 1, tunnel));

    const rings = ringsRef.current;
    const streaks = streaksRef.current;
    if (rings && streaks) {
      const on = blackStrength > 0.01;
      rings.visible = on;
      streaks.visible = on;
      if (on) {
        (rings.material as MeshBasicMaterial).opacity = blackStrength * 0.9;
        (streaks.material as MeshBasicMaterial).opacity = blackStrength * 0.65;
        const travel = tunnel * 40 + time * 1.6;
        for (let i = 0; i < RINGS; i++) {
          const z = 4 - ((i * RING_GAP + travel) % (RINGS * RING_GAP));
          const wobble = Math.sin(i * 0.7 + time * 0.4) * 0.25;
          dummy.position.set(wobble, Math.cos(i * 0.5 + time * 0.3) * 0.2, z);
          dummy.rotation.set(0, 0, i * 0.3);
          dummy.scale.set(1 + Math.sin(i) * 0.08, 1, 1);
          dummy.updateMatrix();
          rings.setMatrixAt(i, dummy.matrix);
        }
        rings.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < STREAKS; i++) {
          const angle = seeded(i, 1) * Math.PI * 2;
          const radius = 1.4 + seeded(i, 2) * 2.2;
          const z = 5 - ((seeded(i, 3) * 40 + travel * 3) % 40);
          dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 0.6 + seeded(i, 4) * 1.4);
          dummy.updateMatrix();
          streaks.setMatrixAt(i, dummy.matrix);
        }
        streaks.instanceMatrix.needsUpdate = true;
      }
    }

    const corridor = corridorRef.current;
    const arches = archesRef.current;
    const discs = discsRef.current;
    if (corridor && arches && discs) {
      const whiteSpan = phaseRatio(t, "whiteTunnel", "drop");
      corridor.visible = whiteSpan > 0 && whiteSpan < 1;
      if (corridor.visible) {
        const travel = phaseRatio(t, "whiteTunnel", "frameBreak") * 9 + time * 0.5;
        for (let i = 0; i < ARCHES; i++) {
          const z = 3 - ((i * ARCH_GAP + travel) % (ARCHES * ARCH_GAP));
          dummy.position.set(0, 0, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          arches.setMatrixAt(i, dummy.matrix);
          for (let k = 0; k < 2; k++) {
            dummy.position.set(k === 0 ? -0.9 : 0.9, FLOOR_Y + 0.01, z - 1.2);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.updateMatrix();
            discs.setMatrixAt(i * 2 + k, dummy.matrix);
          }
        }
        arches.instanceMatrix.needsUpdate = true;
        discs.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <instancedMesh ref={ringsRef} args={[kit.ring, kit.ringMat, RINGS]} frustumCulled={false} />
      <instancedMesh ref={streaksRef} args={[kit.streak, kit.streakMat, STREAKS]} frustumCulled={false} />
      <group ref={corridorRef}>
        <ambientLight intensity={0.9} color="#c7d0ff" />
        <directionalLight position={[2, 4, 5]} intensity={1.6} color="#ffffff" />
        <pointLight position={[0, 1, -12]} intensity={40} distance={30} color="#6f86ff" />
        <instancedMesh ref={archesRef} args={[kit.arch, kit.archMat, ARCHES]} frustumCulled={false} />
        <instancedMesh ref={discsRef} args={[kit.disc, kit.discMat, ARCHES * 2]} frustumCulled={false} />
        <mesh geometry={kit.floor} material={kit.floorMat} position={[0, FLOOR_Y, -14]} rotation={[-Math.PI / 2, 0, 0]} />
        <mesh geometry={kit.exit} material={kit.exitMat} position={[0, 0, -27]} />
      </group>
    </>
  );
}
