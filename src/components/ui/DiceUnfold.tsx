import { useEffect, useRef, type JSX } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useScrollFrame } from "../../motion/scroll-frame.ts";

type DiceFace = {
  id: string;
  label: string;
  count: number;
  color: string;
};

const faces: DiceFace[] = [
  { id: "langs", label: "Languages", count: 8, color: "#38bdf8" },
  { id: "platforms", label: "Platforms", count: 5, color: "#93a4ff" },
  { id: "protocols", label: "Protocols", count: 12, color: "#02bdf8" },
  { id: "tools", label: "Tools", count: 18, color: "#fbbf24" },
  { id: "concepts", label: "Concepts", count: 25, color: "#ec4899" },
  { id: "patterns", label: "Patterns", count: 11, color: "#10b981" },
];

// Global state for sharing animation progress with child components
const sceneState = { progress: 0 };

function DiceFace({ face, index }: { face: DiceFace; index: number }): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = 2;

  // Cube positions for each face (compact)
  const cubePositions: [number, number, number][] = [
    [0, 0, size],      // front
    [0, 0, -size],     // back
    [size, 0, 0],      // right
    [-size, 0, 0],     // left
    [0, size, 0],      // top
    [0, -size, 0],     // bottom
  ];

  // Cross/unfold positions (net pattern)
  const unfoldPositions: [number, number, number][] = [
    [0, 0, 0],         // center (front)
    [0, 8, 0],         // top
    [8, 0, 0],         // right
    [-8, 0, 0],        // left
    [0, -8, 0],        // bottom
    [16, 0, 0],        // far right (back)
  ];

  const startPos = cubePositions[index];
  const endPos = unfoldPositions[index];

  useFrame(() => {
    if (!meshRef.current) return;
    const t = sceneState.progress;
    const pos: [number, number, number] = [
      startPos[0] + (endPos[0] - startPos[0]) * t,
      startPos[1] + (endPos[1] - startPos[1]) * t,
      startPos[2] + (endPos[2] - startPos[2]) * t,
    ];
    meshRef.current.position.set(pos[0], pos[1], pos[2]);

    // Slight rotation during unfold
    if (index % 2 === 0) {
      meshRef.current.rotation.y = t * Math.PI * 0.2;
    } else {
      meshRef.current.rotation.x = t * Math.PI * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={startPos}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color={face.color}
        metalness={0.8}
        roughness={0.2}
        emissive={face.color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function DiceScene(): JSX.Element {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const { size } = useThree();

  useEffect(() => {
    if (cameraRef.current) {
      const scale = 20;
      cameraRef.current.left = -size.width / scale;
      cameraRef.current.right = size.width / scale;
      cameraRef.current.top = size.height / scale;
      cameraRef.current.bottom = -size.height / scale;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [size]);

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        position={[0, 0, 10]}
        makeDefault
        zoom={1}
      />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      {faces.map((face, idx) => (
        <DiceFace key={face.id} face={face} index={idx} />
      ))}
    </>
  );
}

export function DiceUnfold(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const containerRef = useRef<HTMLDivElement>(null);

  useScrollFrame(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const startTrigger = viewportHeight * 0.8;
    const endTrigger = -viewportHeight * 0.2;

    const progress = Math.max(
      0,
      Math.min(1, (startTrigger - rect.top) / (startTrigger - endTrigger))
    );

    sceneState.progress = progress;

    if (el) {
      el.style.setProperty("--unfold", progress.toFixed(3));
    }
  });

  if (!enhanced) {
    return (
      <div
        ref={containerRef}
        className="dice-unfold-static"
        aria-label="Experience summary statistics"
      >
        <div className="dice-static-grid">
          {faces.map((face) => (
            <div key={face.id} className="dice-static-card">
              <div className="dice-stat-count">{face.count}</div>
              <div className="dice-stat-label">{face.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="dice-unfold-container"
      aria-label="Experience summary statistics (3D)"
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
        }}
        className="dice-unfold-canvas"
      >
        <DiceScene />
      </Canvas>
    </div>
  );
}
