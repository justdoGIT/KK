import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { onFrame } from "../motion/frame.ts";

/** Place inside the scene's Suspense boundary, after its assets and lights. */
export function SchedulerFrames({ active, visible }: { active: boolean; visible?: RefObject<boolean> }): null {
  const { advance, gl, scene, camera, size, viewport } = useThree();
  const [prepared, setPrepared] = useState(false);
  const elapsed = useRef(0);
  const bufferSize = useRef({ width: size.width, height: size.height, dpr: viewport.dpr });

  useLayoutEffect(() => {
    const previous = bufferSize.current;
    const resized = previous.width !== size.width || previous.height !== size.height || previous.dpr !== viewport.dpr;
    bufferSize.current = { width: size.width, height: size.height, dpr: viewport.dpr };
    // Resizing a WebGL buffer clears its last frame. Redraw before the browser
    // paints the new size, including adaptive-resolution changes during a story.
    if (resized && prepared && active && (!visible || visible.current)) advance(elapsed.current);
  }, [size.width, size.height, viewport.dpr, prepared, active, visible, advance]);

  useEffect(() => {
    let alive = true;
    let generation = 0;
    const prepare = () => {
      const current = ++generation;
      // A synchronous compile of every hidden stage would front-load a large
      // stall on devices without this extension. Keep their normal draw path.
      if (!gl.extensions.has("KHR_parallel_shader_compile")) {
        setPrepared(true);
        return;
      }
      // KHR_parallel_shader_compile lets scrolling continue while the driver
      // compiles programs. Diagnostic checks remain enabled on the renderer.
      void gl.compileAsync(scene, camera).then(() => {
        if (alive && current === generation) setPrepared(true);
      }, error => {
        if (!alive || current !== generation || gl.getContext().isContextLost()) return;
        console.error("Scene shader preparation failed", error);
        setPrepared(true); // The renderer can report the original shader error.
      });
    };
    const lost = () => { generation++; setPrepared(false); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    gl.domElement.addEventListener("webglcontextrestored", prepare);
    prepare();
    return () => {
      alive = false;
      gl.domElement.removeEventListener("webglcontextlost", lost);
      gl.domElement.removeEventListener("webglcontextrestored", prepare);
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (!active || !prepared) return;
    let first = true;
    return onFrame("render", (_time, delta) => {
      // The DOM observer can hide a canvas before its separate React/R3F root
      // commits new props. Stop expensive draws during that handoff too.
      if (visible && !visible.current) { first = true; return; }
      // Paused scenes retain their pose. A return to the viewport must not
      // inject several seconds into a spring or jump an idle animation.
      elapsed.current += first ? 0 : delta;
      first = false;
      advance(elapsed.current);
    });
  }, [active, prepared, advance, visible]);
  return null;
}
