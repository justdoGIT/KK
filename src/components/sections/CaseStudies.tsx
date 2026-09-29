import { useState, useEffect, useRef, type JSX } from "react";
import {
  getApprovedCaseStudies,
  type DiagramNode,
  type CaseStudyDetail,
} from "../../content/case-studies.ts";
import { CardBackArtwork } from "../ui/CardBackArtwork.tsx";
import {
  ArchitectureModal,
  type ArchitectureDetail,
} from "../ui/ArchitectureModal.tsx";

function MiniArchDiagram({
  nodes,
  onExpand,
}: {
  nodes: DiagramNode[];
  onExpand: () => void;
}) {
  return (
    <div
      className="lusion-mini-diagram-box"
      onClick={(e) => {
        e.stopPropagation();
        onExpand();
      }}
      role="button"
      tabIndex={0}
      aria-label="Click to expand architecture flow and Mermaid diagram"
    >
      <div className="diagram-popout-badge">
        <span>FLOW POP-OUT [↗]</span>
      </div>
      <svg
        viewBox="0 0 280 110"
        className="lusion-mini-svg"
        role="img"
        aria-label="Architecture dataflow summary"
      >
        <defs>
          <linearGradient id="fanWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {nodes.flatMap((node) => {
          const targets = node.connectsTo ?? [];
          return targets.map((targetId) => {
            const target = nodes.find((n) => n.id === targetId);
            if (!target) return null;
            return (
              <g key={`${node.id}-${targetId}`}>
                <line
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="rgba(56, 189, 248, 0.3)"
                  strokeWidth="1.2"
                />
                <line
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="url(#fanWireGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="arch-animated-wire"
                />
              </g>
            );
          });
        })}

        {nodes.map((node) => (
          <g key={node.id}>
            <rect
              x={`${node.x - 12}%`}
              y={`${node.y - 9}%`}
              width="24%"
              height="18%"
              rx="4"
              fill="#090d16"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="0.8"
            />
            <rect
              x={`${node.x - 12}%`}
              y={`${node.y - 9}%`}
              width="24%"
              height="2"
              rx="1"
              fill="#38bdf8"
            />
            <text
              x={`${node.x}%`}
              y={`${node.y + 2}%`}
              textAnchor="middle"
              fontSize="4.2"
              fontFamily="monospace"
              fontWeight="600"
              fill="#f8fafc"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function CaseStudies(): JSX.Element {
  const studies = getApprovedCaseStudies();
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / totalScroll));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openArchitectureModal = (study: CaseStudyDetail, index: number) => {
    if (!study) return;
    setSelectedArch({
      title: study.record.publicTitle,
      number: `/${String(index + 1).padStart(2, "0")}`,
      context: study.context,
      mermaidCode: study.mermaidDiagram,
      nodes: study.diagram,
      protocols: study.protocols,
      dataFlowDescription: study.dataFlowDescription,
    });
  };

  const jumpToProgress = (targetProgress: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const totalScroll = section.offsetHeight - window.innerHeight;
    const targetY = section.offsetTop + targetProgress * totalScroll;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const categories = [
    "01 // HARDWARE BRING-UP",
    "02 // DISTRIBUTED FLEET",
    "03 // AGENTIC WORKFLOW",
    "04 // SYSTEM AUTOMATION",
  ];

  return (
    <section
      ref={sectionRef}
      aria-label="Case studies"
      className="lusion-deck-scroll-section"
      id="work"
    >
      <div className="lusion-deck-sticky-stage">
        {/* Subtle Glassmorphic Curved Background Ribbon */}
        <svg className="lusion-bg-ribbon" viewBox="0 0 1440 600" aria-hidden="true">
          <path
            d="M -100,140 Q 720,500 1540,100"
            fill="none"
            stroke="rgba(56, 189, 248, 0.08)"
            strokeWidth="32"
          />
        </svg>

        <div className="lusion-deck-inner">
          {/* Section Header */}
          <div className="lusion-deck-header">
            <div className="lusion-header-left">
              <span className="lusion-section-pill">SELECTED MISSIONS // EVIDENCE-BACKED ARCHITECTURES</span>
              <h2 className="lusion-deck-title">Products with a pulse.</h2>
              <p className="lusion-deck-subtitle">
                Scroll to fan out and flip the mission deck — exploring real hardware bring-up,
                fleet runtimes, and verified production systems.
              </p>
            </div>

            {/* Step Scrubber */}
            <div className="lusion-deck-scrubber">
              {studies.map((study, idx) => (
                <button
                  key={study.record.slug}
                  type="button"
                  className={`lusion-scrub-btn ${
                    scrollProgress >= idx / 4 ? "active" : ""
                  }`}
                  onClick={() => jumpToProgress((idx + 0.8) / 4)}
                >
                  <span className="scrub-num">0{idx + 1}</span>
                  <span className="scrub-name">{study.record.publicTitle.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Thumb-Fanning Playing Card Deck Stage */}
          <div className="lusion-cards-stage">
            {studies.map((study, idx) => {
              const startP = idx * 0.22;
              const endP = startP + 0.28;
              const cardP = Math.max(0, Math.min(1, (scrollProgress - startP) / (endP - startP)));
              const isFlipped = cardP >= 0.5;
              const rotY = cardP * 180;

              // Initial thumb-fanned card deck position when P = 0
              const fanRotZ = (idx - 1.5) * 4.5;
              const fanOffsetX = (idx - 1.5) * 32;

              // Final horizontal spread position across the screen when fully revealed
              const targetSlotX = (idx - 1.5) * 345;

              const currentX = THREE_lerp(fanOffsetX, targetSlotX, cardP);
              const currentRotZ = THREE_lerp(fanRotZ, 0, cardP);
              const currentScale = THREE_lerp(0.94, 1.0, cardP);

              return (
                <div
                  key={study.record.slug}
                  className={`lusion-card-3d-wrapper ${isFlipped ? "card-revealed" : "card-facedown"}`}
                  style={{
                    transform: `translate3d(${currentX}px, 0px, 0px) rotateY(${rotY}deg) rotateZ(${currentRotZ}deg) scale(${currentScale})`,
                    zIndex: isFlipped ? 10 + idx : 4 - idx,
                  }}
                  onClick={() => {
                    if (!isFlipped) jumpToProgress((idx + 0.8) / 4);
                  }}
                >
                  {/* FRONT FACE (Dark Luxury Technical System Card) */}
                  <div
                    className="lusion-card-face lusion-card-front"
                    style={{ visibility: cardP > 0.05 ? "visible" : "hidden" }}
                  >
                    {/* Topline Header */}
                    <div className="card-front-top">
                      <div className="card-front-title-group">
                        <span className="card-front-category">{categories[idx]}</span>
                        <h3 className="card-front-title">{study.record.publicTitle}</h3>
                      </div>
                      <span className="card-front-badge">VERIFIED</span>
                    </div>

                    <p className="card-front-context">{study.context}</p>

                    {/* Miniature Architecture Flow Diagram with Modal Pop-out */}
                    <div className="card-front-diagram-wrap">
                      <div className="diagram-title-bar">
                        <span>DATAFLOW ARCHITECTURE</span>
                      </div>
                      <MiniArchDiagram
                        nodes={study.diagram}
                        onExpand={() => openArchitectureModal(study, idx)}
                      />
                    </div>

                    {/* Constraints & Solution Summary */}
                    <div className="card-front-details">
                      <span className="details-heading">CORE SUBSYSTEMS:</span>
                      <ul className="card-front-bullets">
                        {study.constraints.slice(0, 2).map((c, cIdx) => (
                          <li key={cIdx}>
                            <span className="bullet-dot" aria-hidden="true">▹</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Verified Metrics Strip */}
                    <div className="card-front-metrics">
                      {study.results.map((m) => (
                        <div key={m.label} className="card-metric-col">
                          <span className="card-metric-label">{m.label}</span>
                          <span className="card-metric-val">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Card Footer with Pop-Out Trigger */}
                    <div className="card-front-bottom">
                      <span className="card-footer-number">MISSION /{String(idx + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        className="card-arch-popout-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openArchitectureModal(study, idx);
                        }}
                      >
                        Flow Diagram [↗]
                      </button>
                    </div>
                  </div>

                  {/* BACK FACE (Ornate Dark Obsidian Geometric Circuit Artwork) */}
                  <div
                    className="lusion-card-face lusion-card-back"
                    style={{ visibility: cardP < 0.95 ? "visible" : "hidden" }}
                  >
                    <CardBackArtwork />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pop-Out Architecture Lightbox Modal with Mermaid view */}
      <ArchitectureModal
        isOpen={selectedArch !== null}
        onClose={() => setSelectedArch(null)}
        architecture={selectedArch}
      />
    </section>
  );
}

function THREE_lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
