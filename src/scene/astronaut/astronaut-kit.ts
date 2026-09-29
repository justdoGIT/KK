import {
  AdditiveBlending,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Shared geometry + materials for every astronaut instance on one canvas.
// Geometries are created once per canvas and passed to meshes with
// dispose={null}; the owning scene disposes the kit on unmount.

function capsule(radius: number, length: number): CapsuleGeometry {
  return new CapsuleGeometry(radius, length, 6, 14);
}

export type AstronautPart =
  | "pelvis" | "torso" | "chestBox" | "zip" | "strap" | "port" | "backpack"
  | "neckRing" | "helmet" | "visor" | "visorRim" | "led" | "ear"
  | "shoulderCap" | "upperArm" | "forearm" | "cuff" | "palm" | "finger" | "thumb"
  | "thigh" | "shin" | "kneePad" | "boot";

export type AstronautGeometry = Record<AstronautPart, BufferGeometry>;

export function createAstronautGeometry(): AstronautGeometry {
  return {
    pelvis: new RoundedBoxGeometry(0.4, 0.22, 0.28, 3, 0.08),
    torso: new RoundedBoxGeometry(0.54, 0.62, 0.36, 4, 0.14),
    chestBox: new RoundedBoxGeometry(0.28, 0.17, 0.07, 2, 0.025),
    zip: new RoundedBoxGeometry(0.03, 0.46, 0.012, 1, 0.005),
    strap: new RoundedBoxGeometry(0.05, 0.3, 0.02, 1, 0.01),
    port: new CylinderGeometry(0.055, 0.055, 0.03, 20),
    backpack: new RoundedBoxGeometry(0.46, 0.58, 0.22, 3, 0.06),
    neckRing: new TorusGeometry(0.14, 0.035, 10, 28),
    helmet: new SphereGeometry(0.24, 36, 28),
    visor: new SphereGeometry(0.205, 36, 28),
    visorRim: new TorusGeometry(0.19, 0.016, 8, 36),
    led: new PlaneGeometry(0.26, 0.12),
    ear: new CylinderGeometry(0.065, 0.065, 0.05, 20),
    shoulderCap: new SphereGeometry(0.1, 20, 16),
    upperArm: capsule(0.078, 0.22),
    forearm: capsule(0.07, 0.2),
    cuff: new TorusGeometry(0.07, 0.022, 8, 20),
    palm: new RoundedBoxGeometry(0.1, 0.11, 0.05, 2, 0.02),
    finger: capsule(0.016, 0.05),
    thumb: capsule(0.018, 0.045),
    thigh: capsule(0.1, 0.26),
    shin: capsule(0.09, 0.24),
    kneePad: new CylinderGeometry(0.06, 0.06, 0.03, 20),
    boot: new RoundedBoxGeometry(0.15, 0.13, 0.27, 2, 0.04),
  };
}

export type AstronautMaterials = {
  suit: MeshStandardMaterial;
  trim: MeshStandardMaterial;
  dark: MeshStandardMaterial;
  visor: MeshPhysicalMaterial;
  led: MeshBasicMaterial;
};

export function createAstronautMaterials(ghost = false): AstronautMaterials {
  const ghostProps = ghost
    ? { transparent: true, opacity: 0.3, depthWrite: false }
    : {};
  return {
    suit: new MeshStandardMaterial({
      color: ghost ? "#b9c3ff" : "#eef1f6",
      roughness: 0.55,
      metalness: 0,
      ...ghostProps,
    }),
    trim: new MeshStandardMaterial({
      color: ghost ? "#8f9be6" : "#c3cad6",
      roughness: 0.6,
      metalness: 0.05,
      ...ghostProps,
    }),
    dark: new MeshStandardMaterial({
      color: "#15181f",
      roughness: 0.35,
      metalness: 0.2,
      ...ghostProps,
    }),
    visor: new MeshPhysicalMaterial({
      color: "#020306",
      metalness: 0.65,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.2,
      ...ghostProps,
    }),
    led: new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: DoubleSide,
    }),
  };
}

export function disposeKit(geometry: Record<string, BufferGeometry>, materials: Record<string, Material>): void {
  Object.values(geometry).forEach((g) => g.dispose());
  Object.values(materials).forEach((m) => m.dispose());
}
