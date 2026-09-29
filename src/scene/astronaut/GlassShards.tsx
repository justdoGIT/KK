import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DoubleSide, ShaderMaterial, Vector2, Vector4, type Mesh } from "three";
import { phaseRatio, screenRect } from "../../components/ui/astronaut/journey-timeline.ts";
import { stageRectToWorld, type JourneyClockRef } from "./journey-clock.ts";

// Screen glass that shatters when the astronaut pushes through. Like Lusion's
// GoalTunnelGlass, the pane is sized to exactly cover the DOM screen rect; all
// shards live in one geometry and a vertex shader scrubs their flight from the
// break ratio, so scrolling back up reassembles the glass.

const COLS = 13;
const ROWS = 8;

function buildShardGeometry(): BufferGeometry {
  const jitter = (i: number, j: number, axis: number) => {
    const edge = i === 0 || j === 0 || i === COLS || j === ROWS;
    const s = Math.sin(i * 12.9898 + j * 78.233 + axis * 37.719) * 43758.5453;
    return edge ? 0 : (s - Math.floor(s) - 0.5) * 0.7;
  };
  const point = (i: number, j: number): [number, number] => [
    (i + jitter(i, j, 0)) / COLS,
    (j + jitter(i, j, 1)) / ROWS,
  ];
  const positions: number[] = [];
  const centroids: number[] = [];
  const randoms: number[] = [];
  const barys: number[] = [];
  const pushTri = (a: [number, number], b: [number, number], c: [number, number], seed: number) => {
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const r = [0.13, 0.57, 0.91, 0.33].map((k) => {
      const s = Math.sin(seed * (k * 91.7 + 3.1)) * 15731.743;
      return s - Math.floor(s);
    });
    [a, b, c].forEach((v, idx) => {
      positions.push(v[0] - cx, v[1] - cy, 0);
      centroids.push(cx, cy);
      randoms.push(r[0], r[1], r[2], r[3]);
      barys.push(idx === 0 ? 1 : 0, idx === 1 ? 1 : 0, idx === 2 ? 1 : 0);
    });
  };
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const p00 = point(i, j);
      const p10 = point(i + 1, j);
      const p01 = point(i, j + 1);
      const p11 = point(i + 1, j + 1);
      const seed = j * COLS + i + 1;
      pushTri(p00, p10, p11, seed);
      pushTri(p00, p11, p01, seed + 0.5);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("aCentroid", new BufferAttribute(new Float32Array(centroids), 2));
  geometry.setAttribute("aRand", new BufferAttribute(new Float32Array(randoms), 4));
  geometry.setAttribute("aBary", new BufferAttribute(new Float32Array(barys), 3));
  return geometry;
}

const vertexShader = /* glsl */ `
  attribute vec2 aCentroid;
  attribute vec4 aRand;
  attribute vec3 aBary;
  uniform vec4 uRect;      // center x, center y, width, height (world units)
  uniform vec2 uImpact;    // impact point in 0..1 rect space
  uniform float uBreak;
  uniform float uFade;
  varying vec3 vNormal;
  varying vec3 vBary;
  varying float vLife;

  vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    vec3 center = vec3(uRect.x + (aCentroid.x - 0.5) * uRect.z, uRect.y + (aCentroid.y - 0.5) * uRect.w, 0.0);
    vec3 local = vec3(position.x * uRect.z, position.y * uRect.w, 0.0);
    vec2 away = aCentroid - uImpact;
    float dist = length(away * vec2(uRect.z / uRect.w, 1.0));
    float life = clamp(uBreak * 1.7 - dist * 0.8, 0.0, 1.0);
    vec2 dir = normalize(away + vec2(0.0001));
    vec3 velocity = vec3(dir * (0.9 + aRand.x * 1.8), 1.4 + aRand.y * 3.2);
    vec3 world = center + velocity * life * 1.7 + vec3(0.0, -2.4, 0.0) * life * life;
    vec3 axis = normalize(aRand.xyz - 0.5 + vec3(0.001));
    float spin = life * (2.5 + aRand.w * 9.0);
    float scale = (1.0 - uFade) * (1.0 - life * 0.25);
    world += rotateAxis(local, axis, spin) * scale;
    vNormal = normalize(normalMatrix * rotateAxis(vec3(0.0, 0.0, 1.0), axis, spin));
    vBary = aBary;
    vLife = life;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vBary;
  varying float vLife;

  void main() {
    float facing = abs(normalize(vNormal).z);
    float fresnel = pow(1.0 - facing, 2.0);
    float edge = 1.0 - smoothstep(0.0, 0.06, min(min(vBary.x, vBary.y), vBary.z));
    float glint = pow(max(0.0, dot(normalize(vNormal), normalize(vec3(0.4, 0.6, 0.7)))), 24.0);
    vec3 tint = mix(vec3(0.36, 0.46, 1.0), vec3(0.72, 0.86, 1.0), fresnel);
    vec3 color = tint * (0.35 + fresnel) + vec3(0.9, 0.95, 1.0) * (edge * 0.8 + glint * 1.4);
    float alpha = (0.16 + fresnel * 0.5 + edge * 0.55 + glint) * uOpacity;
    alpha *= mix(1.0, 0.85, vLife);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function GlassShards({ clock }: { clock: JourneyClockRef }): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const geometry = useMemo(() => buildShardGeometry(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uRect: { value: new Vector4(0, 0, 1, 1) },
          uImpact: { value: new Vector2(0.5, 0.56) },
          uBreak: { value: 0 },
          uFade: { value: 0 },
          uOpacity: { value: 0 },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { t, width, height } = clock.current;
    const shatter = phaseRatio(t, "frameBreak");
    const drop = phaseRatio(t, "drop");
    const visible = shatter > 0 && drop < 1;
    mesh.visible = visible;
    if (!visible) return;
    const rect = stageRectToWorld(screenRect(width, height), width, height, camera);
    const u = (mesh.material as ShaderMaterial).uniforms;
    u.uRect.value.set(rect.cx, rect.cy, rect.width, rect.height);
    u.uBreak.value = shatter;
    u.uFade.value = Math.max(0, (drop - 0.55) / 0.45);
    u.uOpacity.value = Math.min(1, shatter * 6);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
