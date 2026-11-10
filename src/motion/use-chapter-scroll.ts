import { useEffect, type RefObject } from "react";
import { scrollToY } from "./smooth-scroll.ts";

/** A phone's text pane advances the same scroll clock as its pinned film. */
export function useChapterScroll(pane: RefObject<HTMLElement | null>, enabled: boolean, speed = 1): void {
  useEffect(() => {
    const element = pane.current;
    if (!element || !enabled) return;
    let pointer: { id: number; x: number; y: number } | null = null;
    const advance = (amount: number) => scrollToY(window.scrollY + amount * speed, { immediate: true });
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      advance(event.deltaY * unit);
    };
    const end = () => {
      if (pointer && element.hasPointerCapture(pointer.id)) element.releasePointerCapture(pointer.id);
      pointer = null;
    };
    const start = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (!event.isPrimary) { end(); return; }
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const delta = pointer.y - event.clientY;
      const sideways = Math.abs(pointer.x - event.clientX);
      if (!element.hasPointerCapture(event.pointerId) && Math.max(sideways, Math.abs(delta)) < 3) return;
      const horizontal = sideways > Math.abs(delta);
      pointer = { id: pointer.id, x: event.clientX, y: event.clientY };
      if (horizontal) return;
      // Capture only on a drag, preserving taps on disclosure summaries.
      // The initial text node may disappear when the chapter changes.
      if (!element.hasPointerCapture(event.pointerId)) element.setPointerCapture(event.pointerId);
      event.preventDefault();
      advance(delta);
    };
    const finish = (event: PointerEvent) => { if (pointer?.id === event.pointerId) end(); };
    const key = (event: KeyboardEvent) => {
      if (event.target !== element) return;
      const amount = event.key === "ArrowDown" ? 60 : event.key === "ArrowUp" ? -60
        : event.key === "PageDown" ? innerHeight * .6 : event.key === "PageUp" ? -innerHeight * .6 : 0;
      if (!amount) return;
      event.preventDefault();
      advance(amount);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("pointerdown", start);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", finish);
    element.addEventListener("keydown", key);
    return () => {
      element.removeEventListener("wheel", wheel);
      end();
      element.removeEventListener("pointerdown", start);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", finish);
      element.removeEventListener("pointercancel", finish);
      element.removeEventListener("keydown", key);
    };
  }, [pane, enabled, speed]);
}
