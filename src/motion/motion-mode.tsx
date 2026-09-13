import { useEffect, useState, type ReactNode } from "react";
import { MotionModeContext } from "./motion-context.ts";
import type { MotionMode } from "./motion-types.ts";

function detectMode(): MotionMode {
  if (typeof window === "undefined") return "native";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "native"
    : "enhanced";
}

function useMotionModeValue(): MotionMode {
  const [mode, setMode] = useState<MotionMode>(detectMode);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => {
      setMode(event.matches ? "native" : "enhanced");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return mode;
}

export function MotionModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const mode = useMotionModeValue();
  return (
    <MotionModeContext.Provider value={mode}>
      {children}
    </MotionModeContext.Provider>
  );
}
