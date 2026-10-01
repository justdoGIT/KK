import { LatheGeometry, Mesh, MeshPhysicalMaterial, Vector2, type BufferGeometry } from "three";

export type ChibiPalette = {
  shell: MeshPhysicalMaterial;
  accent: MeshPhysicalMaterial;
  dark: MeshPhysicalMaterial;
  rubber: MeshPhysicalMaterial;
  visor: MeshPhysicalMaterial;
  silver: MeshPhysicalMaterial;
  cyan: MeshPhysicalMaterial;
  glow: MeshPhysicalMaterial;
};

/**
 * Glossy cream ceramic, saturated anodized orange, black rubber joints, and
 * emissive cyan instruments bright enough to bloom, after the reference toy.
 */
export function createChibiPalette(): ChibiPalette {
  return {
    shell: new MeshPhysicalMaterial({ color: "#fbf3e6", metalness: 0.02, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.1 }),
    accent: new MeshPhysicalMaterial({ color: "#f0821e", metalness: 0.1, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.14 }),
    dark: new MeshPhysicalMaterial({ color: "#1b2229", metalness: 0.2, roughness: 0.36, clearcoat: 0.5 }),
    rubber: new MeshPhysicalMaterial({ color: "#101418", metalness: 0, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    visor: new MeshPhysicalMaterial({ color: "#04070b", metalness: 0.45, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04 }),
    silver: new MeshPhysicalMaterial({ color: "#d2dde3", metalness: 0.8, roughness: 0.22 }),
    cyan: new MeshPhysicalMaterial({ color: "#5fe3f5", emissive: "#13b5d6", emissiveIntensity: 0.9, metalness: 0.1, roughness: 0.25 }),
    glow: new MeshPhysicalMaterial({ color: "#b8f8ff", emissive: "#2fd8f5", emissiveIntensity: 2.6, metalness: 0, roughness: 0.2 }),
  };
}

export function part(geometry: BufferGeometry, material: MeshPhysicalMaterial): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Smooth solid of revolution about +Y from `[radius, y]` profile pairs (bottom to top). */
export function lathe(profile: readonly (readonly [number, number])[], segments = 48): LatheGeometry {
  return new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments);
}

/**
 * Wraps a flat piece (in the XY plane, extruded toward +Z) onto a sphere of
 * `radius` centred on the origin: x and y become arc lengths (longitude and
 * latitude) and z the distance out from the surface, so visor parts hug the
 * round helmet instead of floating off it at their edges.
 */
export function wrapOnSphere<T extends BufferGeometry>(geometry: T, radius: number): T {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const lon = position.getX(i) / radius;
    const lat = position.getY(i) / radius;
    const r = radius + position.getZ(i);
    position.setXYZ(i, r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
