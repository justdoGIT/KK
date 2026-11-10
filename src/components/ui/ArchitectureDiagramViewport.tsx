import { useId, type ReactNode } from "react";
import { useDiagramZoom } from "../../motion/use-diagram-zoom.ts";

export function ArchitectureDiagramViewport({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const { viewportRef, surfaceRef, labelRef, zoomIn, zoomOut, fit } = useDiagramZoom(width, height);
  const hintId = useId();
  return <>
    <div className="arch-zoom-controls" aria-label="Diagram zoom controls">
      <button type="button" onClick={zoomOut} aria-label="Zoom out diagram">−</button>
      <span ref={labelRef} className="arch-zoom-level" aria-label="Diagram zoom">100%</span>
      <button type="button" onClick={zoomIn} aria-label="Zoom in diagram">+</button>
      <button type="button" onClick={fit} className="arch-zoom-fit" aria-label="Fit full diagram">Fit</button>
    </div>
    <div ref={viewportRef} className="arch-diagram-viewport" tabIndex={0} aria-label="Pan and zoom architecture diagram" aria-describedby={hintId}>
      <div ref={surfaceRef} className="arch-diagram-canvas">{children}</div>
    </div>
    <p id={hintId} className="arch-zoom-hint">Scroll or pinch to zoom · Drag to pan</p>
  </>;
}
