import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  Vector3,
  type Material,
  type Mesh,
  type Object3D,
  type SkinnedMesh,
} from "three";

/** One rigid chunk of a model, geometry centred on `center` (model-root space). */
export type MorphPart = {
  geometry: BufferGeometry;
  material: Material;
  center: Vector3;
  radius: number;
};

export type BakedModel = { parts: MorphPart[]; bounds: Box3 };

type BakedMesh = { material: Material; positions: Float32Array; normals: Float32Array };

function bakeMeshes(root: Object3D, bounds: Box3): BakedMesh[] {
  root.updateWorldMatrix(true, true);
  // Parent space, so a factory can place the model (e.g. lift a standing robot) before baking.
  const toRoot = root.parent ? new Matrix4().copy(root.parent.matrixWorld).invert() : new Matrix4();
  const baked: BakedMesh[] = [];
  const v = new Vector3();
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    const indexed = mesh.geometry.index;
    const pos = mesh.geometry.getAttribute("position");
    const nor = mesh.geometry.getAttribute("normal");
    const count = indexed ? indexed.count : pos.count;
    const matrix = new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld);
    const normalMatrix = new Matrix3().getNormalMatrix(matrix);
    const skinned = (mesh as SkinnedMesh).isSkinnedMesh ? (mesh as SkinnedMesh) : null;
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const vertex = indexed ? indexed.getX(i) : i;
      if (skinned) skinned.getVertexPosition(vertex, v);
      else v.fromBufferAttribute(pos, vertex);
      v.applyMatrix4(matrix);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      bounds.expandByPoint(v);
      if (nor) {
        v.fromBufferAttribute(nor, vertex).applyMatrix3(normalMatrix).normalize();
        normals[i * 3] = v.x;
        normals[i * 3 + 1] = v.y;
        normals[i * 3 + 2] = v.z;
      }
    }
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    baked.push({ material, positions, normals });
  });
  return baked;
}

/**
 * Freezes a (possibly skinned, possibly articulated) model in its current pose
 * and cuts it into chunks: each mesh's triangles are binned on a `cells`³
 * grid over the model bounds, so even single-mesh models break into panels.
 * Every chunk gets its own material clone so it can flash independently.
 */
export function bakeModel(root: Object3D, cells = 4): BakedModel {
  const bounds = new Box3();
  const meshes = bakeMeshes(root, bounds);
  const size = bounds.getSize(new Vector3());
  const v = new Vector3();
  const parts: MorphPart[] = [];
  for (const { material, positions, normals } of meshes) {
    const bins = new Map<number, number[]>();
    for (let a = 0; a < positions.length; a += 9) {
      const cell = (axis: number, extent: number, min: number) =>
        Math.min(cells - 1, Math.floor((((positions[a + axis] + positions[a + axis + 3] + positions[a + axis + 6]) / 3 - min) / (extent || 1)) * cells));
      const bin = (cell(0, size.x, bounds.min.x) * cells + cell(1, size.y, bounds.min.y)) * cells + cell(2, size.z, bounds.min.z);
      const list = bins.get(bin) ?? [];
      list.push(a);
      bins.set(bin, list);
    }
    for (const starts of bins.values()) {
      const pos = new Float32Array(starts.length * 9);
      const nor = new Float32Array(starts.length * 9);
      starts.forEach((a, t) => {
        pos.set(positions.subarray(a, a + 9), t * 9);
        nor.set(normals.subarray(a, a + 9), t * 9);
      });
      const box = new Box3();
      for (let i = 0; i < pos.length; i += 3) box.expandByPoint(v.set(pos[i], pos[i + 1], pos[i + 2]));
      const center = box.getCenter(new Vector3());
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] -= center.x;
        pos[i + 1] -= center.y;
        pos[i + 2] -= center.z;
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
      geometry.setAttribute("normal", new Float32BufferAttribute(nor, 3));
      parts.push({ geometry, material: material.clone(), center, radius: box.getSize(v).length() / 2 });
    }
  }
  return { parts, bounds };
}

export function disposeBaked(baked: BakedModel): void {
  for (const part of baked.parts) {
    part.geometry.dispose();
    part.material.dispose();
  }
}
