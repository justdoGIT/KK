import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type JSX, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import { Box3, MathUtils, OrthographicCamera, Vector3, type Group } from "three";
import type {
  ContactInteraction,
  ContactPoseMode,
} from "../../components/ui/contact/banner-timeline.ts";
import { modelUrl } from "../robots/model-assets.ts";
import {
  BONES,
  buildAstronautRig,
  instantiateAstronaut,
  type AstronautInstance,
} from "./astronaut-rig.ts";
import {
  LOUNGE_ROOT,
  applyPose,
  createPoseBuffer,
  sampleContactPose,
  type PoseBuffer,
} from "./astronaut-poses.ts";
import { SuitLighting } from "./SuitLighting.tsx";

/** Mutable bridge shared by the DOM scroll/interaction driver and R3F. */
export type LoungeClock = {
  progress: number;
  elapsed: number;
  fall: number;
  mode: ContactPoseMode;
  interaction: ContactInteraction;
  interactionUntil: number;
  lastActivity: number;
};

/** The deck line, measured upward from the canvas bottom. */
export const LOUNGE_SURFACE_PX = 124;
const VIEW_TILT = 0.18;
const UPRIGHT_ROOT = [0, 0, 0] as const;

function zoomFor(width: number): number {
  return Math.max(190, Math.min(360, width * 0.3)) / 1.75;
}

function frameCamera(camera: OrthographicCamera, width: number, height: number): void {
  const zoom = zoomFor(width);
  const target = (height / 2 - LOUNGE_SURFACE_PX) / (zoom * Math.cos(VIEW_TILT));
  camera.zoom = zoom;
  camera.position.set(0, target + Math.sin(VIEW_TILT) * 20, Math.cos(VIEW_TILT) * 20);
  camera.lookAt(0, target, 0);
  camera.updateProjectionMatrix();
}

function Framing(): null {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera) frameCamera(camera, size.width, size.height);
  }, [camera, size.width, size.height]);
  return null;
}

type Anchor = { x: number; y: number; width: number };

function rootFor(mode: ContactPoseMode): readonly [number, number, number] {
  return mode === "lounge" ? LOUNGE_ROOT : UPRIGHT_ROOT;
}

/** Computes one reusable deck anchor; never runs in the animation loop. */
function anchorFor(astronaut: AstronautInstance, mode: ContactPoseMode): Anchor {
  const pose = createPoseBuffer();
  sampleContactPose(mode, 0, 1, pose);
  applyPose(astronaut, pose);
  const root = rootFor(mode);
  astronaut.root.position.set(0, 0, 0);
  astronaut.root.rotation.set(root[0], root[1], root[2]);
  astronaut.root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(astronaut.root, true);
  const base =
    mode === "sit" || mode === "wait"
      ? astronaut.bones.hips.getWorldPosition(new Vector3()).y
      : box.min.y;
  return { x: -(box.min.x + box.max.x) / 2, y: -base, width: box.max.x - box.min.x };
}

function modeX(mode: ContactPoseMode, width: number, zoom: number, time: number): number {
  if (mode === "stand" || mode === "landing") return (-width * 0.15) / zoom;
  if (mode === "dance") return (-width * 0.18) / zoom;
  if (mode === "wait") return (width * 0.14) / zoom;
  if (mode === "lounge") return width > 760 ? (-width * 0.17) / zoom : (-width * 0.08) / zoom;
  // While scrolling, the seated astronaut roams within the clear left side.
  const wander = Math.sin(time * 0.31) * 0.72 + Math.sin(time * 0.13 + 1.4) * 0.28;
  return (-width * (0.22 + 0.08 * wander)) / zoom;
}

function dampPose(current: PoseBuffer, target: PoseBuffer, delta: number): void {
  const amount = 1 - Math.exp(-delta * 7);
  for (const bone of BONES) {
    for (let axis = 0; axis < 3; axis += 1) {
      current[bone][axis] += (target[bone][axis] - current[bone][axis]) * amount;
    }
  }
}

