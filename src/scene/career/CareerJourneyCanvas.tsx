import { Suspense, useEffect, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { CareerClockRef } from "./career-clock.ts";
import { preloadModels } from "./robot-model.ts";
import { CAREER_STAGES } from "./stages/registry.ts";

type CareerJourneyCanvasProps = { clock: CareerClockRef; active: boolean };

/** Locally built studio environment: no HDR downloads (CSP connect-src 'self'). */
function StudioEnvironment(): JSX.Element {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2.2} color="#dbeafe" position={[0, 6, 2]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} color="#38bdf8" position={[-6, 2, 0]} scale={[4, 6, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.4} color="#93a4ff" position={[6, 2, -2]} scale={[4, 6, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={1} color="#ffffff" position={[0, 3, -6]} scale={3} />
    </Environment>
  );
}

export function CareerJourneyCanvas({ clock, active }: CareerJourneyCanvasProps): JSX.Element {
  useEffect(() => {
    preloadModels(["turtlebot3", "husky", "go2", "astronaut", "humanoid"]);
  }, []);

  return (
    <Canvas
      className="career-canvas"
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      shadows
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 42, near: 0.03, far: 80, position: [0, 5, 5] }}
    >
      <color attach="background" args={["#02040a"]} />
      <fog attach="fog" args={["#02040a", 7, 24]} />
      <hemisphereLight args={["#93a4ff", "#02040a", 0.45]} />
      <directionalLight
        castShadow
        position={[4, 8, 3]}
        intensity={2.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-5, 3, -4]} intensity={1.1} color="#38bdf8" />
      <StudioEnvironment />
      {CAREER_STAGES.map((Stage, index) => (
        <Suspense key={index} fallback={null}>
          <Stage clock={clock} index={index} />
        </Suspense>
      ))}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.65} luminanceThreshold={0.82} luminanceSmoothing={0.2} />
        <Vignette offset={0.28} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
