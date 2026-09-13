import { useState, type CSSProperties, type PointerEvent } from "react";

type InteractiveVisualProps = {
  label: string;
  variant: "board" | "fleet" | "harness" | "career";
};

export function InteractiveVisual({ label, variant }: InteractiveVisualProps) {
  const [active, setActive] = useState(false);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  return (
    <div
      className={`interactive-visual interactive-visual-${variant} ${active ? "interactive-visual-active" : ""}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onPointerMove={handlePointerMove}
      style={{ "--pointer-x": `${pointer.x}%`, "--pointer-y": `${pointer.y}%` } as CSSProperties}
      role="img"
      aria-label={label}
    >
      <div className="visual-surface" aria-hidden="true">
        <span className="visual-surface-grid" />
        <span className="visual-surface-core" />
        <span className="visual-surface-line visual-surface-line-one" />
        <span className="visual-surface-line visual-surface-line-two" />
        <span className="visual-surface-line visual-surface-line-three" />
        {Array.from({ length: 8 }, (_, index) => (
          <span className="visual-surface-particle" key={index} style={{ "--particle-index": index } as CSSProperties} />
        ))}
        <span className="visual-splash" />
      </div>
      <span className="interactive-visual-label">{active ? "Pointer signal detected" : label}</span>
    </div>
  );
}
