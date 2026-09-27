import { useRef, useEffect, type JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RippleCanvas } from "./RippleCanvas.ts";

const RippleShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uRippleTexture: { value: null as THREE.CanvasTexture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uDistortionStrength: { value: 0.05 },
    uChromaticAberration: { value: 0.02 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform sampler2D uRippleTexture;
    uniform vec2 uResolution;
    uniform float uDistortionStrength;
    uniform float uChromaticAberration;
    varying vec2 vUv;

    void main() {
      // Sample ripple displacement normal map
      vec4 rippleColor = texture2D(uRippleTexture, vUv);
      vec2 displacement = (rippleColor.rg - 0.5) * 2.0;
      float intensity = length(displacement);

      if (intensity < 0.01) {
        discard;
      }

      // Chromatic dispersion offsets
      vec2 dispOffset = displacement * uDistortionStrength;

      // Liquid reflection & iridescent color fringe at wave crests
      vec3 iridescence = vec3(
        0.5 + 0.5 * cos(uTime * 2.0 + intensity * 6.28 + 0.0),
        0.5 + 0.5 * cos(uTime * 2.0 + intensity * 6.28 + 2.0),
        0.5 + 0.5 * cos(uTime * 2.0 + intensity * 6.28 + 4.0)
      );

      // Specular caustic rim highlight on ripple crests
      float crest = smoothstep(0.08, 0.65, intensity) * 0.55;
      vec3 crestGlow = mix(vec3(0.2, 0.7, 1.0), iridescence, 0.45) * crest;

      // Soft water tint
      vec4 finalColor = vec4(crestGlow, intensity * 0.4);
      gl_FragColor = finalColor;
    }
  `,
};

export function FluidRipplePlane(): JSX.Element {
  const { size } = useThree();
  const simRef = useRef<RippleCanvas | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const mouseWindow = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const sim = new RippleCanvas(256, 256);
    simRef.current = sim;

    if (sim.canvas) {
      const tex = new THREE.CanvasTexture(sim.canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      textureRef.current = tex;
      if (materialRef.current) {
        materialRef.current.uniforms.uRippleTexture.value = tex;
      }
    }

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseWindow.current = { x: nx, y: ny, active: true };
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      sim.dispose();
      textureRef.current?.dispose();
      simRef.current = null;
      textureRef.current = null;
    };
  }, []);

  useFrame((state) => {
    const sim = simRef.current;
    const tex = textureRef.current;
    if (!sim) return;

    const time = state.clock.getElapsedTime();
    const ptr = mouseWindow.current.active ? mouseWindow.current : state.pointer;

    // Track mouse velocity and inject ripples into simulation
    const dx = ptr.x - lastPointer.current.x;
    const dy = ptr.y - lastPointer.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 0.002) {
      sim.addPointerMove(ptr.x, ptr.y, Math.min(2.2, speed * 18));
    }
    lastPointer.current = { x: ptr.x, y: ptr.y };

    const updated = sim.update();
    if (updated && tex) {
      tex.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            ...RippleShaderMaterial,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </mesh>
  );
}
