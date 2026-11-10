import { useEffect, useRef } from "react";
import { onFrame } from "./frame.ts";

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type ZoomRequest = { scale: number; from: Point; to: Point };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Move the SVG's camera, keeping its pointed-at coordinate stationary. */
export function useDiagramZoom(width: number, height: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const commands = useRef<{ zoom: (factor: number) => void; fit: () => void }>({ zoom: () => {}, fit: () => {} });

  useEffect(() => {
    const viewport = viewportRef.current;
    const surface = surfaceRef.current;
    const svg = surface?.querySelector("svg");
    if (!viewport || !surface || !svg) return;
    const base = (svg.getAttribute("data-diagram-viewbox") ?? svg.getAttribute("viewBox") ?? "0 0").split(/\s+/).map(Number);
    let size: Size = { width: 0, height: 0 };
    let scale = 1;
    let origin: Point = { x: base[0], y: base[1] };
    let dirty = true;
    let fitRequested = false;
    let pending: ZoomRequest | null = null;
    let pan: Point = { x: 0, y: 0 };
    let frame: { size: Size; scale: number; x: number; y: number } | null = null;
    const pointers = new Map<number, Point>();
    const local = (point: Point): Point => {
      const rect = viewport.getBoundingClientRect();
      return { x: point.x - rect.left - viewport.clientLeft, y: point.y - rect.top - viewport.clientTop };
    };
    const requestZoom = (factor: number, from: Point, to = from) => {
      pending = { scale: (pending?.scale ?? scale) * factor, from: pending?.from ?? from, to };
      dirty = true;
    };
    const fit = () => { fitRequested = true; pending = null; dirty = true; };
    commands.current = { zoom: factor => requestZoom(factor, { x: size.width / 2, y: size.height / 2 }), fit };
    const stopRead = onFrame("read", () => {
      if (!dirty) return;
      dirty = false;
      const nextSize = { width: viewport.clientWidth, height: viewport.clientHeight };
      if (!nextSize.width || !nextSize.height) return;
      const overview = Math.min((nextSize.width - 24) / width, (nextSize.height - 24) / height);
      const min = Math.max(.05, Math.min(1.2, overview));
      const initial = clamp(Math.max(1.2, overview), min, 1.5);
      const next = clamp(fitRequested ? overview : pending?.scale ?? (size.width ? scale : initial), min, 3);
      const from = pending?.from ?? { x: size.width / 2, y: size.height / 2 };
      const to = pending?.to ?? { x: nextSize.width / 2, y: nextSize.height / 2 };
      const x = origin.x + (from.x - pan.x) / scale - to.x / next;
      const y = origin.y + (from.y - pan.y) / scale - to.y / next;
      const reset = fitRequested || !size.width;
      frame = { size: nextSize, scale: next,
        x: reset ? base[0] + Math.min(0, (width - nextSize.width / next) / 2) : x,
        y: reset ? base[1] + Math.min(0, (height - nextSize.height / next) / 2) : y };
      // Dragging can reveal edges, but cannot lose the whole drawing.
      if ((pan.x || pan.y) && !pending) {
        frame.x = clamp(frame.x, base[0] - (nextSize.width - 48) / next, base[0] + width - 48 / next);
        frame.y = clamp(frame.y, base[1] - (nextSize.height - 48) / next, base[1] + height - 48 / next);
      }
      fitRequested = false; pending = null; pan = { x: 0, y: 0 };
    });
    const stopWrite = onFrame("write", () => {
      if (!frame) return;
      size = frame.size; scale = frame.scale;
      origin = { x: frame.x, y: frame.y };
      svg.setAttribute("viewBox", `${origin.x} ${origin.y} ${size.width / scale} ${size.height / scale}`);
      viewport.dataset.zoom = scale.toFixed(4);
      if (labelRef.current) labelRef.current.textContent = `${Math.round(scale * 100)}%`;
      frame = null;
    });
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && !event.ctrlKey) {
        pan.x -= event.deltaX * unit; pan.y -= event.deltaY * unit; dirty = true;
        return;
      }
      requestZoom(Math.exp(-clamp(event.deltaY * unit, -600, 600) * .0015), local({ x: event.clientX, y: event.clientY }));
    };
    const start = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    const move = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const before = [...pointers.values()];
      const current = { x: event.clientX, y: event.clientY };
      if (!viewport.hasPointerCapture(event.pointerId) && distance(previous, current) < 3 && pointers.size === 1) return;
      pointers.set(event.pointerId, current);
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
      viewport.dataset.dragging = "true";
      if (pointers.size === 2) {
        const after = [...pointers.values()];
        requestZoom(distance(after[0], after[1]) / Math.max(1, distance(before[0], before[1])),
          local(midpoint(before[0], before[1])), local(midpoint(after[0], after[1])));
      } else if (pointers.size === 1) {
        pan.x += current.x - previous.x; pan.y += current.y - previous.y;
        dirty = true;
      }
    };
    const end = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      if (!pointers.size) delete viewport.dataset.dragging;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") commands.current.zoom(1.2);
      else if (event.key === "-") commands.current.zoom(1 / 1.2);
      else if (event.key === "0") fit();
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        pan.x += event.key === "ArrowLeft" ? 60 : -60; dirty = true;
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        pan.y += event.key === "ArrowUp" ? 60 : -60; dirty = true;
      }
      else return;
      event.preventDefault(); event.stopPropagation();
    };
    const resize = new ResizeObserver(() => { dirty = true; });
    resize.observe(viewport);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("pointerdown", start);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
    viewport.addEventListener("keydown", key);
    return () => {
      stopRead(); stopWrite(); resize.disconnect();
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("pointerdown", start);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", end);
      viewport.removeEventListener("pointercancel", end);
      viewport.removeEventListener("keydown", key);
      for (const id of pointers.keys()) if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
      commands.current = { zoom: () => {}, fit: () => {} };
    };
  }, [width, height]);

  return { viewportRef, surfaceRef, labelRef,
    zoomIn: () => commands.current.zoom(1.2), zoomOut: () => commands.current.zoom(1 / 1.2), fit: () => commands.current.fit() };
}
