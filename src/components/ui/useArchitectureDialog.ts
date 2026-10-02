import { useEffect, useRef } from "react";
import { getLenis, stopCruise } from "../../motion/smooth-scroll.ts";

/** Keep dialog focus and the page scroll lock stable across parent renders. */
export function useArchitectureDialog(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;
    const returnFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    const lenis = getLenis();
    const wasStopped = lenis?.isStopped;
    stopCruise();
    lenis?.stop();
    document.body.style.overflow = "hidden";
    container.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = container.querySelectorAll<HTMLElement | SVGElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      const atContainer = active === container || !container.contains(active);
      if (!first || !last) {
        event.preventDefault();
        container.focus();
      } else if (event.shiftKey && (atContainer || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (atContainer || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      if (!wasStopped) lenis?.start();
      if (returnFocus instanceof HTMLElement || returnFocus instanceof SVGElement) {
        returnFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return containerRef;
}
