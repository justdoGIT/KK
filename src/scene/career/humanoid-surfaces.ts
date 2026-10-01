import { Mesh, MeshPhysicalMaterial, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type ChibiPalette = {
  shell: MeshPhysicalMaterial;
  accent: MeshPhysicalMaterial;
  dark: MeshPhysicalMaterial;
  rubber: MeshPhysicalMaterial;
  visor: MeshPhysicalMaterial;
  silver: MeshPhysicalMaterial;
  cyan: MeshPhysicalMaterial;
  lens: MeshPhysicalMaterial;
  glow: MeshPhysicalMaterial;
};

/** Painted ceramic armor, anodized trim, and restrained instrument illumination. */
export function createChibiPalette(): ChibiPalette {
  return {
    shell: new MeshPhysicalMaterial({ color: "#fff4df", metalness: 0.08, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.24 }),
    accent: new MeshPhysicalMaterial({ color: "#ef922f", metalness: 0.22, roughness: 0.3, clearcoat: 0.45 }),
    dark: new MeshPhysicalMaterial({ color: "#192427", metalness: 0.24, roughness: 0.42 }),
    rubber: new MeshPhysicalMaterial({ color: "#0e171c", metalness: 0.02, roughness: 0.75 }),
    visor: new MeshPhysicalMaterial({ color: "#071217", metalness: 0.28, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12 }),
    silver: new MeshPhysicalMaterial({ color: "#c4dae0", metalness: 0.55, roughness: 0.3 }),
    cyan: new MeshPhysicalMaterial({ color: "#68d9de", emissive: "#1c8a98", emissiveIntensity: 0.22, metalness: 0.22, roughness: 0.28 }),
    lens: new MeshPhysicalMaterial({ color: "#14677b", emissive: "#0c536c", emissiveIntensity: 0.3, metalness: 0.4, roughness: 0.18, clearcoat: 1 }),
    glow: new MeshPhysicalMaterial({ color: "#70e6f2", emissive: "#27c9e5", emissiveIntensity: 0.85, metalness: 0.08, roughness: 0.22 }),
  };
}

export function part(geometry: BufferGeometry, material: MeshPhysicalMaterial): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function roundedBox(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 4, radius);
}
