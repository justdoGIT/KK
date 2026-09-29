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
  const width = 280;
  const height = 120;

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
        viewBox={`0 0 ${width} ${height}`}
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

        {/* Connection Wires */}
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

        {/* Nodes */}
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
  const [activeCard, setActiveCard] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (intersecting?.target) {
          const index = cardRefs.current.indexOf(intersecting.target as HTMLElement);
          if (index >= 0) {
            setActiveCard(index);
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-10% 0px -20%" },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToCard = (index: number) => {
    setActiveCard(index);
    const el = cardRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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
    <section aria-label="Case studies" className="work-section" id="work">
      <div className="section-header">
        <p className="section-kicker">Selected Missions</p>
        <h2>Products with a pulse.</h2>
        <p className="section-subtitle">
          Evidence-backed case studies, shown as systems you can
          understand—not claims you have to take on faith.
        </p>
      </div>

      {/* Quick-Select Mission Tabs */}
      <div className="studies-deck-nav" role="tablist" aria-label="Selected missions">
        {studies.map((study, idx) => (
          <button
            key={study.record.slug}
            type="button"
            role="tab"
            aria-selected={activeCard === idx}
            className={`studies-deck-tab ${activeCard === idx ? "active" : ""}`}
            onClick={() => scrollToCard(idx)}
          >
            <span className="studies-tab-num">/{String(idx + 1).padStart(2, "0")}</span>
            <span className="studies-tab-title">{study.record.publicTitle}</span>
          </button>
        ))}
      </div>

      {/* Lusion-Style 4-Card Stacking Deck */}
      <div className="studies-deck-container">
        {studies.map((study, index) => (
          <article
            key={study.record.slug}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={`study-deck-card ${activeCard === index ? "card-focused" : ""}`}
            style={{
              top: `calc(5.5rem + ${index * 1.2}rem)`,
              zIndex: index + 1,
            }}
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

                {/* Architecture Flow Diagram with Pop-Out Button */}
                <div className="study-diagram-container">
                  <span className="diagram-header-label">SYSTEM ARCHITECTURE DATAFLOW</span>
                  <ArchitectureDiagram
                    nodes={study.diagram}
                    onExpand={() => openArchitectureModal(study, index)}
                  />
                </div>

                {/* Key Results Grid */}
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

                {/* External / Evidence Links */}
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
        ))}
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
