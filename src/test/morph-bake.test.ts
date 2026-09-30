import { describe, expect, it } from "vitest";
import { Bone, BufferGeometry, Float32BufferAttribute, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute } from "three";
import { bakeModel, disposeBaked } from "../scene/career/transform/bake.ts";

describe("morph geometry baking", () => {
  it("bakes a posed skin in parent space before its first rendered frame", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    geometry.setAttribute("skinIndex", new Uint16BufferAttribute(new Uint16Array(12), 4));
    geometry.setAttribute("skinWeight", new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
    const material = new MeshStandardMaterial();
    const mesh = new SkinnedMesh(geometry, material);
    const bone = new Bone();
    mesh.add(bone);
    mesh.bind(new Skeleton([bone]));
    const root = new Group();
    root.add(mesh);
    const parent = new Group();
    parent.position.set(7, 8, 9);
    parent.add(root);
    root.scale.setScalar(2);
    root.rotation.y = Math.PI / 2;
    bone.position.y = 0.5;

    const baked = bakeModel(root, 1);
    expect(baked.bounds.min.x).toBeCloseTo(0);
    expect(baked.bounds.max.x).toBeCloseTo(0);
    expect(baked.bounds.min.y).toBeCloseTo(1);
    expect(baked.bounds.max.y).toBeCloseTo(3);
    expect(baked.bounds.min.z).toBeCloseTo(-2);
    expect(baked.bounds.max.z).toBeCloseTo(0);
    disposeBaked(baked);
    geometry.dispose();
    material.dispose();
    mesh.skeleton.dispose();
  });
});
