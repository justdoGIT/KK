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
import { phaseRatio, smoothstep } from "../../components/ui/astronaut/journey-timeline.ts";
import { LAND_AT, LAND_START, type ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { modelUrl } from "../robots/model-assets.ts";
import { BONES, buildAstronautRig, instantiateAstronaut } from "./astronaut-rig.ts";
import { applyPose, createPoseBuffer, samplePose, type PoseBuffer } from "./astronaut-poses.ts";
import { sampleContactPose } from "./contact-poses.ts";
import {
  cloneWeight,
  contactRoot,
  createRootPose,
  heroRoot,
  impactEnvelope,
  type RootPose,
} from "./hero-motion.ts";
import { GlassShards } from "./GlassShards.tsx";
import type { JourneyClockRef } from "./journey-clock.ts";
import {
  createLandingPanel,
  disposeLandingPanel,
  landingAnchor,
  localSoleY,
  placeLandingPanel,
} from "./landing-panel.ts";

const CLONES = 4;
const TRAIL_STEP = 7;
const HISTORY = CLONES * TRAIL_STEP + 1;

type FrameBuffers = {
  pose: PoseBuffer;
  transitionFromPose: PoseBuffer;
  transitionFromRoot: RootPose;
  lastMode: ContactPoseMode | null;
  transitionAt: number;
  history: RootPose[];
  impact: Vector3;
  scratch: Vector3;
  cursor: number;
};

function applyRoot(group: Group, pose: RootPose, scaleMul = 1): void {
  group.position.set(pose.x, pose.y, pose.z);
  group.rotation.set(pose.rx, pose.ry, pose.rz);
  group.scale.setScalar(pose.scale * scaleMul);
}

function copyPose(from: PoseBuffer, to: PoseBuffer): void {
  for (const bone of BONES) {
    to[bone][0] = from[bone][0];
    to[bone][1] = from[bone][1];
    to[bone][2] = from[bone][2];
  }
}

function blendPose(from: PoseBuffer, to: PoseBuffer, amount: number): void {
  for (const bone of BONES) {
    for (let axis = 0; axis < 3; axis += 1) {
      to[bone][axis] = from[bone][axis] + (to[bone][axis] - from[bone][axis]) * amount;
    }
  }
}

function captureRoot(group: Group, out: RootPose): void {
  out.x = group.position.x;
  out.y = group.position.y;
  out.z = group.position.z;
  out.scale = group.scale.x;
  out.rx = group.rotation.x;
  out.ry = group.rotation.y;
  out.rz = group.rotation.z;
}

function blendRoot(from: RootPose, to: RootPose, amount: number): void {
  to.x = from.x + (to.x - from.x) * amount;
  to.y = from.y + (to.y - from.y) * amount;
  to.z = from.z + (to.z - from.z) * amount;
  to.scale = from.scale + (to.scale - from.scale) * amount;
  to.rx = from.rx + (to.rx - from.rx) * amount;
  to.ry = from.ry + (to.ry - from.ry) * amount;
  to.rz = from.rz + (to.rz - from.rz) * amount;
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
  const panel = useMemo(() => createLandingPanel(), []);
  useEffect(() => () => disposeLandingPanel(panel), [panel]);

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
      transitionFromPose: createPoseBuffer(),
      transitionFromRoot: createRootPose(),
      lastMode: null,
      transitionAt: 0,
      history: Array.from({ length: HISTORY }, createRootPose),
      impact: new Vector3(),
      scratch: new Vector3(),
      cursor: 0,
    };
    const buf = buffers.current;
    const { t, finale, width, height } = clock.current;
    const time = state.clock.elapsedTime;
    const fall = smoothstep(LAND_START, LAND_AT, finale.progress);
    const modeChanged = buf.lastMode !== finale.mode;
    const hadPreviousMode = buf.lastMode !== null;
    if (modeChanged) {
      copyPose(buf.pose, buf.transitionFromPose);
      if (hadPreviousMode) captureRoot(hero.root, buf.transitionFromRoot);
      buf.lastMode = finale.mode;
      buf.transitionAt = time;
    }
    const transition = hadPreviousMode ? smoothstep(0, 0.45, time - buf.transitionAt) : 1;

    samplePose(t, time, buf.pose);
    if (finale.progress > 0) {
      const nx = width > 0 ? (finale.cursorX / width) * 2 - 1 : 0;
      const ny = height > 0 ? (finale.cursorY / height) * 2 - 1 : 0;
      sampleContactPose(finale.mode, time, fall, buf.pose, nx, ny);
    }
    if (transition < 1) blendPose(buf.transitionFromPose, buf.pose, transition);
    applyPose(hero, buf.pose);
    // Boot height depends only on the pose, so measure it before moving the root.
    hero.root.updateWorldMatrix(true, true);
    const sole = localSoleY(hero, buf.scratch);
    const anchor = landingAnchor(finale, state.camera, width, height);

    buf.cursor = (buf.cursor + 1) % HISTORY;
    const root = heroRoot(t, time, buf.history[buf.cursor]);
    contactRoot(anchor, finale.mode, sole, fall, time, root);
    if (transition < 1) blendRoot(buf.transitionFromRoot, root, transition);
    applyRoot(hero.root, root);

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
    placeLandingPanel(panel, anchor, hero, fall, smoothstep(0, 0.04, finale.progress), buf.scratch);

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
      <primitive object={panel.mesh} />
      {ghosts.map((ghost, index) => (
        <primitive key={index} object={ghost.root} />
      ))}
      <SuitLighting />
      <directionalLight ref={rimRef} position={[-4, 2.5, -3]} intensity={2.8} color="#38bdf8" />
      <GlassShards clock={clock} impact={impactRef} />
    </>
  );
}
