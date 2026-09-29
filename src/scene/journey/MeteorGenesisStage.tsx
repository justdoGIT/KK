import { useRef, useMemo, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type MeteorGenesisStageProps = {
  active: boolean;
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Build a wide streak geometry: thin elongated billboard along velocity direction */
function buildStreakGeometry(length: number, width: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -width / 2, 0, 0,
     width / 2, 0, 0,
     width / 2, length, 0,
    -width / 2, length, 0,
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  return geo;
}

/** Create a glowing meteor streak texture procedurally */
function buildStreakTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
  grad.addColorStop(0.05, "rgba(255, 240, 200, 0.95)");
  grad.addColorStop(0.3, "rgba(255, 180, 60, 0.7)");
  grad.addColorStop(0.7, "rgba(255, 100, 20, 0.3)");
  grad.addColorStop(1, "rgba(255, 60, 0, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/** Desert sand ground plane texture */
function buildDesertTexture(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Base warm sandy gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#c4842a");
  bg.addColorStop(0.4, "#e09a35");
  bg.addColorStop(0.7, "#b8721e");
  bg.addColorStop(1, "#8a5010");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Dune ripples
  ctx.strokeStyle = "rgba(255,200,80,0.18)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 20; i++) {
    const y = pseudoRandom(i * 7 + 1) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(W * 0.3, y - 12, W * 0.7, y + 12, W, y + (pseudoRandom(i + 2) - 0.5) * 20);
    ctx.stroke();
  }

  // Dark shadow areas in troughs
  for (let i = 0; i < 12; i++) {
    const y = pseudoRandom(i * 3 + 5) * H;
    const grad2 = ctx.createLinearGradient(0, y, 0, y + 8);
    grad2.addColorStop(0, "rgba(60,30,0,0.35)");
    grad2.addColorStop(1, "rgba(60,30,0,0)");
    ctx.fillStyle = grad2;
    ctx.fillRect(0, y, W, 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 4;
  return tex;
}

/** Sky gradient texture: deep night purple/orange horizon */
function buildSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 4; canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0,    "#030408");
  grad.addColorStop(0.25, "#0a0c18");
  grad.addColorStop(0.55, "#1a0e08");
  grad.addColorStop(0.75, "#3d1a04");
  grad.addColorStop(0.88, "#8a3a08");
  grad.addColorStop(0.96, "#c46010");
  grad.addColorStop(1,    "#e07818");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

const METEOR_COUNT = 60;

type MeteorData = {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  len: number; width: number;
  speed: number;
};

export function MeteorGenesisStage({ active }: MeteorGenesisStageProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const meteorsRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const sandRef = useRef<THREE.Points>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  // Procedural textures — only built once, browser-only
  const [streakTex, desertTex, skyTex] = useMemo(() => [
    buildStreakTexture(),
    buildDesertTexture(),
    buildSkyTexture(),
  ], []);

  const streakGeo = useMemo(() => buildStreakGeometry(1, 0.04), []);

  // Meteor initial data — random across a wide upper area
  const meteors = useMemo<MeteorData[]>(() => {
    const list: MeteorData[] = [];
    for (let i = 0; i < METEOR_COUNT; i++) {
      const angle = -Math.PI * 0.35 - pseudoRandom(i * 7 + 1) * 0.3;
      const speed = 2.2 + pseudoRandom(i * 3 + 2) * 3.5;
      list.push({
        x: (pseudoRandom(i * 5 + 3) - 0.5) * 9,
        y: 2.5 + pseudoRandom(i * 4 + 4) * 5,
        z: (pseudoRandom(i * 6 + 5) - 0.5) * 4,
        vx: Math.cos(angle) * speed * 0.55,
        vy: Math.sin(angle) * speed,
        vz: (pseudoRandom(i * 2 + 6) - 0.5) * 0.4,
        len: 0.5 + pseudoRandom(i * 9 + 7) * 1.2,
        width: 0.018 + pseudoRandom(i * 8 + 8) * 0.025,
        speed,
      });
    }
    return list;
  }, []);

  // Live positions — mutated each frame
  const positions = useRef(meteors.map((m) => ({ x: m.x, y: m.y, z: m.z })));

  // Sand particles for impact zone
  const [sandPos, sandCols] = useMemo(() => {
    const N = 2200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const goldC = new THREE.Color("#e09a35");
    const cyanC = new THREE.Color("#38bdf8");
    for (let i = 0; i < N; i++) {
      const u = pseudoRandom(i * 3 + 10);
      const v = pseudoRandom(i * 3 + 11);
      const x = (u - 0.5) * 7;
      const z = (v - 0.5) * 5;
      const y = Math.sin(x * 1.4) * 0.18 + Math.cos(z * 1.1) * 0.14 - 1.05;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      const distC = Math.sqrt(x * x + z * z);
      const t = Math.max(0, 1 - distC / 2.2);
      col[i * 3] = goldC.r + (cyanC.r - goldC.r) * t;
      col[i * 3 + 1] = goldC.g + (cyanC.g - goldC.g) * t;
      col[i * 3 + 2] = goldC.b + (cyanC.b - goldC.b) * t;
    }
    return [pos, col];
  }, []);
  const starPos = useMemo(() => {
    const N = 600;
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      p[i * 3]     = (pseudoRandom(i * 7 + 20) - 0.5) * 20;
      p[i * 3 + 1] =  pseudoRandom(i * 5 + 21) * 7 + 0.5;
      p[i * 3 + 2] = -(pseudoRandom(i * 3 + 22) * 5 + 1);
    }
    return p;
  }, []);


  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? 1.0 : 0.001;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5.0,
    );
    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Update each meteor mesh transform
    for (let i = 0; i < METEOR_COUNT; i++) {
      const m = meteors[i];
      const p = positions.current[i];
      p.x += m.vx * delta;
      p.y += m.vy * delta;
      p.z += m.vz * delta;

      // Reset when below ground
      if (p.y < -1.1) {
        p.x = (pseudoRandom(i + time * 0.5) - 0.5) * 9;
        p.y = 3.5 + pseudoRandom(i * 2 + time * 0.3) * 4;
        p.z = (pseudoRandom(i * 3 + time * 0.2) - 0.5) * 4;
      }

      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.set(p.x, p.y, p.z);
        // Point geometry along velocity
        mesh.rotation.z = Math.atan2(m.vx, -m.vy);
      }
    }

    // Pulse glow ring
    if (glowRingRef.current) {
      const s = 1 + Math.sin(time * 2.5) * 0.08;
      glowRingRef.current.scale.set(s, s, 1);
      const mat = glowRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.45 + Math.sin(time * 3) * 0.2;
    }

    // Slowly drift sand particles
    if (sandRef.current) {
      sandRef.current.rotation.y = time * 0.025;
    }
  });

  return (
    <group ref={groupRef} visible={active}>

      {/* Sky backdrop plane */}
      <mesh position={[0, 2.5, -5]}>
        <planeGeometry args={[22, 14]} />
        <meshBasicMaterial map={skyTex} side={THREE.FrontSide} depthWrite={false} />
      </mesh>

      {/* Desert ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          map={desertTex}
          roughness={0.95}
          metalness={0.0}
          color="#c47820"
        />
      </mesh>

      {/* Horizon heat shimmer band */}
      <mesh position={[0, -0.15, -4.2]} rotation={[0.18, 0, 0]}>
        <planeGeometry args={[18, 0.8]} />
        <meshBasicMaterial
          color="#ff7a10"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Falling meteor streaks */}
      <group ref={meteorsRef}>
        {meteors.map((m, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) meshRefs.current[i] = el; }}
            geometry={streakGeo}
            position={[m.x, m.y, m.z]}
          >
            <meshBasicMaterial
              map={streakTex}
              transparent
              opacity={0.72 + pseudoRandom(i * 13) * 0.28}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Glowing impact point particle shower at ground */}
      <points ref={sandRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sandPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[sandCols, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Central plasma impact glow ring */}
      <group position={[0, -0.6, 0]}>
        <mesh ref={glowRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 1.6, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Crystallizing silicon die */}
        <mesh position={[0, 0.18, 0]} rotation={[0.3, 0.5, 0.1]}>
          <boxGeometry args={[1.1, 0.12, 1.1]} />
          <meshStandardMaterial
            color="#1e3a5f"
            roughness={0.25}
            metalness={0.85}
            wireframe={false}
          />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation={[0.3, 0.5, 0.1]}>
          <boxGeometry args={[1.12, 0.14, 1.12]} />
          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Star field background dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#ffffff" transparent opacity={0.6} depthWrite={false} />
      </points>
    </group>
  );
}
