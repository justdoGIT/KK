import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type JSX, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import { Box3, OrthographicCamera, type Group } from "three";
import { bannerState } from "../../components/ui/contact/banner-timeline.ts";
import { modelUrl } from "../robots/model-assets.ts";
import { buildAstronautRig, instantiateAstronaut, type AstronautInstance } from "./astronaut-rig.ts";
import {
  LOUNGE_ROOT,
  applyPose,
  createPoseBuffer,
  sampleLoungePose,
  type PoseBuffer,
} from "./astronaut-poses.ts";
import { SuitLighting } from "./SuitLighting.tsx";

// The astronaut reclining on the contact banner's top face. The canvas is a
// transparent overlay whose bottom edge sits a fixed distance below the
// banner's top edge; an orthographic camera in pixel units keeps the resting
// line on that face at every viewport size.

/** Seconds since the banner was revealed (negative: not yet revealed). */
export type LoungeClock = { elapsed: number };

/**
 * Resting line above the canvas bottom, in px: the canvas overhangs the
 * banner's top edge by 44px (CSS) and the top face's middle projects ~10-17px
 * above that edge (fixed eye height, see contact-banner.css).
 */
export const LOUNGE_SURFACE_PX = 58;
/** The camera looks down onto the banner at this angle (radians). */
const VIEW_TILT = 0.2;

/** Pixels per world unit: the reclining suit spans roughly a third of the banner. */
function zoomFor(width: number): number {
  return Math.max(230, Math.min(470, width * 0.34)) / 1.75;
}

/** Aims the camera so world y = 0 (the resting line) lands LOUNGE_SURFACE_PX above the bottom edge. */
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

type Rest = { x: number; y: number; width: number };

/** Offsets that put the reclining suit's lowest skinned vertex on y = 0, centred on x = 0. */
function restingOffsets(astronaut: AstronautInstance): Rest {
  const pose = createPoseBuffer();
  sampleLoungePose(0, pose);
  applyPose(astronaut, pose);
  astronaut.root.position.set(0, 0, 0);
  astronaut.root.rotation.set(LOUNGE_ROOT[0], LOUNGE_ROOT[1], LOUNGE_ROOT[2]);
  astronaut.root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(astronaut.root, true);
  return { x: -(box.min.x + box.max.x) / 2, y: -box.min.y, width: box.max.x - box.min.x };
}

/** Drops the reclining suit onto the resting line (`fall` 0..1) at `x` world units. */
function placeLounger(astronaut: AstronautInstance, rest: Rest, x: number, fall: number, drop: number): void {
  astronaut.root.position.set(x + rest.x, rest.y + (1 - fall * fall) * drop, 0);
  astronaut.root.rotation.set(LOUNGE_ROOT[0], LOUNGE_ROOT[1], LOUNGE_ROOT[2] + (1 - fall) * 0.35);
}

function Lounger({ clock }: { clock: RefObject<LoungeClock> }): JSX.Element {
  const gltf = useGLTF(modelUrl("astronaut"), false, true);
  const rig = useMemo(() => buildAstronautRig(gltf.scene), [gltf.scene]);
  const astronaut = useMemo(() => instantiateAstronaut(rig), [rig]);
  const rest = useMemo(() => restingOffsets(astronaut), [astronaut]);
  const pose = useRef<PoseBuffer | null>(null);
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

  useFrame((state) => {
    const { fall } = bannerState(clock.current.elapsed);
    const shown = clock.current.elapsed >= 0 && fall > 0;
    if (holder.current) holder.current.visible = shown;
    if (!shown) return;
    pose.current ??= createPoseBuffer();
    const zoom = zoomFor(size.width);
    // Wide banners: he lounges right of centre, clear of the heading's first line.
    const x = size.width > 760 ? (size.width * 0.2) / zoom : 0;
    sampleLoungePose(state.clock.elapsedTime, pose.current);
    applyPose(astronaut, pose.current);
    placeLounger(astronaut, rest, x, fall, (size.height - LOUNGE_SURFACE_PX) / zoom + 0.6);
    if (shadow.current) {
      shadow.current.position.x = x;
      shadow.current.scale.setScalar(0.55 + 0.45 * fall);
    }
  });

  return (
    <group ref={holder}>
      <primitive object={astronaut.root} />
      <group ref={shadow}>
        <ContactShadows position={[0, 0.002, 0]} scale={[rest.width * 1.3, 0.9]} blur={2.4} far={0.9} opacity={0.55} />
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
        <Lounger clock={clock} />
        <SuitLighting />
        <directionalLight position={[-4, 2.5, -3]} intensity={2.2} color="#38bdf8" />
      </Suspense>
    </Canvas>
  );
}
