import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SuitLighting } from "./SuitLighting.tsx";
import {
  AdditiveBlending,
  Color,
  MeshPhysicalMaterial,
  Vector3,
  type DirectionalLight,
  type Group,
} from "three";
import { phaseRatio } from "../../components/ui/astronaut/journey-timeline.ts";
import { modelUrl } from "../robots/model-assets.ts";
import { buildAstronautRig, instantiateAstronaut } from "./astronaut-rig.ts";
import { applyPose, createPoseBuffer, samplePose, type PoseBuffer } from "./astronaut-poses.ts";
import {
  cloneWeight,
  createRootPose,
  heroRoot,
  impactEnvelope,
  type RootPose,
} from "./hero-motion.ts";
import { GlassShards } from "./GlassShards.tsx";
import type { JourneyClockRef } from "./journey-clock.ts";

const CLONES = 4;
const TRAIL_STEP = 7;
const HISTORY = CLONES * TRAIL_STEP + 1;

type FrameBuffers = {
  pose: PoseBuffer;
  history: RootPose[];
  impact: Vector3;
  cursor: number;
};

function applyRoot(group: Group, pose: RootPose, scaleMul = 1): void {
  group.position.set(pose.x, pose.y, pose.z);
  group.rotation.set(pose.rx, pose.ry, pose.rz);
  group.scale.setScalar(pose.scale * scaleMul);
}

/** Unmasked foreground: licensed NASA EMU astronaut, tunnel echoes, glass, and impact debris. */
export function HeroScene({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const gltf = useGLTF(modelUrl("astronaut"), false, true);
  const rig = useMemo(() => buildAstronautRig(gltf.scene), [gltf.scene]);
  const hero = useMemo(() => instantiateAstronaut(rig), [rig]);
  const rimRef = useRef<DirectionalLight>(null);
  const buffers = useRef<FrameBuffers | null>(null);
  const ghostMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#38bdf8"),
        emissive: new Color("#38bdf8"),
        emissiveIntensity: 0.65,
        roughness: 0.75,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  const ghostMaterialRef = useRef(ghostMaterial);
  const impactRef = useRef({ x: 0.5, y: 0.56 });
  const ghosts = useMemo(
    () => Array.from({ length: CLONES }, () => instantiateAstronaut(rig, ghostMaterial)),
    [ghostMaterial, rig],
  );

  useEffect(
    () => () => {
      ghostMaterial.dispose();
      for (const part of rig.parts) {
        part.geometry.dispose();
        part.material.dispose();
      }
    },
    [ghostMaterial, rig],
  );

  useFrame((state) => {
    buffers.current ??= {
      pose: createPoseBuffer(),
      history: Array.from({ length: HISTORY }, createRootPose),
      impact: new Vector3(),
      cursor: 0,
    };
    const buf = buffers.current;
    const { t } = clock.current;
    const time = state.clock.elapsedTime;

    buf.cursor = (buf.cursor + 1) % HISTORY;
    const aspect = clock.current.width / Math.max(1, clock.current.height);
    const root = heroRoot(t, time, aspect, buf.history[buf.cursor]);
    samplePose(t, time, buf.pose);
    applyRoot(hero.root, root);
    applyPose(hero, buf.pose);

    const cloneAlpha = cloneWeight(t);
    ghostMaterialRef.current.opacity = cloneAlpha * 0.24;
    ghosts.forEach((ghost, index) => {
      ghost.root.visible = cloneAlpha > 0.01;
      if (!ghost.root.visible) return;
      const offset = (buf.cursor - (index + 1) * TRAIL_STEP + HISTORY * 2) % HISTORY;
      applyRoot(ghost.root, buf.history[offset], 0.94 ** (index + 1));
      ghost.root.position.x += (index % 2 === 0 ? -1 : 1) * (0.45 + index * 0.25) * cloneAlpha;
      ghost.root.position.z -= (index + 1) * 0.9;
      applyPose(ghost, buf.pose);
    });

    const impact = impactEnvelope(t);
    const jitter = impact * impact;
    state.camera.position.set(
      Math.sin(time * 73) * 0.12 * jitter,
      Math.cos(time * 61) * 0.09 * jitter,
      6 + Math.sin(time * 43) * 0.05 * jitter,
    );

    hero.root.updateWorldMatrix(true, true);
    hero.bones.footL.getWorldPosition(buf.impact).project(state.camera);
    impactRef.current.x = Math.max(0.05, Math.min(0.95, (buf.impact.x + 1) * 0.5));
    impactRef.current.y = Math.max(0.05, Math.min(0.95, (buf.impact.y + 1) * 0.5));

    const rim = rimRef.current;
    if (rim) {
      const white = phaseRatio(t, "whiteTunnel");
      rim.color.set(white > 0 && white < 1 ? "#93a4ff" : "#38bdf8");
      rim.intensity = 2.8 + white * 2.2 + impact * 5;
    }
  });

  return (
    <>
      <primitive object={hero.root} />
      {ghosts.map((ghost, index) => (
        <primitive key={index} object={ghost.root} />
      ))}
      <SuitLighting />
      <directionalLight ref={rimRef} position={[-4, 2.5, -3]} intensity={2.8} color="#38bdf8" />
      <GlassShards clock={clock} impact={impactRef} />
    </>
  );
}
