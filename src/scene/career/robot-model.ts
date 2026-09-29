import { useState } from "react";
import { useGLTF } from "@react-three/drei";
import type { AnimationClip, Object3D } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { modelUrl, type ModelKey } from "../robots/model-assets.ts";

export type ModelInstance = { scene: Object3D; animations: AnimationClip[] };

/** Loads a repository GLB (meshopt) and returns a private, shadow-casting clone. */
export function useModelInstance(key: ModelKey): ModelInstance {
  const gltf = useGLTF(modelUrl(key), false, true);
  const [instance] = useState<ModelInstance>(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((child) => {
      if ("isMesh" in child && child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return { scene, animations: gltf.animations };
  });
  return instance;
}

export function preloadModels(keys: readonly ModelKey[]): void {
  for (const key of keys) useGLTF.preload(modelUrl(key), false, true);
}
