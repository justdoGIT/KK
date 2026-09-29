import { describe, expect, it } from "vitest";
import {
  BufferGeometry,
  Group,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { ASTRONAUT_HEIGHT, BONES, buildAstronautRig } from "../scene/astronaut/astronaut-rig.ts";

/** Scale of the NASA GLB's `astronaut1` node, which the rig bakes into geometry. */
const NODE_SCALE = 37.13135;
const QUANT = 32767;
const CORNERS = 8;

/**
 * Reproduces the shipped NASA GLB's shape: a normalized `Int16` position
 * attribute inside an interleaved buffer view (stride 4), rotated Z-up and
 * scaled up by its node. Baking a matrix into such an attribute wraps at
 * ±32767 unless the rig widens it to float first.
 */
function nasaLikeScene(): Group {
  const data = new Int16Array(CORNERS * 4);
  let i = 0;
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        data[i * 4] = x * QUANT;
        data[i * 4 + 1] = y * QUANT;
        data[i * 4 + 2] = z * QUANT;
        i += 1;
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new InterleavedBufferAttribute(new InterleavedBuffer(data, 4), 3, 0, true),
  );

  const node = new Group();
  node.name = "astronaut1";
  node.scale.setScalar(NODE_SCALE);
  node.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
  node.add(new Mesh(geometry, new MeshStandardMaterial()));

  const scene = new Group();
  scene.add(node);
  return scene;
}

describe("astronaut rig bake", () => {
  it("normalizes quantized interleaved geometry to the rig height", () => {
    const [part] = buildAstronautRig(nasaLikeScene()).parts;
    part.geometry.computeBoundingBox();
    const box = part.geometry.boundingBox;
    const height = box ? box.max.y - box.min.y : Number.NaN;

    expect(Number.isFinite(height)).toBe(true);
    // Without widening, the bake collapses to ASTRONAUT_HEIGHT / NODE_SCALE.
    expect(height).toBeGreaterThan(ASTRONAUT_HEIGHT * 0.9);
    expect(height).toBeCloseTo(ASTRONAUT_HEIGHT, 3);
  });

  it("skins every vertex of the widened geometry onto two bones", () => {
    const [part] = buildAstronautRig(nasaLikeScene()).parts;
    const index = part.geometry.getAttribute("skinIndex");
    const weight = part.geometry.getAttribute("skinWeight");

    expect(index.count).toBe(CORNERS);
    expect(weight.count).toBe(CORNERS);
    for (let i = 0; i < CORNERS; i += 1) {
      expect(index.getX(i)).toBeGreaterThanOrEqual(0);
      expect(index.getX(i)).toBeLessThan(BONES.length);
      expect(index.getY(i)).toBeLessThan(BONES.length);
      expect(weight.getX(i) + weight.getY(i)).toBeCloseTo(1, 5);
    }
  });
});
