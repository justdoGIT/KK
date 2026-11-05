import type { JSX } from "react";

/** A compact capture of the opening 3D frame, also used without WebGL. */
export function AstronautStandbyArtwork({ visible = true }: { visible?: boolean }): JSX.Element {
  return (
    <img
      className="aj-fallback-art"
      data-visible={visible}
      src={`${import.meta.env.BASE_URL}images/mission-standby.webp`}
      width={1284}
      height={896}
      alt="Astronaut floating above Earth's blue horizon in a field of stars"
      decoding="async"
    />
  );
}
