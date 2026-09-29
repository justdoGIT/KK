import { useRef, useEffect } from "react";

export type GallerySystem = {
  id: string;
  tag: string;
  badge: string;
  title: string;
  silicon: string;
  description: string;
  techStack: string[];
  impact: string;
  kind: "tsdb" | "evcharger" | "health" | "zynq" | "video" | "fleet";
  link?: string;
};

function getTimestamp(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function LusionShowcaseCard({
  item,
  isSelected,
  onSelect,
}: {
  item: GallerySystem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Physics animation state stored in ref for zero-rerender 60fps RAF loop
  const physicsRef = useRef({
    currRotX: 0,
    currRotY: 0,
    currTransX: 0,
    currTransY: 0,
    currScale: 1,
    currTransZ: 0,
    currVibeX: 0,
    currVibeY: 0,
    currBlur: 0,
    targetRotX: 0,
    targetRotY: 0,
    targetTransX: 0,
    targetTransY: 0,
    targetScale: 1,
    targetTransZ: 0,
    currSpotX: 0,
    currSpotY: 0,
    targetSpotX: 0,
    targetSpotY: 0,
    currOpacity: 0,
    targetOpacity: 0,
    entryTime: 0,
    leaveTime: 0,
    rafId: 0,
    isHovered: false,
  });

  const updatePhysics = (now?: number) => {
    const p = physicsRef.current;
    const ease = 0.1;
    const currentNow = now ?? getTimestamp();

    // Entry micro-vibration pulse (~340ms damped high-frequency oscillation --
    // slightly longer than a single frame-snap so the haptic "arrival" reads
    // clearly instead of feeling instantaneous).
    if (p.isHovered && p.entryTime > 0) {
      const elapsed = currentNow - p.entryTime;
      if (elapsed < 340) {
        const decay = Math.exp(-elapsed * 0.012);
        const osc = Math.sin(elapsed * 0.12);
        p.currVibeX = osc * decay * 2.2;
        p.currVibeY = -osc * decay * 1.8;
      } else {
        p.currVibeX = 0;
        p.currVibeY = 0;
      }
    } else {
      p.currVibeX = 0;
      p.currVibeY = 0;
    }

    // Leave-settle pulse: a secondary vibration plus a brief motion-blur wash
    // as the card releases, decaying back to a sharp, unblurred rest state --
    // mirrors a camera settling after a fast pan rather than snapping still.
    let leaveBlur = 0;
    if (!p.isHovered && p.leaveTime > 0) {
      const elapsed = currentNow - p.leaveTime;
      const leaveDuration = 520;
      if (elapsed < leaveDuration) {
        const decay = Math.exp(-elapsed * 0.009);
        const osc = Math.sin(elapsed * 0.1);
        p.currVibeX += osc * decay * 1.6;
        p.currVibeY += -osc * decay * 1.3;
        leaveBlur = decay * 5.5;
      } else {
        p.leaveTime = 0;
      }
    }
    p.currBlur += (leaveBlur - p.currBlur) * 0.25;

    p.currRotX += (p.targetRotX - p.currRotX) * ease;
    p.currRotY += (p.targetRotY - p.currRotY) * ease;
    p.currTransX += (p.targetTransX - p.currTransX) * ease;
    p.currTransY += (p.targetTransY - p.currTransY) * ease;
    p.currScale += (p.targetScale - p.currScale) * ease;
    p.currTransZ += (p.targetTransZ - p.currTransZ) * ease;
    p.currSpotX += (p.targetSpotX - p.currSpotX) * 0.15;
    p.currSpotY += (p.targetSpotY - p.currSpotY) * 0.15;
    p.currOpacity += (p.targetOpacity - p.currOpacity) * 0.15;

    const deltaRot = Math.abs(p.targetRotX - p.currRotX) + Math.abs(p.targetRotY - p.currRotY);
    const deltaTrans = Math.abs(p.targetTransX - p.currTransX) + Math.abs(p.targetTransY - p.currTransY);
    const deltaOpacity = Math.abs(p.targetOpacity - p.currOpacity);
    const deltaVibe = Math.abs(p.currVibeX) + Math.abs(p.currVibeY);
    const isFullySettled =
      !p.isHovered &&
      deltaRot < 0.01 &&
      deltaTrans < 0.01 &&
      deltaOpacity < 0.005 &&
      deltaVibe < 0.02 &&
      p.currBlur < 0.05;

    if (cardRef.current) {
      if (isFullySettled) {
        // Drop the transform entirely at rest so the browser renders this
        // card's text through the normal CPU/subpixel path instead of a
        // GPU-composited "identity" transform layer, keeping it sharp.
        cardRef.current.style.transform = "none";
        cardRef.current.style.filter = "none";
      } else {
        const finalX = (p.currTransX + p.currVibeX).toFixed(2);
        const finalY = (p.currTransY + p.currVibeY).toFixed(2);
        cardRef.current.style.transform = `perspective(1000px) translate3d(${finalX}px, ${finalY}px, ${p.currTransZ.toFixed(2)}px) rotateX(${p.currRotX.toFixed(2)}deg) rotateY(${p.currRotY.toFixed(2)}deg) scale3d(${p.currScale.toFixed(3)}, ${p.currScale.toFixed(3)}, 1)`;
        cardRef.current.style.filter = p.currBlur > 0.05 ? `blur(${p.currBlur.toFixed(2)}px)` : "none";
      }
    }

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle 380px at ${p.currSpotX.toFixed(1)}px ${p.currSpotY.toFixed(1)}px, rgba(56, 189, 248, 0.25) 0%, rgba(129, 140, 248, 0.09) 40%, transparent 80%)`;
      spotlightRef.current.style.opacity = p.currOpacity.toFixed(3);
    }

    if (p.isHovered || p.leaveTime > 0 || !isFullySettled) {
      p.rafId = requestAnimationFrame(updatePhysics);
    } else {
      p.rafId = 0;
    }
  };

  const startLoop = () => {
    if (!physicsRef.current.rafId) {
      physicsRef.current.rafId = requestAnimationFrame(updatePhysics);
    }
  };

  const handleMouseEnter = () => {
    onSelect();
    const p = physicsRef.current;
    p.isHovered = true;
    p.entryTime = getTimestamp();
    p.leaveTime = 0;
    p.targetScale = 1.02;
    p.targetTransZ = 12;
    p.targetOpacity = 1;
    startLoop();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5; // -0.5 to 0.5
    const normY = y / rect.height - 0.5; // -0.5 to 0.5

    const p = physicsRef.current;
    // Eye-tracking pointer follow: subtle 4.5deg max tilt combined with 10px cursor translation
    p.targetRotX = -normY * 4.5;
    p.targetRotY = normX * 4.5;
    p.targetTransX = normX * 12;
    p.targetTransY = normY * 10;
    p.targetSpotX = x;
    p.targetSpotY = y;
    p.isHovered = true;
    p.targetOpacity = 1;
    startLoop();
  };

  const handleMouseLeave = () => {
    const p = physicsRef.current;
    p.isHovered = false;
    p.entryTime = 0;
    p.leaveTime = getTimestamp();
    p.targetRotX = 0;
    p.targetRotY = 0;
    p.targetTransX = 0;
    p.targetTransY = 0;
    p.targetScale = 1;
    p.targetTransZ = 0;
    p.targetOpacity = 0;
    startLoop();
  };

  useEffect(() => {
    const physics = physicsRef.current;
    return () => {
      if (physics.rafId) {
        cancelAnimationFrame(physics.rafId);
      }
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className={`system-showcase-card ${isSelected ? "card-selected" : ""}`}
      role="listitem"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      <div ref={spotlightRef} className="system-card-spotlight" />
      <div className="system-card-content">
        {/* Top Bar */}
        <div className="showcase-topbar">
          <span className="showcase-tag">{item.tag}</span>
          <span className="showcase-badge">{item.badge}</span>
        </div>

        {/* Title & Target Silicon */}
        <h3 className="showcase-title">{item.title}</h3>
        <div className="showcase-silicon-pill">
          <span className="silicon-dot" />
          <span>{item.silicon}</span>
        </div>

        {/* Narrative Description */}
        <p className="showcase-desc">{item.description}</p>

        {/* Tech Stack Chips */}
        <div className="showcase-chips-wrap">
          {item.techStack.map((tech) => (
            <span key={tech} className="showcase-chip">
              {tech}
            </span>
          ))}
        </div>

        {/* Impact Metric Bar */}
        <div className="showcase-impact-bar">
          <span className="impact-label">OUTCOME:</span>
          <span className="impact-text">{item.impact}</span>
        </div>

        {/* Action Link */}
        {item.link && (
          <a
            className="showcase-action-link"
            href={item.link}
            target={item.link.startsWith("http") ? "_blank" : undefined}
            rel={item.link.startsWith("http") ? "noreferrer" : undefined}
          >
            Discuss This Architecture <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
