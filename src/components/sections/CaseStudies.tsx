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
  const width = 240;
  const height = 110;

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
          <linearGradient id="miniWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  stroke="url(#miniWireGrad)"
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
              y={`${node.y - 7}%`}
              width="22%"
              height="14%"
              rx="3"
              fill="#0f172a"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="0.8"
            />
            <rect
              x={`${node.x - 11}%`}
              y={`${node.y - 7}%`}
              width="22%"
              height="2"
              rx="1"
              fill="#38bdf8"
            />
            <text
              x={`${node.x}%`}
              y={`${node.y + 1.5}%`}
              textAnchor="middle"
              fontSize="3.8"
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
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(
    null,
  );

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
        <p className="section-kicker">Selected missions</p>
        <h2>Products with a pulse.</h2>
        <p className="section-subtitle">
          Evidence-backed case studies, shown as systems you can
          understand—not claims you have to take on faith.
        </p>
      </div>

      <div className="studies-grid">
        {studies.map((study, index) => (
          <article key={study.record.slug} className="study-card">
            <InteractiveVisual
              label={`${study.record.publicTitle} interactive visual`}
              variant={visualVariant(study.record.slug)}
            />

            <div className="study-heading">
              <span className="study-number">
                /{String(index + 1).padStart(2, "0")}
              </span>
              <h3>{study.record.publicTitle}</h3>
            </div>

            <p className="study-context">{study.context}</p>

            <ArchitectureDiagram
              nodes={study.diagram}
              onExpand={() => openArchitectureModal(study, index)}
            />

            <div className="study-details">
              <h4>Constraints</h4>
              <ul className="study-list">
                {study.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <h4>Solution</h4>
              <p className="study-solution">{study.solution}</p>
              <h4>Results</h4>
              <dl className="results-grid">
                {study.results.map((r) => (
                  <div key={r.label} className="result-item">
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                    <span className="result-source">{r.source}</span>
                  </div>
                ))}
              </dl>
              <h4>Limitations</h4>
              <ul className="study-list study-limitations">
                {study.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
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
                    {link.label}
                  </a>
                ))}
              </div>
            )}
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
