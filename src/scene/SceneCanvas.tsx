import { Suspense, useEffect, useRef, useState, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { FloatingField } from "./FloatingField.tsx";
import { FluidRipplePlane } from "./FluidRipplePlane.tsx";
import { useAdaptiveDpr } from "./AdaptiveDpr.tsx";
import { isMobile } from "./useCapability.ts";
import { SceneEnvironment } from "./SceneEnvironment.tsx";
import { SchedulerFrames } from "./SchedulerFrames.tsx";

function SceneContent(): JSX.Element {
  return (
    <>
      {/* Studio Lighting Environment. Point-light intensities are scaled for
          physically-correct inverse-square falloff at each light's actual
          distance from the origin (three r155+ default) — the previous
          values of ~1 contributed only ~0.02 illuminance at ~8 units away,
          effectively invisible. The Environment below gives metals and
          high-roughness surfaces something to reflect. */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 5]} intensity={1.6} />
      <pointLight position={[-6, -4, 4]} intensity={55} color="#38bdf8" />
      <pointLight position={[5, -5, -3]} intensity={35} color="#f59e0b" />
      <pointLight position={[0, 6, -4]} intensity={26} color="#60a5fa" />
      <SceneEnvironment />

      {/* Domain-specific 3D Floating Field */}
      <FloatingField />

      {/* Persistent Fluid Ripple & Chromatic Dispersion Plane (Always Active) */}
      <FluidRipplePlane />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={["#0a0a0b", 6, 18]} />
    </>
  );
}

export function SceneCanvas(): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const { dpr, monitor } = useAdaptiveDpr();
  const mobile = isMobile();

  // Pause rendering (never unmount, which would drop the WebGL context and
  // its loaded assets) once the hero section itself scrolls out of view, not
  // just on tab-hide — the canvas is a hero-scoped background, so most of a
  // long scroll session it's off-screen entirely.
  useEffect(() => {
    const hero = document.getElementById("hero") ?? containerRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "20% 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="scene-container" aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop="never"
        camera={{
          position: mobile ? [0, 0, 6.2] : [0.4, 0, 5.2],
          fov: 46,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <SchedulerFrames active={active} />
        {monitor}
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
