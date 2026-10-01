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

/**
 * The life-support backpack reaches past the shoulders behind the back plane
 * (z < -5); it rides the torso, otherwise raised arms drag its corners out
 * into stretched flaps.
 */
function region(x: number, y: number, z: number): BoneName[] {
  const arm = y > 8 && z > -5;
  if (arm && x > 12.5) return ARM_L;
  if (arm && x < -12.5) return ARM_R;
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
    const candidates = region(p.x, p.y, p.z)
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

/** Helmet visor material name in the source GLB; the suit shell is `astnt1_1`. */
const VISOR_MATERIAL = "astnt1_2";

/**
 * Mirrored visor glass. The source texture paints a bare head, which reads as a
 * bald figure inside the helmet shell, so the visor gets its own material: dark,
 * near-mirror, and picking up the scene environment as a real visor would.
 */
function visorMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: "#131f3a",
    metalness: 0.96,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 3,
    iridescence: 0.45,
    iridescenceIOR: 2,
  });
}

/**
 * Suit support points: for every bone, the vertices it dominates that reach
 * furthest along each sampled direction. Each keeps its two skin bones and
 * weights with its bind position local to each bone (bones bind unrotated at
 * their joints), so a pose places it exactly as the GPU skins it. Deck
 * contact rests on these instead of guessing limb thickness.
 */
export type AstronautHull = {
  /** Dominant bone index per point. */
  bones: Uint8Array;
  /** Two skin bone indices per point. */
  pairs: Uint8Array;
  /** Two skin weights per point. */
  weights: Float32Array;
  /** Bind position local to each skin bone: 6 floats per point. */
  local: Float32Array;
};

export type AstronautRigData = {
  parts: { geometry: BufferGeometry; material: MeshPhysicalMaterial }[];
  hull: AstronautHull;
};

/** Directions sampled per bone (Fibonacci sphere): ~0.01 rig-unit support error on limbs. */
const HULL_DIRECTIONS = 48;

function buildHull(geometries: readonly BufferGeometry[]): AstronautHull {
  const directions: number[] = [];
  for (let i = 0; i < HULL_DIRECTIONS; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / HULL_DIRECTIONS;
    const radius = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    directions.push(Math.cos(phi) * radius, y, Math.sin(phi) * radius);
  }
  const slots = BONES.length * HULL_DIRECTIONS;
  const score = new Float32Array(slots).fill(-Infinity);
  const best = new Float32Array(slots * 7);
  for (const geometry of geometries) {
    const position = geometry.getAttribute("position");
    const index = geometry.getAttribute("skinIndex");
    const weight = geometry.getAttribute("skinWeight");
    for (let i = 0; i < position.count; i += 1) {
      const bone = weight.getX(i) >= weight.getY(i) ? index.getX(i) : index.getY(i);
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      for (let d = 0; d < HULL_DIRECTIONS; d += 1) {
        const slot = bone * HULL_DIRECTIONS + d;
        const s = x * directions[d * 3] + y * directions[d * 3 + 1] + z * directions[d * 3 + 2];
        if (s <= score[slot]) continue;
        score[slot] = s;
        best.set([x, y, z, index.getX(i), index.getY(i), weight.getX(i), weight.getY(i)], slot * 7);
      }
    }
  }
  const unit = ASTRONAUT_HEIGHT / MESH_HEIGHT;
  const bones: number[] = [];
  const pairs: number[] = [];
  const weights: number[] = [];
  const local: number[] = [];
  for (let bone = 0; bone < BONES.length; bone += 1) {
    const seen = new Set<string>();
    for (let d = 0; d < HULL_DIRECTIONS; d += 1) {
      const slot = bone * HULL_DIRECTIONS + d;
      if (score[slot] === -Infinity) continue;
      const [x, y, z, b0, b1, w0, w1] = best.subarray(slot * 7, slot * 7 + 7);
      const key = `${x},${y},${z}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bones.push(bone);
      pairs.push(b0, b1);
      weights.push(w0, w1);
      for (const skinBone of [b0, b1]) {
        const at = JOINTS[BONES[skinBone]].at;
        local.push(x - at[0] * unit, y - at[1] * unit, z - at[2] * unit);
      }
    }
  }
  return {
    bones: Uint8Array.from(bones),
    pairs: Uint8Array.from(pairs),
    weights: Float32Array.from(weights),
    local: Float32Array.from(local),
  };
}

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
    const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const material = source.name === VISOR_MATERIAL ? visorMaterial() : suitMaterial(source);
    parts.push({ geometry, material });
  });
  return { parts, hull: buildHull(parts.map((part) => part.geometry)) };
}

export type AstronautInstance = { root: Group; bones: Record<BoneName, Bone> };

/** A posable astronaut: own skeleton, shared skinned geometry. */
export function instantiateAstronaut(data: Pick<AstronautRigData, "parts">, override?: Material): AstronautInstance {
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
