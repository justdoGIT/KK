import { Suspense, useCallback, useState, type JSX } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Color, Fog, NeutralToneMapping } from "three";
import { phaseRatio } from "../../components/ui/astronaut/journey-timeline.ts";
import { SchedulerFrames } from "../SchedulerFrames.tsx";
import { CanvasAvailability } from "../CanvasAvailability.tsx";
import { useAdaptiveDpr } from "../AdaptiveDpr.tsx";
import { HeroScene } from "./HeroScene.tsx";
import { WorldSpace } from "./WorldSpace.tsx";
import { WorldTunnels } from "./WorldTunnels.tsx";
import { modelUrl } from "../robots/model-assets.ts";
import type { JourneyClockRef } from "./journey-clock.ts";

// Two canvases, mirroring Lusion's split between the masked tunnel scene and
// the pre-UFX foreground: the world renders only inside the DOM frame mask,
// the hero layer is unmasked once the astronaut breaks the glass. Both render
// from the shared frame scheduler after the journey driver has written the
// clock, so the 3D layers never trail the DOM card by a frame. Their drawing
// buffers are sized from layout (`offsetSize`), not the rotated mask's box.

const CAMERA = { position: [0, 0, 6] as [number, number, number], fov: 35, near: 0.1, far: 80 };

type CanvasProps = {
  clock: JourneyClockRef;
  active: boolean;
  onAvailabilityChange: (available: boolean) => void;
};

const SPACE = new Color("#03050d");
const BLACK = new Color("#000000");
const CORRIDOR = new Color("#2a39c9");

// Warm drei's parsed GLTF cache when the section approaches the viewport.
useGLTF.preload(modelUrl("astronaut"), false, true);

function WorldAtmosphere({ clock }: { clock: JourneyClockRef }): null {
  useFrame(({ scene }) => {
    const { t } = clock.current;
    const corridor = phaseRatio(t, "whiteTunnel");
    const background = scene.background instanceof Color ? scene.background : new Color();
    // Fog stays attached (toggling it recompiles every material); it is pushed
    // out of range outside the corridor instead.
    const fog = scene.fog instanceof Fog ? scene.fog : new Fog("#2533c2", 5, 26);
    if (corridor > 0) {
      background.copy(BLACK).lerp(CORRIDOR, Math.min(1, corridor * 2.5));
      fog.near = 5;
      fog.far = 26;
    } else {
      background.copy(SPACE).lerp(BLACK, phaseRatio(t, "frameIn"));
      fog.near = 900;
      fog.far = 1000;
    }
    scene.fog = fog;
    scene.background = background;
  });
  return null;
}

const RESIZE = { offsetSize: true } as const;

export function WorldCanvas({ clock, active, onAvailabilityChange }: CanvasProps): JSX.Element {
  const { dpr, monitor } = useAdaptiveDpr();
  const [texturesReady, setTexturesReady] = useState(false);
  const assetsReady = useCallback(() => setTexturesReady(true), []);
  return (
    <Canvas
      className="aj-canvas"
      dpr={dpr}
      frameloop="never"
      resize={RESIZE}
      camera={CAMERA}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      {monitor}
      <fog attach="fog" args={["#2533c2", 900, 1000]} />
      <WorldAtmosphere clock={clock} />
      <Suspense fallback={null}>
        <WorldSpace clock={clock} onAssetsReady={assetsReady} />
        <WorldTunnels clock={clock} />
        <SchedulerFrames active={active} />
        <CanvasAvailability onChange={onAvailabilityChange} ready={texturesReady} />
      </Suspense>
    </Canvas>
  );
}

/** Neutral tone mapping keeps the white suit and the cyan accents bright and on-hue. */
export function HeroCanvas({ clock, active, onAvailabilityChange }: CanvasProps): JSX.Element {
  const { dpr, monitor } = useAdaptiveDpr();
  return (
    <Canvas
      className="aj-canvas"
      dpr={dpr}
      frameloop="never"
      resize={RESIZE}
      camera={CAMERA}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: NeutralToneMapping, toneMappingExposure: 1.05 }}
    >
      {monitor}
      <Suspense fallback={null}>
        <HeroScene clock={clock} />
        <SchedulerFrames active={active} />
        <CanvasAvailability onChange={onAvailabilityChange} />
      </Suspense>
    </Canvas>
  );
}
