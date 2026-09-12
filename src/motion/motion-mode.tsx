import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type MotionMode = "native" | "enhanced";

const MotionModeContext = createContext<MotionMode>("native");

function detectMode(): MotionMode {
  if (typeof window === "undefined") return "native";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "native"
    : "enhanced";
}

export function useMotionModeValue(): MotionMode {
  const [mode, setMode] = useState<MotionMode>(detectMode);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setMode(e.matches ? "native" : "enhanced");
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

export function useMotionMode(): MotionMode {
  return useContext(MotionModeContext);
}
