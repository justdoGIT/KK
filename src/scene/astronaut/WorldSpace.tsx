import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  PlaneGeometry,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  type Group,
  type Mesh,
  type Points,
} from "three";
import { fit, phaseRatio } from "../../components/ui/astronaut/journey-timeline.ts";
import type { JourneyClockRef } from "./journey-clock.ts";

// Opening beats inside the masked window: star field, Earth horizon seen
// through the small card (it tilts away as the card opens, like Lusion's
// GoalTunnelsBackground), and the iridescent halo behind the title.

const NOISE = /* glsl */ `
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`;

const earthVertex = /* glsl */ `
  varying vec3 vLocal; varying vec3 vNormalW; varying vec3 vViewW;
  void main() {
    vLocal = normal;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const earthFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vLocal; varying vec3 vNormalW; varying vec3 vViewW;
  ${NOISE}
  void main() {
    vec3 n = normalize(vLocal);
    float land = smoothstep(0.5, 0.56, fbm(n * 3.2));
    vec3 ocean = mix(vec3(0.01, 0.07, 0.26), vec3(0.04, 0.22, 0.55), fbm(n * 9.0));
    vec3 ground = mix(vec3(0.13, 0.28, 0.11), vec3(0.46, 0.37, 0.2), fbm(n * 6.0 + 3.0));
    vec3 color = mix(ocean, ground, land);
    float clouds = smoothstep(0.55, 0.78, fbm(n * 5.0 + vec3(uTime * 0.01, 0.0, 0.0)));
    color = mix(color, vec3(0.96), clouds * 0.85);
    float light = clamp(dot(vNormalW, normalize(vec3(0.35, 0.9, 0.45))), 0.0, 1.0);
    color *= 0.2 + light * 1.15;
    float rim = pow(1.0 - max(dot(vNormalW, vViewW), 0.0), 3.0);
    color += vec3(0.25, 0.5, 1.0) * rim * 1.8;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  varying vec3 vLocal; varying vec3 vNormalW; varying vec3 vViewW;
  void main() {
    float glow = pow(max(0.0, 0.75 - dot(vNormalW, vViewW)), 3.0);
    gl_FragColor = vec4(vec3(0.3, 0.55, 1.0) * glow * 3.0, glow);
  }
`;

const haloFragment = /* glsl */ `
  uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float band = exp(-pow((r - 0.36) / 0.045, 2.0)) + 0.35 * exp(-pow((r - 0.36) / 0.12, 2.0));
    float angle = atan(p.y, p.x) / 6.2831853 + 0.5;
    vec3 color = mix(vec3(1.0), hue(angle + uTime * 0.03), 0.55);
    gl_FragColor = vec4(color * band, band * uOpacity);
  }
`;

const planeVertex = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

function buildStars(): BufferGeometry {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12345.678;
    const c = Math.sin(i * 39.425) * 24634.634;
    positions[i * 3] = ((a - Math.floor(a)) - 0.5) * 60;
    positions[i * 3 + 1] = ((b - Math.floor(b)) - 0.5) * 36;
    positions[i * 3 + 2] = -8 - (c - Math.floor(c)) * 30;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  return geometry;
}

export function WorldSpace({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const earthGroup = useRef<Group>(null);
  const starsRef = useRef<Points>(null);
  const haloRef = useRef<Mesh>(null);
  const kit = useMemo(() => {
    const earthGeometry = new SphereGeometry(30, 128, 96);
    const atmosphereGeometry = new SphereGeometry(31.2, 96, 64);
    const earth = new ShaderMaterial({ vertexShader: earthVertex, fragmentShader: earthFragment, uniforms: { uTime: { value: 0 } } });
    const atmosphere = new ShaderMaterial({
      vertexShader: earthVertex,
      fragmentShader: atmosphereFragment,
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const halo = new ShaderMaterial({
      vertexShader: planeVertex,
      fragmentShader: haloFragment,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
    });
    const stars = new PointsMaterial({ color: new Color("#dfe8ff"), size: 0.06, sizeAttenuation: true, transparent: true });
    return {
      earthGeometry,
      atmosphereGeometry,
      haloGeometry: new PlaneGeometry(6, 6),
      earth,
      atmosphere,
      halo,
      stars,
      starGeometry: buildStars(),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(kit).forEach((item) => item.dispose());
    },
    [kit],
  );

  useFrame((state) => {
    const { t } = clock.current;
    const time = state.clock.elapsedTime;
    const frameIn = phaseRatio(t, "frameIn");
    const title = phaseRatio(t, "title");

    const earth = earthGroup.current;
    if (earth) {
      earth.visible = frameIn < 1;
      // Lusion: y = -(10*(1-show) + 2.5 + 30*frameIn), rotation.x = fit(frameIn, 0, .5, 0, -1)
      earth.position.y = -31.4 - 14 * frameIn * frameIn;
      earth.rotation.x = fit(frameIn, 0, 0.5, 0, -0.5);
      earth.rotation.y = time * 0.01;
      const surface = earth.children[0] as Mesh | undefined;
      if (surface) (surface.material as ShaderMaterial).uniforms.uTime.value = time;
    }

    const stars = starsRef.current;
    if (stars) {
      stars.visible = t < 0.6;
      stars.position.z = title * 6;
      (stars.material as PointsMaterial).opacity = 1 - phaseRatio(t, "blackTunnel") * 0.7;
    }

    const halo = haloRef.current;
    if (halo) {
      const strength = Math.sin(Math.min(1, title * 1.15) * Math.PI);
      halo.visible = strength > 0.01;
      const haloUniforms = (halo.material as ShaderMaterial).uniforms;
      haloUniforms.uOpacity.value = strength * 0.75;
      haloUniforms.uTime.value = time;
      halo.position.y = -0.1 - title * 0.2;
      halo.scale.setScalar(0.8 + title * 0.5);
    }
  });

  return (
    <>
      <points ref={starsRef} geometry={kit.starGeometry} material={kit.stars} />
      <group ref={earthGroup} position={[0, -31.4, -4]}>
        <mesh geometry={kit.earthGeometry} material={kit.earth} />
        <mesh geometry={kit.atmosphereGeometry} material={kit.atmosphere} />
      </group>
      <mesh ref={haloRef} position={[0, -0.1, -1.4]} geometry={kit.haloGeometry} material={kit.halo} />
    </>
  );
}
