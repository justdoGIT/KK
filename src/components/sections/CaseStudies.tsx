import { useState, useEffect, useRef, type JSX } from "react";
import {
  getApprovedCaseStudies,
  type DiagramNode,
  type CaseStudyDetail,
} from "../../content/case-studies.ts";
import { InteractiveVisual } from "../ui/InteractiveVisual.tsx";
import {
  ArchitectureModal,
  type ArchitectureDetail,
} from "../ui/ArchitectureModal.tsx";

function ArchitectureDiagram({
  nodes,
  onExpand,
}: {
  nodes: DiagramNode[];
  onExpand: () => void;
}) {
  return (
    <div
      className="arch-diagram-wrapper"
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Click to expand full architecture flow and Mermaid diagram"
    >
      <div className="arch-diagram-popout-badge">
        <span>FLOW POP-OUT [↗]</span>
      </div>
      <svg
        viewBox="0 0 280 120"
        className="arch-diagram"
        role="img"
        aria-label="Architecture diagram summary"
      >
        <defs>
          <linearGradient id="caseStudyWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  stroke="url(#caseStudyWireGrad)"
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
              x={`${node.x - 11}%`}
              y={`${node.y - 8}%`}
              width="22%"
              height="16%"
              rx="4"
              fill="#0f172a"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="0.8"
            />
            <rect
              x={`${node.x - 11}%`}
              y={`${node.y - 8}%`}
              width="22%"
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

function visualVariant(slug: string): "board" | "fleet" | "harness" | "career" {
  if (slug === "fleet-runtime") return "fleet";
  if (slug === "personal-agent-harness") return "harness";
  if (slug === "career-automation") return "career";
  return "board";
}

export function CaseStudies(): JSX.Element {
  const studies = getApprovedCaseStudies();
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const totalScrollDistance = rect.height - window.innerHeight;
      if (totalScrollDistance <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));
      const targetIndex = Math.round(progress * (studies.length - 1));
      setActiveIdx(Math.max(0, Math.min(studies.length - 1, targetIndex)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [studies.length]);

  const openArchitectureModal = (study: CaseStudyDetail, index: number) => {
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

  return (
    <section
      ref={sectionRef}
      aria-label="Case studies"
      className="case-studies-scroll-track"
      id="work"
    >
      <div className="case-studies-sticky-stage">
        <div className="case-studies-inner-container">
          {/* Section Header */}
          <div className="section-header case-studies-header">
            <div className="header-left">
              <p className="section-kicker">Selected Missions</p>
              <h2>Products with a pulse.</h2>
              <p className="section-subtitle">
                Evidence-backed case studies, shown as systems you can
                understand—not claims you have to take on faith.
              </p>
            </div>

            {/* Deck Stepper Navigation Controls */}
            <div className="deck-stepper-controls">
              <span className="deck-progress-indicator">
                MISSION {String(activeIdx + 1).padStart(2, "0")} / 0{studies.length}
              </span>
              <div className="deck-arrow-buttons">
                <button
                  type="button"
                  className="deck-arrow-btn"
                  onClick={() => setActiveIdx((p) => Math.max(0, p - 1))}
                  disabled={activeIdx === 0}
                  aria-label="Previous mission card"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="deck-arrow-btn"
                  onClick={() => setActiveIdx((p) => Math.min(studies.length - 1, p + 1))}
                  disabled={activeIdx === studies.length - 1}
                  aria-label="Next mission card"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Select Mission Tabs */}
          <div className="case-deck-nav-tabs" role="tablist" aria-label="Selected missions">
            {studies.map((study, idx) => (
              <button
                key={study.record.slug}
                type="button"
                role="tab"
                aria-selected={activeIdx === idx}
                className={`case-deck-tab ${activeIdx === idx ? "tab-active" : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                <span className="case-tab-num">/{String(idx + 1).padStart(2, "0")}</span>
                <span className="case-tab-title">{study.record.publicTitle}</span>
              </button>
            ))}
          </div>

          {/* Lusion-Style 3D Fanning Card Deck */}
          <div className="case-deck-viewport">
            {studies.map((study, index) => {
              const diff = index - activeIdx;
              const cardClass = diff === 0 ? "card-active-open" : diff < 0 ? "card-peeled-away" : "card-stacked";

              return (
                <article
                  key={study.record.slug}
                  className={`case-study-deck-card ${cardClass}`}
                  style={{
                    "--deck-diff": diff,
                    zIndex: diff === 0 ? 10 : diff < 0 ? 2 : 10 - diff,
                  } as React.CSSProperties}
                  aria-hidden={diff !== 0}
                >
                  <div className="study-deck-layout">
                    {/* Left Column: Mission Overview, Architecture Flow & Results */}
                    <div className="study-deck-left">
                      <div className="study-card-topbar">
                        <div className="study-heading">
                          <span className="study-number">
                            /{String(index + 1).padStart(2, "0")}
                          </span>
                          <h3>{study.record.publicTitle}</h3>
                        </div>
                        <span className="study-status-badge">PRODUCTION VERIFIED</span>
                      </div>

                      <p className="study-context">{study.context}</p>

                      <div className="study-diagram-container">
                        <span className="diagram-header-label">SYSTEM ARCHITECTURE DATAFLOW</span>
                        <ArchitectureDiagram
                          nodes={study.diagram}
                          onExpand={() => openArchitectureModal(study, index)}
                        />
                      </div>

                      <div className="study-results-block">
                        <span className="results-header-label">VERIFIED METRICS</span>
                        <dl className="results-grid">
                          {study.results.map((r) => (
                            <div key={r.label} className="result-item">
                              <dt>{r.label}</dt>
                              <dd>{r.value}</dd>
                              <span className="result-source">{r.source}</span>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {study.record.links.length > 0 && (
                        <div className="study-links">
                          {study.record.links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="study-link"
                            >
                              {link.label} <span aria-hidden="true">↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Interactive Illustration, Constraints & Solution */}
                    <div className="study-deck-right">
                      <div className="study-visual-wrapper">
                        <InteractiveVisual
                          label={`${study.record.publicTitle} interactive visual`}
                          variant={visualVariant(study.record.slug)}
                        />
                      </div>

                      <div className="study-details">
                        <h4>Constraints</h4>
                        <ul className="study-list">
                          {study.constraints.map((c) => (
                            <li key={c}>
                              <span className="constraint-bullet" aria-hidden="true">▹</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>

                        <h4>Solution Architecture</h4>
                        <p className="study-solution">{study.solution}</p>

                        <h4>Invariants &amp; Scope</h4>
                        <ul className="study-list study-limitations">
                          {study.limitations.map((l) => (
                            <li key={l}>
                              <span className="limit-bullet" aria-hidden="true">ℹ</span>
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <ArchitectureModal
        isOpen={selectedArch !== null}
        onClose={() => setSelectedArch(null)}
        architecture={selectedArch}
      />
    </section>
  );
}
