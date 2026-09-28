import { Suspense, useEffect, useState, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { FloatingField } from "./FloatingField.tsx";
import { FluidRipplePlane } from "./FluidRipplePlane.tsx";
import { isMobile } from "./useCapability.ts";

function SceneContent(): JSX.Element {
  return (
    <>
      {/* Studio Lighting Environment */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 5]} intensity={1.6} />
      <pointLight position={[-6, -4, 4]} intensity={1.4} color="#38bdf8" />
      <pointLight position={[5, -5, -3]} intensity={1.0} color="#f59e0b" />
      <pointLight position={[0, 6, -4]} intensity={0.8} color="#60a5fa" />

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
  const [visible, setVisible] = useState(true);
  const mobile = isMobile();
  const dpr: [number, number] = mobile ? [1, 1] : [1, 1.5];

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="scene-container" aria-hidden="true">
      <Canvas
        dpr={dpr}
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
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
