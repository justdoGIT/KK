import { useEffect, useRef, type JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";

type CanvasAvailabilityProps = {
  onChange: (available: boolean) => void;
};

/**
 * Reports the first frame that rendered after a scene's Suspense boundary
 * resolved, then restores the caller's fallback if WebGL loses its context.
 * Place this inside the same Suspense boundary as the scene assets.
 */
export function CanvasAvailability({ onChange }: CanvasAvailabilityProps): JSX.Element | null {
  const canvas = useThree((state) => state.gl.domElement);
  const reported = useRef(false);
  const contextLost = useRef(false);

  useEffect(() => {
    const unavailable = (event: Event) => {
      event.preventDefault();
      contextLost.current = true;
      reported.current = false;
      onChange(false);
    };
    const restore = () => {
      contextLost.current = false;
      reported.current = false;
    };
    canvas.addEventListener("webglcontextlost", unavailable);
    canvas.addEventListener("webglcontextrestored", restore);
    return () => {
      canvas.removeEventListener("webglcontextlost", unavailable);
      canvas.removeEventListener("webglcontextrestored", restore);
    };
  }, [canvas, onChange]);

  useFrame(() => {
    if (contextLost.current || reported.current) return;
    reported.current = true;
    onChange(true);
  });

  return null;
}
