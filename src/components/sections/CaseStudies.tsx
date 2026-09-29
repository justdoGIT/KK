import { useState, type JSX } from "react";
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
  const [activeTab, setActiveTab] = useState<"constraints" | "solution" | "scope">("constraints");

  const activeStudy = studies[activeIdx] ?? studies[0];

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

      {/* Interactive Mission Control Radar Selector */}
      <div className="mission-control-selector" role="tablist" aria-label="Mission selector">
        {studies.map((study, idx) => (
          <button
            key={study.record.slug}
            type="button"
            role="tab"
            aria-selected={activeIdx === idx}
            className={`mission-selector-card ${activeIdx === idx ? "mission-active" : ""}`}
            onClick={() => setActiveIdx(idx)}
          >
            <div className="mission-sel-topline">
              <span className="mission-sel-num">/{String(idx + 1).padStart(2, "0")}</span>
              <span className={`mission-sel-dot ${activeIdx === idx ? "dot-live" : ""}`} />
            </div>
            <h3 className="mission-sel-title">{study.record.publicTitle}</h3>
            <span className="mission-sel-tag">
              {idx === 0
                ? "QUALCOMM BSP"
                : idx === 1
                  ? "DISTRIBUTED FLEET"
                  : idx === 2
                    ? "TERMINAL AGENT"
                    : "AUTOMATION ENGINE"}
            </span>
          </button>
        ))}
      </div>

      {/* Active Mission Interactive Cockpit / Stage */}
      <div className="mission-cockpit-stage">
        {/* Left Console: Architecture Dataflow & Telemetry */}
        <div className="mission-cockpit-left">
          <div className="cockpit-header">
            <div className="cockpit-title-wrap">
              <span className="cockpit-number">MISSION /{String(activeIdx + 1).padStart(2, "0")}</span>
              <h3 className="cockpit-title">{activeStudy.record.publicTitle}</h3>
            </div>
            <span className="cockpit-status-badge">PRODUCTION VERIFIED</span>
          </div>

          <p className="cockpit-context">{activeStudy.context}</p>

          {/* Architecture Flow Diagram with Lightbox Modal Pop-out */}
          <div className="cockpit-diagram-container">
            <div className="diagram-header-row">
              <span className="diagram-label">SYSTEM ARCHITECTURE DATAFLOW</span>
              <button
                type="button"
                className="diagram-popout-trigger"
                onClick={() => openArchitectureModal(activeStudy, activeIdx)}
              >
                Expand Flow [↗]
              </button>
            </div>
            <ArchitectureDiagram
              nodes={activeStudy.diagram}
              onExpand={() => openArchitectureModal(activeStudy, activeIdx)}
            />
          </div>

          {/* Verified Metrics */}
          <div className="cockpit-results-block">
            <span className="results-label">VERIFIED METRICS</span>
            <dl className="results-grid">
              {activeStudy.results.map((r) => (
                <div key={r.label} className="result-item">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                  <span className="result-source">{r.source}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* External / Evidence Links */}
          {activeStudy.record.links.length > 0 && (
            <div className="cockpit-links">
              {activeStudy.record.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="cockpit-link-btn"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Console: Interactive Visual Illustration & Technical Inspector */}
        <div className="mission-cockpit-right">
          {/* Large High-Definition Visual Canvas */}
          <div className="cockpit-visual-stage">
            <InteractiveVisual
              label={`${activeStudy.record.publicTitle} interactive visual`}
              variant={visualVariant(activeStudy.record.slug)}
            />
          </div>

          {/* Technical Inspector Tabs */}
          <div className="cockpit-inspector-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "constraints"}
              className={`inspector-tab ${activeTab === "constraints" ? "active" : ""}`}
              onClick={() => setActiveTab("constraints")}
            >
              Constraints &amp; Invariants
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "solution"}
              className={`inspector-tab ${activeTab === "solution" ? "active" : ""}`}
              onClick={() => setActiveTab("solution")}
            >
              Solution Architecture
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "scope"}
              className={`inspector-tab ${activeTab === "scope" ? "active" : ""}`}
              onClick={() => setActiveTab("scope")}
            >
              Invariants &amp; Scope
            </button>
          </div>

          {/* Inspector Content Panel */}
          <div className="cockpit-inspector-panel">
            {activeTab === "constraints" && (
              <ul className="inspector-list">
                {activeStudy.constraints.map((c) => (
                  <li key={c}>
                    <span className="item-bullet" aria-hidden="true">▹</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "solution" && (
              <p className="inspector-solution-text">{activeStudy.solution}</p>
            )}

            {activeTab === "scope" && (
              <ul className="inspector-list scope-list">
                {activeStudy.limitations.map((l) => (
                  <li key={l}>
                    <span className="scope-bullet" aria-hidden="true">ℹ</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            )}
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
