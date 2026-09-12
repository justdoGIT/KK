import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionMode } from "./motion-mode.tsx";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const mode = useMotionMode();
  const visible = mode === "native" || inView;

  useEffect(() => {
    if (mode === "native") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
