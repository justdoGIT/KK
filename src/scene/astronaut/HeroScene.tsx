import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { phaseRatio } from "../../components/ui/astronaut/journey-timeline.ts";
import { AstronautModel, type AstronautHandle } from "./AstronautModel.tsx";
import { createAstronautGeometry, createAstronautMaterials, disposeKit } from "./astronaut-kit.ts";
import { JOINTS, createPoseBuffer, samplePose, type JointName } from "./astronaut-poses.ts";
import { cloneWeight, createRootPose, heroRoot, ledWeight, waveWeight, type RootPose } from "./hero-motion.ts";
import { createLedFace } from "./led-face.ts";
import { GlassShards } from "./GlassShards.tsx";
import { Crystals } from "./Crystals.tsx";
import type { JourneyClockRef } from "./journey-clock.ts";

const CLONES = 4;
const TRAIL_STEP = 7;
const HISTORY = CLONES * TRAIL_STEP + 1;

type FrameBuffers = {
  pose: Record<JointName, [number, number, number]>;
  history: RootPose[];
  cursor: number;
};

function applyRoot(handle: AstronautHandle | null, pose: RootPose, scaleMul = 1): void {
  const root = handle?.root;
  if (!root) return;
  root.position.set(pose.x, pose.y, pose.z);
  root.rotation.set(pose.rx, pose.ry, pose.rz);
  root.scale.setScalar(pose.scale * scaleMul);
}

function applyJoints(handle: AstronautHandle | null, pose: Record<JointName, [number, number, number]>): void {
  if (!handle) return;
  for (const joint of JOINTS) {
    const r = pose[joint];
    handle.joints[joint].current?.rotation.set(r[0], r[1], r[2]);
  }
}

/** Unmasked foreground layer: hero astronaut, tunnel clones, glass, crystals. */
export function HeroScene({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const geometry = useMemo(() => createAstronautGeometry(), []);
  const materials = useMemo(() => createAstronautMaterials(false), []);
  const ghost = useMemo(() => createAstronautMaterials(true), []);
  const face = useMemo(() => createLedFace(), []);
  const buffers = useRef<FrameBuffers | null>(null);
  const heroRef = useRef<AstronautHandle>(null);
  const cloneRefs = useRef<(AstronautHandle | null)[]>([]);
  const rimRef = useRef<DirectionalLight>(null);

  useEffect(
    () => () => {
      disposeKit(geometry, materials);
      disposeKit({}, ghost);
      face.dispose();
    },
    [geometry, materials, ghost, face],
  );

  useFrame((state) => {
    buffers.current ??= {
      pose: createPoseBuffer(),
      history: Array.from({ length: HISTORY }, createRootPose),
      cursor: 0,
    };
    const buf = buffers.current;
    const { t } = clock.current;
    const time = state.clock.elapsedTime;
    const hero = heroRef.current;

    buf.cursor = (buf.cursor + 1) % HISTORY;
    const root = heroRoot(t, time, buf.history[buf.cursor]);
    applyRoot(hero, root);

    samplePose(t, buf.pose);
    const wave = waveWeight(t);
    if (wave > 0) {
      buf.pose.elbowL[2] += Math.sin(time * 6.5) * 0.38 * wave;
      buf.pose.shoulderL[2] += Math.sin(time * 6.5 + 0.6) * 0.08 * wave;
      buf.pose.head[1] += Math.sin(time * 1.3) * 0.06 * wave;
    }
    applyJoints(hero, buf.pose);

    if (hero?.led) {
      const on = ledWeight(t);
      hero.led.visible = on > 0.01;
      hero.materials.led.map = time % 3.4 < 0.14 ? face.blink : face.open;
      hero.materials.led.opacity = on * (0.86 + Math.sin(time * 23) * 0.08);
    }

    const clones = cloneWeight(t);
    const ghostMaterials = cloneRefs.current[0]?.materials;
    if (ghostMaterials) {
      const opacity = 0.3 * clones;
      ghostMaterials.suit.opacity = opacity;
      ghostMaterials.trim.opacity = opacity;
      ghostMaterials.dark.opacity = opacity;
      ghostMaterials.visor.opacity = opacity;
    }
    cloneRefs.current.forEach((clone, i) => {
      if (!clone?.root) return;
      clone.root.visible = clones > 0.01;
      if (!clone.root.visible) return;
      const past = buf.history[(buf.cursor - (i + 1) * TRAIL_STEP + HISTORY * 2) % HISTORY];
      applyRoot(clone, past, 0.94 ** (i + 1));
      clone.root.position.x += (i % 2 === 0 ? -1 : 1) * (0.45 + i * 0.25) * clones;
      clone.root.position.z -= (i + 1) * 0.9;
      applyJoints(clone, buf.pose);
    });

    const rim = rimRef.current;
    if (rim) {
      const white = phaseRatio(t, "whiteTunnel", "drop");
      const inWhite = white > 0 && white < 1;
      rim.color.set(inWhite ? "#4d6bff" : t < 0.58 ? "#a78bfa" : "#cfe0ff");
      rim.intensity = inWhite ? 4 : 2.6;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#e3eaff", "#141726", 0.7]} />
      <directionalLight position={[3, 4, 6]} intensity={2.3} />
      <directionalLight ref={rimRef} position={[-4, 2.5, -3]} intensity={2.6} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#9fb4ff" position={[-5, 0, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[4, 1, 4]} scale={2} />
      </Environment>

      <AstronautModel ref={heroRef} geometry={geometry} materials={materials} withLed />
      {Array.from({ length: CLONES }, (_, i) => (
        <AstronautModel
          key={i}
          ref={(handle) => {
            cloneRefs.current[i] = handle;
          }}
          geometry={geometry}
          materials={ghost}
        />
      ))}
      <GlassShards clock={clock} />
      <Crystals clock={clock} />
    </>
  );
}
