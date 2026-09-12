import {
  Component,
  lazy,
  Suspense,
  useState,
  type ReactNode,
} from "react";
import { useMotionMode } from "../motion/motion-mode.tsx";
import { checkWebGL } from "./useCapability.ts";

const SceneCanvas = lazy(() =>
  import("./SceneCanvas.tsx").then((m) => ({ default: m.SceneCanvas })),
);

function CSSArtifact() {
  return (
    <div className="css-artifact" aria-hidden="true">
      <div className="css-orb" />
    </div>
  );
}

type ErrorBoundaryProps = {
  children: ReactNode;
  onFail: () => void;
};

type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onFail();
  }

  render() {
    if (this.state.hasError) {
      return <CSSArtifact />;
    }
    return this.props.children;
  }
}

export function SceneEntry() {
  const mode = useMotionMode();
  const [webglSupported] = useState(() => checkWebGL());
  const [failed, setFailed] = useState(false);

  const canRender = mode === "enhanced" && webglSupported && !failed;

  if (!canRender) {
    return <CSSArtifact />;
  }

  return (
    <Suspense fallback={<CSSArtifact />}>
      <ErrorBoundary onFail={() => setFailed(true)}>
        <SceneCanvas />
      </ErrorBoundary>
    </Suspense>
  );
}
