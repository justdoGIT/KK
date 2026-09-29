import {
  Bone,
  Box3,
  BufferAttribute,
  Group,
  MeshPhysicalMaterial,
  Skeleton,
  SkinnedMesh,
  Vector3,
  type BufferGeometry,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";

/**
 * Runtime auto-rig for the NASA EMU astronaut (a static T-pose mesh): bakes
 * the node transforms into the geometry, places a humanoid skeleton at the
 * suit's joints, and skins every vertex to its two nearest bone segments
 * inside an anatomical region (arm / leg / head / torso) so limbs bend
 * without tearing into the torso.
 */

export const BONES = [
  "hips", "spine", "chest", "neck", "head",
  "armL", "forearmL", "handL", "armR", "forearmR", "handR",
  "thighL", "shinL", "footL", "thighR", "shinR", "footR",
] as const;

export type BoneName = (typeof BONES)[number];

/** Target height of the rigged astronaut in world units. */
export const ASTRONAUT_HEIGHT = 1.8;

type JointSpec = { parent: BoneName | null; at: readonly [number, number, number]; tip: readonly [number, number, number] };

/**
 * Joint positions measured on the NASA mesh (units of its 74.26-tall bind
 * pose, origin at the bounding-box centre; +X = astronaut's left, +Z = front).
 */
const MESH_HEIGHT = 74.26;
const JOINTS: Record<BoneName, JointSpec> = {
  hips: { parent: null, at: [0, -4, 0], tip: [0, 4, 0] },
  spine: { parent: "hips", at: [0, 4, 0], tip: [0, 12, 0] },
  chest: { parent: "spine", at: [0, 12, 0], tip: [0, 23, 0] },
  neck: { parent: "chest", at: [0, 23, 0], tip: [0, 27, 0] },
  head: { parent: "neck", at: [0, 27, 0], tip: [0, 37, 0] },
  armL: { parent: "chest", at: [11, 17.5, -1], tip: [21, 17, -1] },
  forearmL: { parent: "armL", at: [21, 17, -1], tip: [29.5, 15, 0] },
  handL: { parent: "forearmL", at: [29.5, 15, 0], tip: [34.5, 14, 0] },
  armR: { parent: "chest", at: [-11, 17.5, -1], tip: [-21, 17, -1] },
  forearmR: { parent: "armR", at: [-21, 17, -1], tip: [-29.5, 15, 0] },
  handR: { parent: "forearmR", at: [-29.5, 15, 0], tip: [-34.5, 14, 0] },
  thighL: { parent: "hips", at: [6.2, -6, 0], tip: [6.4, -21, 1] },
  shinL: { parent: "thighL", at: [6.4, -21, 1], tip: [6.5, -33, 0] },
  footL: { parent: "shinL", at: [6.5, -33, 0], tip: [6.5, -36, 9] },
  thighR: { parent: "hips", at: [-6.2, -6, 0], tip: [-6.4, -21, 1] },
  shinR: { parent: "thighR", at: [-6.4, -21, 1], tip: [-6.5, -33, 0] },
  footR: { parent: "shinR", at: [-6.5, -33, 0], tip: [-6.5, -36, 9] },
};

const ARM_L: BoneName[] = ["chest", "armL", "forearmL", "handL"];
const ARM_R: BoneName[] = ["chest", "armR", "forearmR", "handR"];
const LEG_L: BoneName[] = ["hips", "thighL", "shinL", "footL"];
const LEG_R: BoneName[] = ["hips", "thighR", "shinR", "footR"];
const HEAD: BoneName[] = ["chest", "neck", "head"];
const TORSO: BoneName[] = ["hips", "spine", "chest", "neck"];

function region(x: number, y: number): BoneName[] {
  if (y > 8 && x > 12.5) return ARM_L;
  if (y > 8 && x < -12.5) return ARM_R;
  if (y > 23) return HEAD;
  if (y < -5) return x >= 0 ? LEG_L : LEG_R;
  return TORSO;
}

function segmentDistance(p: Vector3, a: readonly number[], b: readonly number[]): number {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const abz = b[2] - a[2];
  const t = Math.max(0, Math.min(1, ((p.x - a[0]) * abx + (p.y - a[1]) * aby + (p.z - a[2]) * abz) / (abx * abx + aby * aby + abz * abz)));
  return Math.hypot(p.x - a[0] - abx * t, p.y - a[1] - aby * t, p.z - a[2] - abz * t);
}

function skin(geometry: BufferGeometry, scale: number): void {
  const pos = geometry.getAttribute("position");
  const indices = new Uint16Array(pos.count * 4);
  const weights = new Float32Array(pos.count * 4);
  const p = new Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    p.fromBufferAttribute(pos, i).divideScalar(scale);
    const candidates = region(p.x, p.y)
      .map((name) => ({ bone: BONES.indexOf(name), d: segmentDistance(p, JOINTS[name].at, JOINTS[name].tip) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    const w = candidates.map(({ d }) => 1 / (d ** 4 + 0.5));
    const sum = w.reduce((s, v) => s + v, 0);
    candidates.forEach(({ bone }, k) => {
      indices[i * 4 + k] = bone;
      weights[i * 4 + k] = w[k] / sum;
    });
  }
  geometry.setAttribute("skinIndex", new BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new BufferAttribute(weights, 4));
}

/** Physical suit material keeping the NASA textures; fabric sheen plus a light clearcoat. */
function suitMaterial(source: Material): MeshPhysicalMaterial {
  const standard = source as MeshStandardMaterial;
  return new MeshPhysicalMaterial({
    map: standard.map ?? null,
    normalMap: standard.normalMap ?? null,
    color: standard.color?.clone(),
    roughness: 0.62,
    metalness: 0.04,
    sheen: 0.9,
    sheenRoughness: 0.45,
    sheenColor: "#dbeafe",
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    envMapIntensity: 1.1,
  });
}

export type AstronautRigData = { parts: { geometry: BufferGeometry; material: MeshPhysicalMaterial }[] };

/**
 * Widens integer-quantized attributes to plain float before a matrix bake. The
 * NASA GLB stores positions, normals, and UVs as normalized `Int16`s inside
 * interleaved buffer views, and `InterleavedBufferAttribute.applyMatrix4`
 * writes the transformed values straight back into the shared integer buffer,
 * where they wrap at ±32767 and collapse the mesh into noise.
 */
function widenQuantized(geometry: BufferGeometry): BufferGeometry {
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const source = "data" in attribute ? attribute.data.array : attribute.array;
    if (source instanceof Float32Array) continue;
    const { count, itemSize } = attribute;
    const widened = new Float32Array(count * itemSize);
    for (let i = 0; i < count; i += 1) {
      for (let c = 0; c < itemSize; c += 1) {
        widened[i * itemSize + c] = attribute.getComponent(i, c);
      }
    }
    geometry.setAttribute(name, new BufferAttribute(widened, itemSize));
  }
  return geometry;
}

/** Bakes and skins the loaded NASA scene once; instances share geometry. */
export function buildAstronautRig(scene: Object3D): AstronautRigData {
  scene.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(scene);
  const center = box.getCenter(new Vector3());
  const scale = (box.max.y - box.min.y) / MESH_HEIGHT;
  const parts: AstronautRigData["parts"] = [];
  scene.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const geometry = widenQuantized(mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld);
    geometry.translate(-center.x, -center.y, -center.z);
    skin(geometry, scale);
    geometry.scale(ASTRONAUT_HEIGHT / (MESH_HEIGHT * scale), ASTRONAUT_HEIGHT / (MESH_HEIGHT * scale), ASTRONAUT_HEIGHT / (MESH_HEIGHT * scale));
    const material = suitMaterial(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
    parts.push({ geometry, material });
  });
  return { parts };
}

export type AstronautInstance = { root: Group; bones: Record<BoneName, Bone> };

/** A posable astronaut: own skeleton, shared skinned geometry. */
export function instantiateAstronaut(data: AstronautRigData, override?: Material): AstronautInstance {
  const unit = ASTRONAUT_HEIGHT / MESH_HEIGHT;
  const bones = {} as Record<BoneName, Bone>;
  for (const name of BONES) {
    const bone = new Bone();
    bone.name = name;
    const spec = JOINTS[name];
    const parent = spec.parent ? JOINTS[spec.parent].at : [0, 0, 0];
    bone.position.set((spec.at[0] - parent[0]) * unit, (spec.at[1] - parent[1]) * unit, (spec.at[2] - parent[2]) * unit);
    bones[name] = bone;
    if (spec.parent) bones[spec.parent].add(bone);
  }
  const root = new Group();
  root.add(bones.hips);
  const skeleton = new Skeleton(BONES.map((name) => bones[name]));
  root.updateWorldMatrix(true, true);
  for (const part of data.parts) {
    const mesh = new SkinnedMesh(part.geometry, override ?? part.material);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    root.add(mesh);
    mesh.bind(skeleton);
  }
  return { root, bones };
}