function dampRoot(
  astronaut: AstronautInstance,
  x: number,
  y: number,
  rotation: readonly [number, number, number],
  scale: number,
  smoothing: number,
  delta: number,
): void {
  const root = astronaut.root;
  root.position.x = MathUtils.damp(root.position.x, x, smoothing, delta);
  root.position.y = MathUtils.damp(root.position.y, y, smoothing, delta);
  root.position.z = MathUtils.damp(root.position.z, 0, smoothing, delta);
  root.rotation.x = MathUtils.damp(root.rotation.x, rotation[0], smoothing, delta);
  root.rotation.y = MathUtils.damp(root.rotation.y, rotation[1], smoothing, delta);
  root.rotation.z = MathUtils.damp(root.rotation.z, rotation[2], smoothing, delta);
  root.scale.setScalar(MathUtils.damp(root.scale.x, scale, smoothing, delta));
}

function Performer({ clock }: { clock: RefObject<LoungeClock> }): JSX.Element {
  const gltf = useGLTF(modelUrl("astronaut"), false, true);
  const rig = useMemo(() => buildAstronautRig(gltf.scene), [gltf.scene]);
  const astronaut = useMemo(() => instantiateAstronaut(rig), [rig]);
  const anchors = useMemo<Record<ContactPoseMode, Anchor>>(
    () => ({
      landing: anchorFor(astronaut, "landing"),
      stand: anchorFor(astronaut, "stand"),
      sit: anchorFor(astronaut, "sit"),
      lounge: anchorFor(astronaut, "lounge"),
      dance: anchorFor(astronaut, "dance"),
      wait: anchorFor(astronaut, "wait"),
    }),
    [astronaut],
  );
  const currentPose = useRef<PoseBuffer | null>(null);
  const targetPose = useRef<PoseBuffer | null>(null);
  const size = useThree((state) => state.size);
  const holder = useRef<Group>(null);
  const shadow = useRef<Group>(null);

  useEffect(
    () => () => {
      for (const part of rig.parts) {
        part.geometry.dispose();
        part.material.dispose();
      }
    },
    [rig],
  );

  useFrame((state, delta) => {
    const { mode, fall } = clock.current;
    const shown = fall > 0;
    if (holder.current) holder.current.visible = shown;
    if (!shown) return;

    currentPose.current ??= createPoseBuffer();
    targetPose.current ??= createPoseBuffer();
    sampleContactPose(mode, state.clock.elapsedTime, fall, targetPose.current);
    dampPose(currentPose.current, targetPose.current, delta);
    applyPose(astronaut, currentPose.current);

    const zoom = zoomFor(size.width);
    const anchor = anchors[mode];
    const x = modeX(mode, size.width, zoom, state.clock.elapsedTime);
    const drop = mode === "landing" ? (1 - fall * fall) * ((size.height - LOUNGE_SURFACE_PX) / zoom + 1.2) : 0;
    const deckY = mode === "lounge" ? -0.55 : 0;
    const rotation = rootFor(mode);
    const scale = mode === "landing" || mode === "stand" ? 0.72 : 1;
    const smoothing = mode === "dance" ? 12 : 7;
    dampRoot(astronaut, x + anchor.x * scale, anchor.y * scale + drop + deckY, rotation, scale, smoothing, delta);

    if (shadow.current) {
      shadow.current.position.x = x;
      shadow.current.scale.setScalar(0.45 + 0.55 * fall);
    }
  });

  const loungeWidth = anchors.lounge.width;
  return (
    <group ref={holder} visible={false}>
      <primitive object={astronaut.root} />
      <group ref={shadow}>
        <ContactShadows position={[0, 0.002, 0]} scale={[loungeWidth * 1.35, 0.95]} blur={2.4} far={0.9} opacity={0.5} />
      </group>
    </group>
  );
}

export function LoungeCanvas({ clock, active }: { clock: RefObject<LoungeClock>; active: boolean }): JSX.Element {
  return (
    <Canvas
      className="contact-lounge-canvas"
      orthographic
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ near: 0.1, far: 60, position: [0, 4, 20] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Framing />
      <Suspense fallback={null}>
        <Performer clock={clock} />
        <SuitLighting />
        <directionalLight position={[-4, 2.5, -3]} intensity={2.2} color="#38bdf8" />
      </Suspense>
    </Canvas>
  );
}
