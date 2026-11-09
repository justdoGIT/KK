import { useRef, useEffect, useState } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useCardSpotlight } from "../../motion/card-spotlight.ts";

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

export function LusionShowcaseCard({
  item,
  isSelected,
  onSelect,
  rowIndex,
  interactive = true,
}: {
  item: GallerySystem;
  isSelected: boolean;
  onSelect: () => void;
  rowIndex: number;
  interactive?: boolean;
}) {
  const enhanced = useMotionMode() === "enhanced";
  const cardRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const sensorRef = useRef<HTMLDivElement>(null);
  // First grid row renders already-grown (it's the pair visible without
  // scrolling); every subsequent row starts small/hidden and grows to full
  // size as it scrolls into view, matching lusion.co/projects' card grid.
  const startsRevealed =
    !interactive || rowIndex === 0 || !enhanced;
  const [isRevealed, setIsRevealed] = useState(startsRevealed);

  useEffect(() => {
    if (isRevealed || !interactive || !enhanced) return;
    const el = sensorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "200px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isRevealed, interactive, enhanced]);

  useCardSpotlight(cardRef, spotlightRef, interactive);

  return (
    <article
      ref={cardRef}
      className={`system-showcase-card ${isSelected ? "card-selected" : ""} ${isRevealed || !interactive || !enhanced ? "" : "card-pending-reveal"}`}
      role={interactive ? "listitem" : undefined}
      onMouseEnter={interactive ? onSelect : undefined}
      onClick={onSelect}
    >
      <div ref={sensorRef} className="card-reveal-sensor" aria-hidden="true" />
      <div ref={spotlightRef} className="system-card-spotlight" aria-hidden="true" />
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
            {item.link.startsWith("http") ? "View source on GitHub" : "Email about this architecture"}{" "}
            <span aria-hidden="true">{item.link.startsWith("http") ? "↗" : "✉"}</span>
          </a>
        )}
      </div>
    </article>
  );
}
