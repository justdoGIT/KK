import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Object3D, type InstancedMesh } from "three";

type Vector = [number, number, number];
export type InstanceTransform = { position: Vector; rotation?: Vector; scale?: Vector };

/** Repeated static parts share one geometry, material, and draw submission. */
export function StaticInstances({ transforms, children, name }: {
  transforms: readonly InstanceTransform[];
  children: ReactNode;
  name: string;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const part = new Object3D();
    transforms.forEach((transform, index) => {
      part.position.set(...transform.position);
      part.rotation.set(...(transform.rotation ?? [0, 0, 0]));
      part.scale.set(...(transform.scale ?? [1, 1, 1]));
      part.updateMatrix();
      target.setMatrixAt(index, part.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [transforms]);
  return <instancedMesh ref={mesh} name={name} args={[undefined, undefined, transforms.length]}>{children}</instancedMesh>;
}
