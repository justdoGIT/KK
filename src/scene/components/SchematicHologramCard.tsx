import { useEffect, useMemo, type JSX } from "react";
import * as THREE from "three";
import { createSchematicTexture } from "../textures.ts";

type SchematicHologramCardProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export function SchematicHologramCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SchematicHologramCardProps): JSX.Element {
  const schematicTexture = useMemo(() => createSchematicTexture(), []);
  // Built once: `<edgesGeometry args={[new PlaneGeometry(...)]} />` rebuilt
  // (and leaked) the geometry on every render of this card's tree.
  const border = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.8, 1.8)), []);
  useEffect(
    () => () => {
      schematicTexture.dispose();
      border.dispose();
    },
    [schematicTexture, border],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Translucent Glowing Hologram Plane */}
      <mesh>
        <planeGeometry args={[1.8, 1.8]} />
        {/* Additive basic material instead of a transmissive physical one:
            transmission forces three.js to render the scene behind this
            plane into a separate transmission buffer every frame (an extra
            scene pass). Additive blending gets the same "glowing glass"
            look — dark texture regions contribute nothing, bright regions
            glow cyan — without the extra pass. */}
        <meshBasicMaterial
          map={schematicTexture}
          color="#38bdf8"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cybernetic Glowing Card Border */}
      <lineSegments geometry={border}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
