import { useEffect, useRef, type JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";

type CanvasAvailabilityProps = {
  onChange: (available: boolean) => void;
  ready?: boolean;
};

/**
 * Reports the first frame that rendered after a scene's Suspense boundary
 * resolved, then restores the caller's fallback if WebGL loses its context.
 * Place this inside the same Suspense boundary as the scene assets.
 */
export function CanvasAvailability({ onChange, ready = true }: CanvasAvailabilityProps): JSX.Element | null {
  const canvas = useThree((state) => state.gl.domElement);
  const reported = useRef(false);
  const contextLost = useRef(false);
  const frames = useRef(0);

  useEffect(() => {
    const unavailable = (event: Event) => {
      event.preventDefault();
      contextLost.current = true;
      reported.current = false;
      frames.current = 0;
      onChange(false);
    };
    const restore = () => {
      contextLost.current = false;
      reported.current = false;
      frames.current = 0;
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
    if (!ready) { frames.current = 0; return; }
    // useFrame runs before drawing. Wait until a previous frame has actually
    // rendered the resolved assets, including their GPU texture uploads.
    if (++frames.current < 2) return;
    reported.current = true;
    onChange(true);
  });

  return null;
}
