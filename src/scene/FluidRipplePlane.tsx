import { useRef, useEffect, type JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RippleCanvas } from "./RippleCanvas.ts";

const RippleShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uRippleTexture: { value: null as THREE.CanvasTexture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerActive: { value: 1.0 },
    uDistortionStrength: { value: 0.055 },
    uChromaticAberration: { value: 0.024 },
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
    uniform vec2 uPointer;
    uniform float uPointerActive;
    uniform float uDistortionStrength;
    uniform float uChromaticAberration;
    varying vec2 vUv;

    void main() {
      // 1. Sample dynamic velocity ripple map
      vec4 rippleColor = texture2D(uRippleTexture, vUv);
      vec2 canvasDisp = (rippleColor.rg - 0.5) * 2.0;

      // 2. Compute continuous procedural fluid standing wave around cursor
      vec2 aspectUv = vUv;
      aspectUv.x *= (uResolution.x / max(1.0, uResolution.y));
      vec2 aspectPtr = uPointer * 0.5 + 0.5;
      aspectPtr.x *= (uResolution.x / max(1.0, uResolution.y));

      float distToCursor = length(aspectUv - aspectPtr);
      
      // Continuous harmonic breathing ripple centered on cursor (never finishes)
      float continuousWave = 0.0;
      if (uPointerActive > 0.1) {
        float wavePhase = distToCursor * 28.0 - uTime * 4.2;
        float waveDecay = exp(-distToCursor * 3.2);
        continuousWave = sin(wavePhase) * waveDecay * 0.42;
      }

      vec2 normalFromCursor = (distToCursor > 0.0001) ? normalize(aspectUv - aspectPtr) : vec2(0.0);
      vec2 continuousDisp = normalFromCursor * continuousWave;

      // Combine dynamic movement ripples and continuous breathing ripples
      vec2 totalDisplacement = canvasDisp + continuousDisp;
      float intensity = length(totalDisplacement);

      if (intensity < 0.004) {
        discard;
      }

      // Chromatic dispersion offsets along the wave gradient
      vec2 dispOffset = totalDisplacement * uDistortionStrength;

      // Liquid reflection & iridescent color fringe at wave crests
      vec3 iridescence = vec3(
        0.5 + 0.5 * cos(uTime * 2.2 + intensity * 6.28 + 0.0),
        0.5 + 0.5 * cos(uTime * 2.2 + intensity * 6.28 + 2.0),
        0.5 + 0.5 * cos(uTime * 2.2 + intensity * 6.28 + 4.0)
      );

      // Specular caustic rim highlight on ripple crests
      float crest = smoothstep(0.04, 0.55, intensity) * 0.65;
      vec3 crestGlow = mix(vec3(0.25, 0.75, 1.0), iridescence, 0.45) * crest;

      // Soft water tint
      vec4 finalColor = vec4(crestGlow, min(0.65, intensity * 0.55));
      gl_FragColor = finalColor;
    }
  `,
};

// Continuous breathing pulses stop once the pointer has been still this long,
// letting the sim (and its texture uploads) go fully idle.
const IDLE_AFTER_MS = 1200;

export function FluidRipplePlane(): JSX.Element {
  const { size, gl } = useThree();
  const simRef = useRef<RippleCanvas | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const mousePointer = useRef({ x: 0, y: 0, active: false });
  const lastMoveTime = useRef(0);

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
      // Map through the canvas's own rect, not the window: the canvas may
      // not fill the viewport exactly (letterboxing, nested layouts).
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mousePointer.current = { x: nx, y: ny, active: true };
      lastMoveTime.current = performance.now();
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      sim.dispose();
      textureRef.current?.dispose();
      simRef.current = null;
      textureRef.current = null;
    };
  }, [gl]);

  useFrame((state) => {
    const sim = simRef.current;
    const tex = textureRef.current;
    if (!sim) return;

    const time = state.clock.getElapsedTime();
    const recentlyActive = performance.now() - lastMoveTime.current < IDLE_AFTER_MS;
    const ptr = mousePointer.current.active ? mousePointer.current : state.pointer;

    // Track mouse velocity and inject ripples into simulation
    const dx = ptr.x - lastPointer.current.x;
    const dy = ptr.y - lastPointer.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 0.002) {
      sim.addPointerMove(ptr.x, ptr.y, Math.min(2.4, speed * 20));
    }

    // Continuous pulse so ripple never finishes while hovering — but only
    // while the pointer has moved recently; otherwise the sim goes idle
    // instead of pulsing and re-uploading its texture forever.
    if (recentlyActive) {
      sim.addContinuousPulse(ptr.x, ptr.y, 0.65);
    }

    lastPointer.current = { x: ptr.x, y: ptr.y };

    const updated = sim.update();
    if (updated && tex) {
      tex.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
      materialRef.current.uniforms.uPointer.value.set(ptr.x, ptr.y);
      materialRef.current.uniforms.uPointerActive.value = 1.0;
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
