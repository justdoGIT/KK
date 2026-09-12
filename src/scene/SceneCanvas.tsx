import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Artifact } from "./Artifact.tsx";
import { useAdaptiveQuality } from "./useAdaptiveQuality.ts";
import { isMobile } from "./useCapability.ts";

function SceneContent() {
  const tier = useAdaptiveQuality(true);
  const dpr: [number, number] = isMobile() ? [1, 1] : [1, 1.5];

  const effects = tier !== "off";

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#7dd3fc" />
      <Artifact />
      {effects && <fog attach="fog" args={["#0a0a0b", 5, 15]} />}
      {/* dpr is applied via the Canvas below */}
      {void dpr}
    </>
  );
}

export function SceneCanvas() {
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
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
