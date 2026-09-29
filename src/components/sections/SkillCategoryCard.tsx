import { useRef, useEffect, type JSX } from "react";
import { type SkillCategory } from "../../content/skills.ts";
import { CategoryIllustration } from "../ui/CategoryIllustrations.tsx";

function getTimestamp(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function SkillCategoryCard({ category }: { category: SkillCategory }): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const physicsRef = useRef({
    currRotX: 0,
    currRotY: 0,
    currTransX: 0,
    currTransY: 0,
    currScale: 1,
    currVibeX: 0,
    currVibeY: 0,
    currBlur: 0,
    targetRotX: 0,
    targetRotY: 0,
    targetTransX: 0,
    targetTransY: 0,
    targetScale: 1,
    currSpotX: 0,
    currSpotY: 0,
    targetSpotX: 0,
    targetSpotY: 0,
    currSpotOpacity: 0,
    targetSpotOpacity: 0,
    entryTime: 0,
    leaveTime: 0,
    rafId: 0,
    isHovered: false,
  });

  const updatePhysics = (now?: number) => {
    const p = physicsRef.current;
    const ease = 0.12;
    const currentNow = now ?? getTimestamp();

    if (p.isHovered && p.entryTime > 0) {
      const elapsed = currentNow - p.entryTime;
      if (elapsed < 320) {
        const decay = Math.exp(-elapsed * 0.012);
        const osc = Math.sin(elapsed * 0.14);
        p.currVibeX = osc * decay * 2.0;
        p.currVibeY = -osc * decay * 1.5;
      } else {
        p.currVibeX = 0;
        p.currVibeY = 0;
      }
    } else {
      p.currVibeX = 0;
      p.currVibeY = 0;
    }

    let leaveBlur = 0;
    if (!p.isHovered && p.leaveTime > 0) {
      const elapsed = currentNow - p.leaveTime;
      if (elapsed < 480) {
        const decay = Math.exp(-elapsed * 0.009);
        p.currVibeX += Math.sin(elapsed * 0.1) * decay * 1.5;
        leaveBlur = decay * 4.5;
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
    p.currSpotX += (p.targetSpotX - p.currSpotX) * 0.18;
    p.currSpotY += (p.targetSpotY - p.currSpotY) * 0.18;
    p.currSpotOpacity += (p.targetSpotOpacity - p.currSpotOpacity) * 0.18;

    const deltaRot = Math.abs(p.targetRotX - p.currRotX) + Math.abs(p.targetRotY - p.currRotY);
    const deltaTrans = Math.abs(p.targetTransX - p.currTransX) + Math.abs(p.targetTransY - p.currTransY);
    const deltaSpot = Math.abs(p.targetSpotOpacity - p.currSpotOpacity);
    const isFullySettled =
      !p.isHovered &&
      deltaRot < 0.01 &&
      deltaTrans < 0.01 &&
      deltaSpot < 0.005 &&
      Math.abs(p.currVibeX) < 0.02 &&
      p.currBlur < 0.05;

    if (cardRef.current) {
      if (isFullySettled) {
        cardRef.current.style.transform = "none";
        cardRef.current.style.filter = "none";
      } else {
        const finalX = (p.currTransX + p.currVibeX).toFixed(2);
        const finalY = (p.currTransY + p.currVibeY).toFixed(2);
        cardRef.current.style.transform = `perspective(1000px) translate3d(${finalX}px, ${finalY}px, 0px) rotateX(${p.currRotX.toFixed(2)}deg) rotateY(${p.currRotY.toFixed(2)}deg) scale3d(${p.currScale.toFixed(3)}, ${p.currScale.toFixed(3)}, 1)`;
        cardRef.current.style.filter = p.currBlur > 0.05 ? `blur(${p.currBlur.toFixed(2)}px)` : "none";
      }
    }

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle 280px at ${p.currSpotX.toFixed(1)}px ${p.currSpotY.toFixed(1)}px, rgba(56, 189, 248, 0.22) 0%, rgba(129, 140, 248, 0.06) 50%, transparent 80%)`;
      spotlightRef.current.style.opacity = p.currSpotOpacity.toFixed(3);
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
    const p = physicsRef.current;
    p.isHovered = true;
    p.entryTime = getTimestamp();
    p.leaveTime = 0;
    p.targetScale = 1.02;
    p.targetSpotOpacity = 1;
    startLoop();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;

    const p = physicsRef.current;
    p.targetRotX = -normY * 4.0;
    p.targetRotY = normX * 4.0;
    p.targetTransX = normX * 8;
    p.targetTransY = normY * 6;
    p.targetSpotX = x;
    p.targetSpotY = y;
    p.isHovered = true;
    p.targetSpotOpacity = 1;
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
    p.targetSpotOpacity = 0;
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
    <div
      ref={cardRef}
      className="skill-category-card"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={spotlightRef} className="skill-card-spotlight" />

      <div className="skill-cat-header">
        <span className="skill-cat-prompt">❯</span>
        <h3 className="skill-cat-title">{category.label}</h3>
      </div>

      <div className="skill-cat-illustration-wrap">
        <CategoryIllustration categoryId={category.id} />
      </div>

      <div className="skill-chips-wrap">
        {category.skills.map((skill) => (
          <span key={skill} className="skill-badge-chip">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
