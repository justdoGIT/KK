import { Suspense, type JSX } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Color, Fog } from "three";
import { phaseRatio } from "../../components/ui/astronaut/journey-timeline.ts";
import { isMobile } from "../useCapability.ts";
import { HeroScene } from "./HeroScene.tsx";
import { WorldSpace } from "./WorldSpace.tsx";
import { WorldTunnels } from "./WorldTunnels.tsx";
import type { JourneyClockRef } from "./journey-clock.ts";

// Two canvases, mirroring Lusion's split between the masked tunnel scene and
// the pre-UFX foreground: the world renders only inside the DOM frame mask,
// the hero layer is unmasked once the astronaut breaks the glass.

const CAMERA = { position: [0, 0, 6] as [number, number, number], fov: 35, near: 0.1, far: 80 };

type CanvasProps = { clock: JourneyClockRef; active: boolean };

const SPACE = new Color("#03050d");
const BLACK = new Color("#000000");
const CORRIDOR = new Color("#2a39c9");

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

function dpr(): [number, number] {
  return isMobile() ? [1, 1.25] : [1, 1.75];
}

export function WorldCanvas({ clock, active }: CanvasProps): JSX.Element {
  return (
    <Canvas
      className="aj-canvas"
      dpr={dpr()}
      frameloop={active ? "always" : "never"}
      camera={CAMERA}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <WorldAtmosphere clock={clock} />
      <Suspense fallback={null}>
        <WorldSpace clock={clock} />
        <WorldTunnels clock={clock} />
      </Suspense>
    </Canvas>
  );
}

export function HeroCanvas({ clock, active }: CanvasProps): JSX.Element {
  return (
    <Canvas
      className="aj-canvas"
      dpr={dpr()}
      frameloop={active ? "always" : "never"}
      camera={CAMERA}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <HeroScene clock={clock} />
      </Suspense>
    </Canvas>
  );
}
